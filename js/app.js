/**
 * PodcastAI Studio — Main Application Logic
 * Controls UI state, event handling, generation flow, and history
 */

'use strict';

/* ══════════════════════════════════════════════
   App State
   ══════════════════════════════════════════════ */
const AppState = {
  apiKey: '',
  currentAudioURL: null,
  currentAudioData: null,
  currentMimeType: null,
  isGenerating: false,
  history: [],
  promptExpanded: false,
  directorExpanded: false,
};

/* ══════════════════════════════════════════════
   Sample Script
   ══════════════════════════════════════════════ */
const SAMPLE_SCRIPT = `Xenon: (excited) Okay bestie, we NEED to talk about this viral skincare trend that literally broke the internet last week!
Silica: (giggly) Oh my GOD yes! I've been obsessed with this since Tuesday and I cannot stop thinking about it!
Xenon: (laughing) Right? And everyone's freaking out like it's the holy grail of skincare but nobody's actually explaining what it IS!
Silica: (sarcastic) Because explaining things is SO last season, apparently!
Xenon: (energetic) Okay so real talk — I tried it and honestly? My skin was like... wait what is happening right now?
Silica: (playful) See this is why I love you, you're always the guinea pig!
Xenon: (laughing) I literally signed up for this I can't even complain!
Silica: (curious) But okay for real though, was it actually worth the hype? Like did your skin glow?
Xenon: (dramatic) Bestie. I walked outside and a stranger complimented my skin. A STRANGER.
Silica: (shocked) NO WAY! Stop lying right now!
Xenon: (excited) I am DEAD serious! I have never been so shook in my life!
Silica: (giggly) Okay okay I'm running to get this immediately after we film! Subscribe for part two where I also ruin my life for content!`;

/* ══════════════════════════════════════════════
   DOM References
   ══════════════════════════════════════════════ */
const DOM = {};

function initDOM() {
  DOM.apiKeyModal    = document.getElementById('apiKeyModal');
  DOM.btnApiKey      = document.getElementById('btnApiKey');
  DOM.apiKeyInput    = document.getElementById('apiKeyInput');
  DOM.saveApiKey     = document.getElementById('saveApiKey');
  DOM.closeApiModal  = document.getElementById('closeApiModal');
  DOM.cancelApiModal = document.getElementById('cancelApiModal');
  DOM.toggleApiVis   = document.getElementById('toggleApiVis');

  DOM.scriptInput    = document.getElementById('scriptInput');
  DOM.speaker1Name   = document.getElementById('speaker1Name');
  DOM.speaker2Name   = document.getElementById('speaker2Name');
  DOM.speaker1Voice  = document.getElementById('speaker1Voice');
  DOM.speaker2Voice  = document.getElementById('speaker2Voice');
  DOM.directorNotes  = document.getElementById('directorNotes');
  DOM.langSelect     = document.getElementById('langSelect');
  DOM.audioQuality   = document.getElementById('audioQuality');
  DOM.modelSelect    = document.getElementById('modelSelect');

  DOM.btnGenerate     = document.getElementById('btnGenerate');
  DOM.btnLoadSample   = document.getElementById('btnLoadSample');
  DOM.btnClearScript  = document.getElementById('btnClearScript');
  DOM.btnSwapVoices   = document.getElementById('btnSwapVoices');
  DOM.btnRefreshPreview = document.getElementById('btnRefreshPreview');
  DOM.btnCopyPrompt   = document.getElementById('btnCopyPrompt');
  DOM.btnDownload     = document.getElementById('btnDownload');
  DOM.btnSaveHistory  = document.getElementById('btnSaveHistory');
  DOM.btnShareAudio   = document.getElementById('btnShareAudio');
  DOM.btnClearHistory = document.getElementById('btnClearHistory');

  DOM.scriptPreview   = document.getElementById('scriptPreview');
  DOM.promptPreview   = document.getElementById('promptPreview');
  DOM.promptBody      = document.getElementById('promptBody');
  DOM.promptChevron   = document.getElementById('promptChevron');

  DOM.audioPlayer     = document.getElementById('audioPlayer');
  DOM.audioPlayerWrap = document.getElementById('audioPlayerWrap');
  DOM.audioEmpty      = document.getElementById('audioEmpty');
  DOM.waveformCanvas  = document.getElementById('waveformCanvas');

  DOM.errorPanel      = document.getElementById('errorPanel');
  DOM.errorTitle      = document.getElementById('errorTitle');
  DOM.errorMessage    = document.getElementById('errorMessage');
  DOM.closeError      = document.getElementById('closeError');

  DOM.lineCount       = document.getElementById('lineCount');
  DOM.charCount       = document.getElementById('charCount');
  DOM.estDuration     = document.getElementById('estDuration');

  DOM.voicesGrid      = document.getElementById('voicesGrid');
  DOM.historyList     = document.getElementById('historyList');
  DOM.toastContainer  = document.getElementById('toastContainer');

  DOM.directorHeader  = document.getElementById('toggleDirectorNotes');
  DOM.directorBody    = document.getElementById('directorBody');
  DOM.directorChevron = document.getElementById('directorChevron');

  DOM.togglePromptSection = document.getElementById('togglePromptSection');

  // Tag buttons
  DOM.tagBtns = document.querySelectorAll('.tag-btn');
  // Nav buttons
  DOM.navBtns = document.querySelectorAll('.nav-btn');
  // Filter buttons
  DOM.filterBtns = document.querySelectorAll('.filter-btn');
}

