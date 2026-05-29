/**
 * PodcastAI Studio — Voice Library
 * All Gemini TTS available voices with metadata
 */

const VOICE_LIBRARY = [
  // ── Male Voices ──
  { id: 'Fenrir',   gender: 'male',   icon: '⚡', desc: 'Deep & Energetic',   tags: ['energetic','deep','bold'],       recommended: true,  recommendedFor: 'Xenon' },
  { id: 'Puck',     gender: 'male',   icon: '🎭', desc: 'Bright & Lively',    tags: ['bright','lively','fun'],          recommended: false },
  { id: 'Charon',   gender: 'male',   icon: '🌊', desc: 'Smooth & Calm',      tags: ['smooth','calm','professional'],   recommended: false },
  { id: 'Kore',     gender: 'neutral',icon: '🌿', desc: 'Warm & Friendly',    tags: ['warm','friendly','natural'],      recommended: false },
  { id: 'Aoede',    gender: 'female', icon: '🎵', desc: 'Clear & Professional',tags: ['clear','professional','crisp'],  recommended: false },
  { id: 'Orbit',    gender: 'male',   icon: '🪐', desc: 'Bold & Dynamic',     tags: ['bold','dynamic','strong'],        recommended: false },
  { id: 'Perseus',  gender: 'male',   icon: '🛡️', desc: 'Strong & Confident', tags: ['strong','confident','authoritative'], recommended: false },
  { id: 'Orus',     gender: 'male',   icon: '🔥', desc: 'Deep & Authoritative',tags: ['deep','authoritative','powerful'],recommended: false },
  { id: 'Algieba',  gender: 'male',   icon: '⭐', desc: 'Rich & Resonant',    tags: ['rich','resonant','mature'],       recommended: false },
  { id: 'Achernar', gender: 'male',   icon: '✨', desc: 'Crisp & Articulate', tags: ['crisp','articulate','precise'],   recommended: false },
  { id: 'Achird',   gender: 'male',   icon: '🎯', desc: 'Sharp & Clear',      tags: ['sharp','clear','focused'],        recommended: false },
  { id: 'Alsephina',gender: 'male',   icon: '💫', desc: 'Mellow & Smooth',    tags: ['mellow','smooth','relaxed'],      recommended: false },

  // ── Female Voices ──
  { id: 'Leda',     gender: 'female', icon: '✨', desc: 'Giggly & Playful',   tags: ['giggly','playful','fun'],         recommended: true,  recommendedFor: 'Silica' },
  { id: 'Zephyr',   gender: 'female', icon: '🌸', desc: 'Breathy & Soft',     tags: ['breathy','soft','gentle'],        recommended: false },
  { id: 'Autonoe',  gender: 'female', icon: '🌟', desc: 'Bright & Cheerful',  tags: ['bright','cheerful','upbeat'],     recommended: false },
  { id: 'Callirhoe',gender: 'female', icon: '🌺', desc: 'Sweet & Light',      tags: ['sweet','light','delicate'],       recommended: false },
  { id: 'Despina',  gender: 'female', icon: '💎', desc: 'Warm & Engaging',    tags: ['warm','engaging','approachable'],recommended: false },
  { id: 'Erinome',  gender: 'female', icon: '🎶', desc: 'Melodic & Clear',    tags: ['melodic','clear','musical'],      recommended: false },
  { id: 'Galatia',  gender: 'female', icon: '🦋', desc: 'Expressive & Vibrant',tags: ['expressive','vibrant','lively'], recommended: false },
  { id: 'Iocaste',  gender: 'female', icon: '💫', desc: 'Rich & Warm',        tags: ['rich','warm','soothing'],         recommended: false },
  { id: 'Umbriel',  gender: 'female', icon: '🌙', desc: 'Mysterious & Sultry',tags: ['mysterious','sultry','deep'],     recommended: false },
  { id: 'Vindemiatrix',gender:'female',icon:'🍇', desc: 'Smooth & Articulate', tags: ['smooth','articulate','refined'],  recommended: false },
  { id: 'Sulafat',  gender: 'female', icon: '🌊', desc: 'Flowing & Natural',  tags: ['flowing','natural','calm'],       recommended: false },

  // ── Neutral Voices ──
  { id: 'Schedar',  gender: 'neutral', icon: '🌌', desc: 'Neutral & Balanced',  tags: ['neutral','balanced','versatile'], recommended: false },
  { id: 'Sadachbia',gender: 'neutral', icon: '🔮', desc: 'Unique & Expressive', tags: ['unique','expressive','distinct'], recommended: false },
];

// Expression tag → emotional instruction mapping
const EXPRESSION_MAP = {
  'laughing':    'with genuine laughter and amusement in your voice',
  'excited':     'with high energy and excitement',
  'whispering':  'in a low, intimate whisper',
  'sad':         'with a touch of sadness and melancholy',
  'sarcastic':   'with playful sarcasm and dry wit',
  'curious':     'with curiosity and an inquisitive tone',
  'energetic':   'with vibrant, high-energy enthusiasm',
  'playful':     'in a light, teasing, playful manner',
  'dramatic':    'with dramatic flair and emphasis',
  'giggly':      'with a giggly, bubbly delivery',
  'shocked':     'with surprise and disbelief',
  'confident':   'with bold confidence and assertiveness',
  'nervous':     'with slight nervousness and uncertainty',
  'thoughtful':  'with thoughtful, measured pacing',
  'cheerful':    'with upbeat, cheerful energy',
  'serious':     'with a serious, earnest tone',
  'teasing':     'in a teasing, provocative way',
  'breathless':  'with breathless excitement',
};

/**
 * Parse raw expression tags from dialogue text
 * @param {string} text - Raw line text
 * @returns {{ expression: string|null, cleanText: string }}
 */
function parseExpression(text) {
  const match = text.match(/^\(([^)]+)\)\s*/);
  if (match) {
    return {
      expression: match[1].toLowerCase().trim(),
      cleanText: text.slice(match[0].length).trim()
    };
  }
  return { expression: null, cleanText: text.trim() };
}

/**
 * Get emotional instruction for an expression tag
 * @param {string} tag
 * @returns {string}
 */
function getEmotionalInstruction(tag) {
  if (!tag) return '';
  const key = tag.toLowerCase().trim();
  return EXPRESSION_MAP[key] || `with a ${key} tone`;
}
