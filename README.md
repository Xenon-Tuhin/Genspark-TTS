# 🎙️ PodcastAI Studio

An AI-powered podcast TTS generator using **Google Gemini TTS API**. Input a multi-speaker dialogue, assign unique voices, add expression tags, and generate natural-sounding podcast audio — all in the browser.

---

## ✅ Completed Features

### Core Functionality
- **Multi-Speaker TTS** via Gemini 2.5 Flash TTS and 2.5 Pro TTS models
- **Two preconfigured speakers**: Xenon (Fenrir voice — male, energetic) & Silica (Leda voice — female, giggly)
- **Expression tag system** — `(laughing)`, `(excited)`, `(whispering)`, `(sad)`, `(sarcastic)`, `(curious)`, `(energetic)`, `(playful)`, `(dramatic)` and more get converted to emotional instructions
- **Director's Notes** — extra context/style instructions passed to the TTS model
- **Script parser** — supports `Speaker: (expression) dialogue text` format
- **Real-time script preview** with color-coded speaker lines
- **Auto-prompt builder** — assembles the full Gemini TTS API payload and shows it in-app

### UI/UX
- **GenZ beauty YouTuber aesthetic** — dark purple/pink/cyan theme, bold typography
- **Voice Library page** — browse all 24 Gemini TTS voices with gender, style tags, and one-click assignment
- **Generation History** — saves session history with script, voices, and timestamps
- **Waveform visualization** on generated audio
- **Tag toolbar** — quick-insert expression buttons in the script editor
- **Voice swap** button — instantly swap speaker voices
- **Sample script** auto-loaded on startup
- **Keyboard shortcut**: `Ctrl+Enter` to generate

### Audio
- PCM → WAV conversion (client-side, no server needed)
- Download generated audio as `.wav`
- Save to history + play back from history

---

## 🚀 Getting Started

1. Open `index.html`
2. Click **API Key** (top right) and enter your [Gemini API key](https://aistudio.google.com/apikey)
3. Edit or use the pre-loaded sample script
4. Click **Generate Podcast Audio**

### Script Format
```
Xenon: (excited) Hey everyone, welcome back to the channel!
Silica: (giggly) Oh my gosh, today's episode is WILD!
Xenon: (laughing) You won't even believe what happened to us...
Silica: (whispering) Okay, spill the tea RIGHT now!
```

### Supported Expression Tags
| Tag | Instruction |
|-----|-------------|
| `(laughing)` | with genuine laughter and amusement |
| `(excited)` | with high energy and excitement |
| `(whispering)` | in a low, intimate whisper |
| `(sad)` | with sadness and melancholy |
| `(sarcastic)` | with playful sarcasm and dry wit |
| `(curious)` | with curiosity and an inquisitive tone |
| `(energetic)` | with vibrant, high-energy enthusiasm |
| `(playful)` | in a light, teasing, playful manner |
| `(dramatic)` | with dramatic flair and emphasis |
| `(giggly)` | with a giggly, bubbly delivery |
| `(shocked)` | with surprise and disbelief |
| `(breathless)` | with breathless excitement |

---

## 📁 Project Structure

```
index.html             Main app page
css/
  style.css            All styles (dark theme, responsive)
js/
  voices.js            Voice library data + expression map
  tts.js               Gemini TTS API caller, script parser, WAV converter
  app.js               UI logic, state management, event handlers
README.md
```

---

## 🔌 API Details

- **Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Model options**:
  - `gemini-2.5-flash-preview-tts` (default, faster)
  - `gemini-2.5-pro-preview-tts` (higher quality)
- **Key**: Stored in `localStorage` under `gemini_api_key`
- **Audio format**: `audio/pcm` or `audio/wav` (auto-converted to WAV for playback)

---

## ⚠️ Not Yet Implemented

- Real-time audio streaming (Gemini Live API)
- Multilingual auto-detection UI indicator
- Export to MP3 format
- Cloud save / user accounts
- Background music mixing
- Per-line voice adjustments (speed, pitch)

---

## 💡 Recommended Next Steps

1. Add **audio speed/pitch controls** per speaker
2. Integrate **background music** mixing (Web Audio API)
3. Add **script templates** for common podcast formats
4. Implement **batch export** for long scripts split into chunks
5. Add **multilingual script validation** for Bengali, Hindi, Japanese etc.