/* ══════════════════════════════════════════════
   Toast Notifications
   ══════════════════════════════════════════════ */
function showToast(message, type = 'info', duration = 3000) {
  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i><span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ══════════════════════════════════════════════
   Error Panel
   ══════════════════════════════════════════════ */
function showError(title, message) {
  DOM.errorTitle.textContent = title;
  DOM.errorMessage.textContent = message;
  DOM.errorPanel.style.display = 'flex';
}
function hideError() {
  DOM.errorPanel.style.display = 'none';
}

/* ══════════════════════════════════════════════
   Script Preview
   ══════════════════════════════════════════════ */
function updateScriptPreview() {
  const raw = DOM.scriptInput.value;
  const spk1 = DOM.speaker1Name.value.trim() || 'Speaker 1';
  const spk2 = DOM.speaker2Name.value.trim() || 'Speaker 2';

  if (!raw.trim()) {
    DOM.scriptPreview.innerHTML = `
      <div class="preview-empty">
        <i class="fa-solid fa-scroll"></i>
        <p>Your formatted script will appear here.<br/>Start typing in the Script Editor →</p>
      </div>`;
    updateScriptStats([]);
    return;
  }

  const turns = parseScript(raw, spk1, spk2);
  updateScriptStats(turns);

  if (turns.length === 0) {
    DOM.scriptPreview.innerHTML = `
      <div class="preview-empty">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>No valid dialogue detected.<br/>Format: <code>Speaker: (expression) text</code></p>
      </div>`;
    return;
  }

  const html = turns.map(turn => {
    const isSpeaker1 = turn.speaker.toLowerCase() === spk1.toLowerCase();
    const lineClass = isSpeaker1 ? 'xenon-line' : 'silica-line';
    const expressionHtml = turn.expression
      ? `<span class="preview-expression">${turn.expression}</span>`
      : '';
    return `
      <div class="preview-line ${lineClass}">
        <span class="preview-speaker">${escapeHtml(turn.speaker)}</span>
        <span class="preview-text">${escapeHtml(turn.text)}</span>
        ${expressionHtml}
      </div>`;
  }).join('');

  DOM.scriptPreview.innerHTML = html;
}

function updateScriptStats(turns) {
  const rawText = DOM.scriptInput.value;
  const lines = turns.length;
  const chars = rawText.length;
  const estSecs = estimateAudioDuration(turns);

  DOM.lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
  DOM.charCount.textContent = `${chars} chars`;
  DOM.estDuration.textContent = estSecs > 0
    ? `~${estSecs < 60 ? estSecs + 's' : Math.round(estSecs / 60) + 'm'} audio`
    : '~0s audio';
}

/* ══════════════════════════════════════════════
   Prompt Preview Builder
   ══════════════════════════════════════════════ */
function updatePromptPreview() {
  const raw = DOM.scriptInput.value.trim();
  if (!raw) {
    DOM.promptPreview.textContent = '// Generate a script to see the API prompt that will be sent to Gemini TTS';
    return;
  }

  const spk1 = DOM.speaker1Name.value.trim() || 'Speaker 1';
  const spk2 = DOM.speaker2Name.value.trim() || 'Speaker 2';
  const turns = parseScript(raw, spk1, spk2);

  if (turns.length === 0) return;

  const requestBody = buildTTSRequest({
    turns,
    speaker1Name: spk1,
    speaker1Voice: DOM.speaker1Voice.value,
    speaker2Name: spk2,
    speaker2Voice: DOM.speaker2Voice.value,
    directorNotes: DOM.directorNotes.value,
    model: DOM.modelSelect.value,
  });

  DOM.promptPreview.textContent = JSON.stringify(requestBody, null, 2);
}

/* ══════════════════════════════════════════════
   Generation Flow
   ══════════════════════════════════════════════ */
async function generateAudio() {
  if (AppState.isGenerating) return;

  // Validate API key
  const apiKey = AppState.apiKey || localStorage.getItem('gemini_api_key');
  if (!apiKey || !apiKey.trim()) {
    showError('API Key Required', 'Please add your Gemini API key first. Click the "API Key" button in the top right.');
    DOM.apiKeyModal.classList.add('open');
    return;
  }

  // Validate script
  const raw = DOM.scriptInput.value.trim();
  if (!raw) {
    showError('Empty Script', 'Please enter your podcast dialogue before generating.');
    return;
  }

  const spk1 = DOM.speaker1Name.value.trim() || 'Speaker 1';
  const spk2 = DOM.speaker2Name.value.trim() || 'Speaker 2';
  const turns = parseScript(raw, spk1, spk2);

  if (turns.length === 0) {
    showError('No Dialogue Found', 'Could not parse any dialogue. Format: "SpeakerName: (expression) text"');
    return;
  }

  // Start generation
  AppState.isGenerating = true;
  hideError();
  setGeneratingState(true);

  // Build request
  const requestBody = buildTTSRequest({
    turns,
    speaker1Name: spk1,
    speaker1Voice: DOM.speaker1Voice.value,
    speaker2Name: spk2,
    speaker2Voice: DOM.speaker2Voice.value,
    directorNotes: DOM.directorNotes.value,
    model: DOM.modelSelect.value,
  });

  try {
    const { audioData, mimeType } = await callGeminiTTS(
      requestBody,
      apiKey.trim(),
      (progress, label) => updateProgressLabel(label)
    );

    updateProgressLabel('Rendering audio player...');

    // Store audio data
    AppState.currentAudioData = audioData;
    AppState.currentMimeType = mimeType;

    // Create audio URL
    if (AppState.currentAudioURL) {
      URL.revokeObjectURL(AppState.currentAudioURL);
    }
    AppState.currentAudioURL = createAudioURL(audioData, mimeType);

    // Update audio player
    DOM.audioPlayer.src = AppState.currentAudioURL;
    DOM.audioPlayerWrap.style.display = 'block';
    DOM.audioEmpty.style.display = 'none';

    // Draw waveform
    try {
      await drawWaveform(DOM.waveformCanvas, audioData);
    } catch (e) {
      console.warn('Waveform draw failed:', e);
    }

    // Update prompt preview
    updatePromptPreview();

    showToast('🎙️ Audio generated successfully!', 'success');
    AppState.isGenerating = false;
    setGeneratingState(false);

  } catch (err) {
    console.error('TTS Error:', err);
    AppState.isGenerating = false;
    setGeneratingState(false);

    const errMessage = err.message || 'Unknown error occurred';

    // Friendly error messages
    let friendlyMsg = errMessage;
    if (errMessage.includes('API key')) {
      friendlyMsg = 'Invalid API key. Please check your Gemini API key and try again.';
    } else if (errMessage.includes('quota') || errMessage.includes('429')) {
      friendlyMsg = 'API quota exceeded. Please wait a moment and try again.';
    } else if (errMessage.includes('PERMISSION_DENIED')) {
      friendlyMsg = 'API key does not have permission to use TTS. Enable the Generative Language API.';
    } else if (errMessage.includes('model')) {
      friendlyMsg = 'TTS model not available. Try selecting a different model.';
    } else if (errMessage.includes('network') || errMessage.includes('Failed to fetch')) {
      friendlyMsg = 'Network error. Please check your internet connection.';
    }

    showError('Generation Failed', friendlyMsg);
    showToast('Generation failed', 'error');
  }
}

function setGeneratingState(isGenerating) {
  DOM.btnGenerate.disabled = isGenerating;
  document.querySelector('.btn-generate-content').style.display = isGenerating ? 'none' : 'flex';
  document.querySelector('.btn-generate-loading').style.display = isGenerating ? 'flex' : 'none';
}

let progressInterval = null;
const progressMessages = [
  'Sending script to Gemini TTS...',
  'Assigning voices to speakers...',
  'Applying emotional instructions...',
  'Synthesizing speech...',
  'Processing audio data...',
  'Almost ready...'
];
let progressMsgIdx = 0;

function updateProgressLabel(label) {
  const loadingSpan = document.querySelector('.btn-generate-loading span');
  if (loadingSpan && label) loadingSpan.textContent = label;
}

/* ══════════════════════════════════════════════
   Download Audio
   ══════════════════════════════════════════════ */
function downloadAudio() {
  if (!AppState.currentAudioURL) {
    showToast('No audio to download', 'error');
    return;
  }

  const link = document.createElement('a');
  link.href = AppState.currentAudioURL;
  link.download = `podcast-${Date.now()}.wav`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Downloading audio...', 'success');
}

/* ══════════════════════════════════════════════
   History Management
   ══════════════════════════════════════════════ */
function saveToHistory() {
  if (!AppState.currentAudioURL) {
    showToast('No audio to save', 'error');
    return;
  }

  const spk1 = DOM.speaker1Name.value.trim() || 'Speaker 1';
  const spk2 = DOM.speaker2Name.value.trim() || 'Speaker 2';
  const turns = parseScript(DOM.scriptInput.value, spk1, spk2);
  const preview = turns.slice(0, 2).map(t => `${t.speaker}: ${t.text.slice(0, 40)}...`).join(' | ');

  const item = {
    id: Date.now(),
    title: preview || 'Podcast Episode',
    speaker1: spk1,
    speaker2: spk2,
    voice1: DOM.speaker1Voice.value,
    voice2: DOM.speaker2Voice.value,
    model: DOM.modelSelect.value,
    lines: turns.length,
    audioURL: AppState.currentAudioURL,
    script: DOM.scriptInput.value,
    createdAt: new Date().toISOString(),
    duration: DOM.audioPlayer.duration || 0,
  };

  AppState.history.unshift(item);
  saveHistoryToStorage();
  renderHistory();
  showToast('Saved to history!', 'success');
}

function saveHistoryToStorage() {
  try {
    // Only save metadata (not audio blob URLs as they expire)
    const storable = AppState.history.map(item => ({
      ...item,
      audioURL: null, // can't persist blob URLs
    }));
    localStorage.setItem('podcast_history', JSON.stringify(storable.slice(0, 20)));
  } catch (e) { console.warn('Storage save failed:', e); }
}

function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem('podcast_history');
    if (raw) AppState.history = JSON.parse(raw);
  } catch (e) { AppState.history = []; }
}

