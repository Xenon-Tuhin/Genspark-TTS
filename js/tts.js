/**
 * PodcastAI Studio — TTS Engine
 * Handles Gemini TTS API calls, script parsing, and audio processing
 */

'use strict';

/* ══════════════════════════════════════════════
   Script Parser
   ══════════════════════════════════════════════ */

/**
 * Parse a podcast script into structured turns
 * Supports: "SpeakerName: (expression) text"
 * @param {string} rawScript
 * @param {string} speaker1 - Name of speaker 1
 * @param {string} speaker2 - Name of speaker 2
 * @returns {Array<{speaker: string, expression: string|null, text: string, speakerIndex: number}>}
 */
function parseScript(rawScript, speaker1, speaker2) {
  const lines = rawScript.split('\n').map(l => l.trim()).filter(Boolean);
  const turns = [];

  // Build a flexible regex that matches any speaker
  const allSpeakers = [speaker1, speaker2].filter(Boolean);

  for (const line of lines) {
    // Try to match "SpeakerName: rest"
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const potentialSpeaker = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    if (!rest) continue;

    // Find which speaker this is (case-insensitive)
    const matchedSpeaker = allSpeakers.find(s =>
      s.toLowerCase() === potentialSpeaker.toLowerCase()
    );

    if (!matchedSpeaker && !potentialSpeaker) continue;

    const speakerName = matchedSpeaker || potentialSpeaker;
    const speakerIndex = allSpeakers.findIndex(s =>
      s.toLowerCase() === speakerName.toLowerCase()
    );

    const { expression, cleanText } = parseExpression(rest);

    if (cleanText) {
      turns.push({
        speaker: speakerName,
        expression,
        text: cleanText,
        speakerIndex: speakerIndex >= 0 ? speakerIndex : 0,
      });
    }
  }

  return turns;
}

/* ══════════════════════════════════════════════
   Prompt Builder
   ══════════════════════════════════════════════ */

/**
 * Build the Gemini TTS API request body for multi-speaker dialogue
 * @param {Object} config
 * @param {Array} config.turns - Parsed dialogue turns
 * @param {string} config.speaker1Name
 * @param {string} config.speaker1Voice
 * @param {string} config.speaker2Name
 * @param {string} config.speaker2Voice
 * @param {string} config.directorNotes
 * @param {string} config.model
 * @returns {Object} - Full API request body
 */
function buildTTSRequest(config) {
  const {
    turns,
    speaker1Name,
    speaker1Voice,
    speaker2Name,
    speaker2Voice,
    directorNotes,
    model = 'gemini-3.1-flash-tts-preview'
  } = config;

  // Build the multi-turn dialogue text with emotional instructions
  let dialogueText = '';
  if (directorNotes && directorNotes.trim()) {
    dialogueText += `[DIRECTOR'S NOTES: ${directorNotes.trim()}]\n\n`;
  }

  for (const turn of turns) {
    const emotionInstruction = turn.expression
      ? getEmotionalInstruction(turn.expression)
      : '';

    if (emotionInstruction) {
      dialogueText += `${turn.speaker}: <${emotionInstruction}> "${turn.text}"\n`;
    } else {
      dialogueText += `${turn.speaker}: "${turn.text}"\n`;
    }
  }

  // Build speaker voice configs
  const speakerVoiceConfigs = [
    {
      speaker: speaker1Name,
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: speaker1Voice
        }
      }
    },
    {
      speaker: speaker2Name,
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: speaker2Voice
        }
      }
    }
  ];

  return {
    model,
    contents: [
      {
        parts: [{ text: dialogueText }]
      }
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs
        }
      }
    }
  };
}

/* ══════════════════════════════════════════════
   Gemini TTS API Call
   ══════════════════════════════════════════════ */

/**
 * Call Gemini TTS API
 * @param {Object} requestBody
 * @param {string} apiKey
 * @param {Function} onProgress - progress callback (0-100)
 * @returns {Promise<{ audioData: Uint8Array, mimeType: string }>}
 */
async function callGeminiTTS(requestBody, apiKey, onProgress) {
  const model = requestBody.model || 'gemini-3.1-flash-tts-preview';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  onProgress && onProgress(10, 'Connecting to Gemini TTS...');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  onProgress && onProgress(40, 'Processing dialogue...');

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `API Error ${response.status}`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson?.error?.message || errMsg;
    } catch (e) { /* ignore */ }
    throw new Error(errMsg);
  }

  onProgress && onProgress(70, 'Decoding audio...');

  const data = await response.json();

  // Extract audio from response
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('No content in API response. Check your script and API key.');
  }

  const audioPart = parts.find(p => p.inlineData);
  if (!audioPart) {
    throw new Error('No audio data in response. Make sure your model supports TTS.');
  }

  const base64Audio = audioPart.inlineData.data;
  const mimeType = audioPart.inlineData.mimeType || 'audio/wav';

  // Decode base64 to Uint8Array
  const binaryStr = atob(base64Audio);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  onProgress && onProgress(95, 'Preparing audio player...');

  return { audioData: bytes, mimeType };
}

/* ══════════════════════════════════════════════
   PCM → WAV Converter
   ══════════════════════════════════════════════ */

/**
 * Convert raw PCM data to WAV blob
 * @param {Uint8Array} pcmData - Raw linear16 PCM data
 * @param {number} sampleRate - Sample rate (default 24000)
 * @param {number} numChannels - Channels (default 1)
 * @returns {Blob}
 */
function pcmToWav(pcmData, sampleRate = 24000, numChannels = 1) {
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // RIFF chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);          // PCM
  view.setUint16(20, 1, true);           // AudioFormat = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  const audioView = new Uint8Array(buffer, 44);
  audioView.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/* ══════════════════════════════════════════════
   Audio Helpers
   ══════════════════════════════════════════════ */

/**
 * Create a Blob URL from audio data
 * @param {Uint8Array} audioData
 * @param {string} mimeType
 * @returns {string} Object URL
 */
function createAudioURL(audioData, mimeType) {
  // Check if it's raw PCM or already WAV/MP3
  const isRawPCM = mimeType === 'audio/pcm' || mimeType === 'audio/l16' || !mimeType.includes('wav');

  let blob;
  if (isRawPCM) {
    blob = pcmToWav(audioData, 24000, 1);
  } else {
    blob = new Blob([audioData], { type: mimeType });
  }

  return URL.createObjectURL(blob);
}

/**
 * Draw waveform visualization on canvas
 * @param {HTMLCanvasElement} canvas
 * @param {Uint8Array} audioData
 */
async function drawWaveform(canvas, audioData) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;

  ctx.clearRect(0, 0, width, height);

  // Create audio context to decode
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(audioData.buffer.slice(0));
    const channelData = decoded.getChannelData(0);

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(168,85,247,0.9)');
    gradient.addColorStop(0.5, 'rgba(236,72,153,0.9)');
    gradient.addColorStop(1, 'rgba(6,182,212,0.9)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const sliceWidth = width / channelData.length;
    let x = 0;

    for (let i = 0; i < channelData.length; i++) {
      const y = ((channelData[i] + 1) / 2) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();

    audioCtx.close();
  } catch (e) {
    // Fallback: draw bars from raw bytes
    drawSimpleWaveform(ctx, audioData, width, height);
  }
}

function drawSimpleWaveform(ctx, audioData, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgba(168,85,247,0.8)');
  gradient.addColorStop(0.5, 'rgba(236,72,153,0.8)');
  gradient.addColorStop(1, 'rgba(6,182,212,0.8)');

  const step = Math.floor(audioData.length / width);
  const midY = height / 2;

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1;

  // Draw as Int16 values
  const int16Data = new Int16Array(audioData.buffer, 0, Math.floor(audioData.length / 2));
  const samplesPerPixel = Math.floor(int16Data.length / width);

  ctx.beginPath();
  for (let i = 0; i < width; i++) {
    const sampleIdx = i * samplesPerPixel;
    if (sampleIdx >= int16Data.length) break;
    const sample = int16Data[sampleIdx] / 32768;
    const y = midY + sample * midY * 0.8;
    if (i === 0) ctx.moveTo(i, y);
    else ctx.lineTo(i, y);
  }
  ctx.stroke();
}

/**
 * Estimate audio duration from script (rough approximation)
 * ~150 words per minute average speech rate
 */
function estimateAudioDuration(turns) {
  const totalWords = turns.reduce((acc, t) => {
    return acc + t.text.split(/\s+/).filter(Boolean).length;
  }, 0);
  const minutes = totalWords / 150;
  const seconds = Math.round(minutes * 60);
  return seconds;
}