function renderHistory() {
  if (AppState.history.length === 0) {
    DOM.historyList.innerHTML = `
      <div class="history-empty">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <p>No history yet. Generate some audio to get started!</p>
      </div>`;
    return;
  }

  DOM.historyList.innerHTML = AppState.history.map(item => {
    const date = new Date(item.createdAt).toLocaleString();
    const durStr = item.duration ? `${Math.round(item.duration)}s` : '—';
    const hasAudio = !!item.audioURL;
    return `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item-icon">
          <i class="fa-solid fa-podcast"></i>
        </div>
        <div class="history-item-info">
          <div class="history-item-title">${escapeHtml(item.title)}</div>
          <div class="history-item-meta">
            <span><i class="fa-solid fa-microphone"></i> ${escapeHtml(item.speaker1)} (${escapeHtml(item.voice1)}) & ${escapeHtml(item.speaker2)} (${escapeHtml(item.voice2)})</span>
            <span><i class="fa-solid fa-list"></i> ${item.lines} lines</span>
            <span><i class="fa-solid fa-clock"></i> ${date}</span>
            ${hasAudio ? `<span><i class="fa-solid fa-waveform-lines"></i> ${durStr}</span>` : ''}
          </div>
        </div>
        <div class="history-item-actions">
          <button class="icon-btn" title="Load Script" onclick="loadHistoryItem(${item.id})">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </button>
          ${hasAudio ? `<button class="icon-btn" title="Play" onclick="playHistoryItem(${item.id})"><i class="fa-solid fa-play"></i></button>` : ''}
          <button class="icon-btn" title="Delete" onclick="deleteHistoryItem(${item.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

window.loadHistoryItem = function(id) {
  const item = AppState.history.find(h => h.id === id);
  if (!item) return;
  DOM.scriptInput.value = item.script || '';
  DOM.speaker1Name.value = item.speaker1 || 'Xenon';
  DOM.speaker2Name.value = item.speaker2 || 'Silica';
  if (item.voice1) DOM.speaker1Voice.value = item.voice1;
  if (item.voice2) DOM.speaker2Voice.value = item.voice2;
  if (item.model) DOM.modelSelect.value = item.model;
  updateScriptPreview();
  updatePromptPreview();
  switchTab('studio');
  showToast('Script loaded!', 'success');
};

window.playHistoryItem = function(id) {
  const item = AppState.history.find(h => h.id === id);
  if (!item || !item.audioURL) {
    showToast('Audio no longer available (blob URLs expire on reload)', 'error');
    return;
  }
  DOM.audioPlayer.src = item.audioURL;
  DOM.audioPlayerWrap.style.display = 'block';
  DOM.audioEmpty.style.display = 'none';
  DOM.audioPlayer.play();
  switchTab('studio');
};

window.deleteHistoryItem = function(id) {
  AppState.history = AppState.history.filter(h => h.id !== id);
  saveHistoryToStorage();
  renderHistory();
  showToast('Deleted', 'info');
};

/* ══════════════════════════════════════════════
   Tab Navigation
   ══════════════════════════════════════════════ */
function switchTab(tabName) {
  DOM.navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
}

/* ══════════════════════════════════════════════
   Voices Page
   ══════════════════════════════════════════════ */
function renderVoicesGrid(filter = 'all') {
  const filtered = filter === 'all'
    ? VOICE_LIBRARY
    : VOICE_LIBRARY.filter(v => v.gender === filter);

  DOM.voicesGrid.innerHTML = filtered.map(voice => {
    const isActive =
      DOM.speaker1Voice.value === voice.id ||
      DOM.speaker2Voice.value === voice.id;
    const recommendedBadge = voice.recommended
      ? `<span class="voice-tag" style="background:rgba(168,85,247,0.15);color:#a855f7">★ ${voice.recommendedFor}</span>`
      : '';
    return `
      <div class="voice-card ${isActive ? 'active-voice' : ''}" data-voice="${voice.id}" data-gender="${voice.gender}">
        <div class="voice-card-avatar ${voice.gender}">${voice.icon}</div>
        <div class="voice-card-name">${voice.id}</div>
        <div class="voice-card-desc">${voice.desc}</div>
        <div class="voice-card-tags">
          ${recommendedBadge}
          ${voice.tags.map(t => `<span class="voice-tag">${t}</span>`).join('')}
          <span class="voice-tag ${voice.gender}">${voice.gender}</span>
        </div>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   Expression Tag Buttons
   ══════════════════════════════════════════════ */
function insertTag(tag) {
  const textarea = DOM.scriptInput;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  // If there's selected text (a line), wrap it
  if (start !== end) {
    const selected = text.slice(start, end);
    const newText = `(${tag}) ${selected}`;
    textarea.value = text.slice(0, start) + newText + text.slice(end);
    textarea.selectionStart = start;
    textarea.selectionEnd = start + newText.length;
  } else {
    // Insert at cursor position
    const insert = `(${tag}) `;
    textarea.value = text.slice(0, start) + insert + text.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + insert.length;
  }

  textarea.focus();
  updateScriptPreview();
}

/* ══════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ══════════════════════════════════════════════
   API Key Management
   ══════════════════════════════════════════════ */
function loadApiKey() {
  const key = localStorage.getItem('gemini_api_key');
  if (key) {
    AppState.apiKey = key;
    DOM.apiKeyInput.value = key;
    // Show indicator on button
    DOM.btnApiKey.innerHTML = '<i class="fa-solid fa-key"></i> Key Set ✓';
    DOM.btnApiKey.style.borderColor = 'rgba(34,197,94,0.4)';
    DOM.btnApiKey.style.color = '#22c55e';
  }
}

function saveApiKeyAction() {
  const key = DOM.apiKeyInput.value.trim();
  if (!key) {
    showToast('Please enter an API key', 'error');
    return;
  }
  AppState.apiKey = key;
  localStorage.setItem('gemini_api_key', key);
  DOM.apiKeyModal.classList.remove('open');
  DOM.btnApiKey.innerHTML = '<i class="fa-solid fa-key"></i> Key Set ✓';
  DOM.btnApiKey.style.borderColor = 'rgba(34,197,94,0.4)';
  DOM.btnApiKey.style.color = '#22c55e';
  showToast('API key saved!', 'success');
}

/* ══════════════════════════════════════════════
   Event Listeners
   ══════════════════════════════════════════════ */
function bindEvents() {
  // ── API Key Modal ──
  DOM.btnApiKey.addEventListener('click', () => {
    loadApiKey();
    DOM.apiKeyModal.classList.add('open');
  });
  DOM.closeApiModal.addEventListener('click', () => DOM.apiKeyModal.classList.remove('open'));
  DOM.cancelApiModal.addEventListener('click', () => DOM.apiKeyModal.classList.remove('open'));
  DOM.apiKeyModal.addEventListener('click', e => {
    if (e.target === DOM.apiKeyModal) DOM.apiKeyModal.classList.remove('open');
  });
  DOM.saveApiKey.addEventListener('click', saveApiKeyAction);
  DOM.apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveApiKeyAction(); });
  DOM.toggleApiVis.addEventListener('click', () => {
    const isPass = DOM.apiKeyInput.type === 'password';
    DOM.apiKeyInput.type = isPass ? 'text' : 'password';
    DOM.toggleApiVis.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  });

  // ── Script Editing ──
  const debouncedPreview = debounce(updateScriptPreview, 300);
  DOM.scriptInput.addEventListener('input', debouncedPreview);
  DOM.speaker1Name.addEventListener('input', debouncedPreview);
  DOM.speaker2Name.addEventListener('input', debouncedPreview);

  DOM.btnLoadSample.addEventListener('click', () => {
    DOM.scriptInput.value = SAMPLE_SCRIPT;
    updateScriptPreview();
    showToast('Sample script loaded!', 'info');
  });

  DOM.btnClearScript.addEventListener('click', () => {
    if (DOM.scriptInput.value && confirm('Clear the entire script?')) {
      DOM.scriptInput.value = '';
      updateScriptPreview();
      showToast('Script cleared', 'info');
    }
  });

  DOM.btnSwapVoices.addEventListener('click', () => {
    const tmpVoice = DOM.speaker1Voice.value;
    DOM.speaker1Voice.value = DOM.speaker2Voice.value;
    DOM.speaker2Voice.value = tmpVoice;
    const tmpName = DOM.speaker1Name.value;
    DOM.speaker1Name.value = DOM.speaker2Name.value;
    DOM.speaker2Name.value = tmpName;
    updateScriptPreview();
    showToast('Voices swapped!', 'info');
  });

  DOM.btnRefreshPreview.addEventListener('click', () => {
    updateScriptPreview();
    updatePromptPreview();
    showToast('Preview updated', 'info');
  });

  // ── Expression Tag Buttons ──
  DOM.tagBtns.forEach(btn => {
    btn.addEventListener('click', () => insertTag(btn.dataset.tag));
  });

  // ── Director Notes Toggle ──
  DOM.directorHeader.addEventListener('click', () => {
    AppState.directorExpanded = !AppState.directorExpanded;
    DOM.directorBody.classList.toggle('open', AppState.directorExpanded);
    DOM.directorChevron.style.transform = AppState.directorExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  // ── Generate Button ──
  DOM.btnGenerate.addEventListener('click', generateAudio);

  // ── Prompt section toggle ──
  DOM.togglePromptSection.addEventListener('click', () => {
    AppState.promptExpanded = !AppState.promptExpanded;
    DOM.promptBody.style.display = AppState.promptExpanded ? 'block' : 'none';
    DOM.promptChevron.style.transform = AppState.promptExpanded ? 'rotate(180deg)' : '';
    if (AppState.promptExpanded) updatePromptPreview();
  });

  DOM.btnCopyPrompt.addEventListener('click', () => {
    const text = DOM.promptPreview.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Prompt copied to clipboard!', 'success');
    });
  });

  // ── Audio Actions ──
  DOM.btnDownload.addEventListener('click', downloadAudio);
  DOM.btnSaveHistory.addEventListener('click', saveToHistory);
  DOM.btnShareAudio.addEventListener('click', () => {
    if (AppState.currentAudioURL && navigator.share) {
      navigator.share({ title: 'My Podcast', url: window.location.href });
    } else {
      showToast('Copy the download link to share', 'info');
    }
  });

  // ── Error panel close ──
  DOM.closeError.addEventListener('click', hideError);

  // ── Tab navigation ──
  DOM.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
      if (tab === 'voices') renderVoicesGrid();
      if (tab === 'history') renderHistory();
    });
  });

  // ── Voice filters ──
  DOM.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderVoicesGrid(btn.dataset.filter);
    });
  });

  // ── Voice card click (assign to speaker) ──
  DOM.voicesGrid.addEventListener('click', e => {
    const card = e.target.closest('.voice-card');
    if (!card) return;
    const voiceId = card.dataset.voice;
    const gender = card.dataset.gender;
    // Smart assignment based on gender
    if (gender === 'female') {
      DOM.speaker2Voice.value = voiceId;
      showToast(`${voiceId} assigned to ${DOM.speaker2Name.value}`, 'success');
    } else {
      DOM.speaker1Voice.value = voiceId;
      showToast(`${voiceId} assigned to ${DOM.speaker1Name.value}`, 'success');
    }
    renderVoicesGrid(document.querySelector('.filter-btn.active').dataset.filter);
  });

  // ── Clear history ──
  DOM.btnClearHistory.addEventListener('click', () => {
    if (AppState.history.length && confirm('Clear all history?')) {
      AppState.history = [];
      saveHistoryToStorage();
      renderHistory();
      showToast('History cleared', 'info');
    }
  });

  // ── Update speaker style labels ──
  DOM.speaker1Voice.addEventListener('change', () => {
    const voice = VOICE_LIBRARY.find(v => v.id === DOM.speaker1Voice.value);
    if (voice) {
      document.querySelector('.xenon .speaker-style').textContent = voice.tags.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' · ');
    }
  });
  DOM.speaker2Voice.addEventListener('change', () => {
    const voice = VOICE_LIBRARY.find(v => v.id === DOM.speaker2Voice.value);
    if (voice) {
      document.querySelector('.silica .speaker-style').textContent = voice.tags.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' · ');
    }
  });
}

/* ══════════════════════════════════════════════
   Keyboard Shortcuts
   ══════════════════════════════════════════════ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + Enter → Generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateAudio();
    }
    // Escape → close modal
    if (e.key === 'Escape') {
      DOM.apiKeyModal.classList.remove('open');
      hideError();
    }
  });
}

/* ══════════════════════════════════════════════
   Animate counters (startup feel)
   ══════════════════════════════════════════════ */
function showWelcomeHint() {
  setTimeout(() => {
    if (!AppState.apiKey && !localStorage.getItem('gemini_api_key')) {
      showToast('👋 Add your Gemini API key to get started!', 'info', 5000);
    }
  }, 800);
}

/* ══════════════════════════════════════════════
   App Init
   ══════════════════════════════════════════════ */
function init() {
  initDOM();
  loadApiKey();
  loadHistoryFromStorage();
  bindEvents();
  initKeyboardShortcuts();

  // Load sample script automatically
  DOM.scriptInput.value = SAMPLE_SCRIPT;
  updateScriptPreview();

  // Open director notes by default
  AppState.directorExpanded = true;
  DOM.directorBody.classList.add('open');
  DOM.directorChevron.style.transform = 'rotate(180deg)';

  showWelcomeHint();

  console.log('%c🎙️ PodcastAI Studio loaded!', 'color: #a855f7; font-size: 16px; font-weight: bold;');
  console.log('%cKeyboard shortcuts: Ctrl+Enter = Generate', 'color: #9ca3af;');
}

document.addEventListener('DOMContentLoaded', init);
