# Our Wallpaper - AI-Powered Digital Frame

A web application that transforms your personal photos into AI-generated artwork. Each image is analyzed and reimagined in context-aware artistic styles using Google's Gemini AI.

## 🚀 Quick Start

```bash
./start.sh
```

Then open `http://localhost:5173` in your browser!

**Requirements:**
- Python 3.10+
- Node.js 18+
- Gemini API key (free tier works great!)

## Current Status: Phase 3 - AI Image Generation ✅

**What's Working:**
- ✅ Auto-rotating AI-generated artwork slideshow
- ✅ Context-aware style selection (Gemini analyzes each photo and chooses fitting art styles)
- ✅ Seamless background processing (next image generates while you view current one)
- ✅ History filmstrip showing last 10 generated images
- ✅ Click any history thumbnail to revisit with full metadata
- ✅ Hover preview shows generated art alongside the original photo
- ✅ Footer control to stop/start image generation (slideshow keeps cycling through history when stopped)
- ✅ View original vs generated image toggle
- ✅ FREE Google Gemini AI (vision + image generation)

## How It Works

1. **Random Photo Selected** from your `photos/` directory
2. **Gemini Vision** analyzes the image (subjects, mood, setting)
3. **AI Prompt Generation** creates context-aware art style based on analysis
4. **Gemini Nano Banana** transforms photo into artistic masterpiece
5. **Display & Save** shows generated image, saves to history
6. **Background Loop** immediately starts processing next image

**Example Flow:**
- Photo of Halloween jack-o'-lanterns → "in the whimsical and vibrant style of Mary Blair"
- Night sports field celebration → "in the style of a glowing neon synthwave album cover"
- Couple at beach sunset → "in the dramatic, atmospheric style of J.M.W. Turner"

## Features

### 🎨 AI Generation
- **Context-aware styles:** AI selects artistic styles that match photo content
- **Gemini 2.5 Flash:** Fast vision analysis (2-3 sentence descriptions)
- **Nano Banana:** Free image-to-image generation
- **Smart prompts:** Varies between impressionist, pop art, gothic, watercolor, etc.
- **Image optimization:** Resizes for faster processing (800px analysis, 1024px generation)

### 🎬 Slideshow & History
- **Auto-rotation:** Seamless transitions when next image is ready
- **Adaptive pacing:** Natural flow based on generation time, or 5-second cycles when running through saved history only
- **Filmstrip sidebar:** Last 10 generated images with thumbnails
- **Click to revisit:** View any past image with its analysis and prompt
- **Stop image generation:** Toggle API calls off while continuing to rotate through existing artwork
- **Saved locally:** Generated images stored in `photos/generated/`

### 📊 UI/UX
- **Minimalist design:** Full-screen image display with discreet controls
- **Right panel:** Analysis text and image prompt displayed elegantly
- **Background status:** Footer shows next image progress ("Analysing...", "Creating image prompt...", "Generating image..." or "Paused")
- **Hover previews:** Thumbnail hover reveals generated art next to the source photo
- **Toggle original:** Button to compare original photo vs generated artwork
- **Responsive:** Works on desktop and tablet

## Project Structure

```
ai-slideshow/
├── backend/
│   ├── main.py              # FastAPI server with AI endpoints
│   └── requirements.txt     # Python deps (FastAPI, Gemini, Pillow)
├── photos/
│   ├── *.jpg                # 📸 Your source photos
│   └── generated/           # 🎨 AI-generated images (auto-managed, keeps last 10)
├── src/
│   ├── components/
│   │   ├── PhotoViewer.tsx  # Main slideshow component
│   │   └── PhotoViewer.css  # Minimalist styling
│   └── services/
│       └── api.ts           # API client (photo, analyze, prompt, generate, history)
├── generation-log-DO-NOT-DELETE.txt  # 📒 Structured history of generated images & prompts
├── .env                     # API keys (GEMINI_API_KEY)
├── start.sh                 # 🚀 One-command startup
└── README.md                # This file
```

`generation-log-DO-NOT-DELETE.txt` is an application artifact. The backend appends prompt/analysis metadata here and rehydrates the slideshow history from it each time the server boots—keep it alongside the repo so history persists.

## Setup

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

### 2. Get Gemini API Key (FREE!)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key (no credit card required)
3. Copy the key

### 3. Configure Environment

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_key_here
```

### 4. Add Photos

Copy photos to the `photos/` directory:

```bash
cp ~/Pictures/*.jpg photos/
```

### 5. Start!

```bash
./start.sh
```

## Adding Photos

Just copy photos to the `photos/` directory. Backend auto-discovers new images on each random selection (no restart needed!).

```bash
# Copy from anywhere
cp ~/Pictures/vacation/*.jpg photos/

# Or drag-and-drop into photos/ folder
```

**Supported formats:** JPG, PNG, GIF, WebP, HEIC, HEIF

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/photos/random` | GET | Get random photo from collection |
| `/api/analyze` | POST | Analyze image with Gemini Vision |
| `/api/prompt` | POST | Generate art style prompt from analysis |
| `/api/generate` | POST | Generate styled image with Nano Banana |
| `/api/generated/history` | GET | Get last 10 generated images metadata |
| `/api/generated/{filename}` | GET | Serve a specific generated image |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Python 3.10, FastAPI, Uvicorn
- **AI:** Google Gemini 2.5 Flash (vision + generation)
- **Image Processing:** Pillow (resizing, format conversion)
- **Styling:** Plain CSS (BEM-style naming)

## Commands

```bash
# Start everything (recommended)
./start.sh

# Individual services
./start-backend.sh    # Backend only
./start-frontend.sh   # Frontend only

# Development
npm run dev           # Frontend with hot reload
cd backend && python main.py  # Backend
```

## Troubleshooting

### No generated images appear
- Check `.env` file has valid `GEMINI_API_KEY`
- Check browser console for errors
- Backend logs show detailed generation progress

### Generation takes too long
- Images are automatically resized (1024px max)
- Check your internet connection (Gemini API calls)
- First generation shows spinners, subsequent ones load in background

### Filmstrip shows placeholders
- Thumbnails load after history fetches (may take a moment)
- Check browser network tab for failed requests

### "Model not found" error
- Make sure you're using the FREE Gemini tier (not Vertex AI)
- Model names: `gemini-2.5-flash` (vision), `gemini-2.5-flash-image` (generation)

## What's Next?

See **[ROADMAP.md](./ROADMAP.md)** for the complete development plan.

**Upcoming phases:**
- **Phase 4:** Publish the repo to GitHub and package a curated `/photos` set for deployment
- **Phase 5:** Public hosting for family sharing (Railway, Fly.io) using the curated library
- **Phase 6:** Enhanced history (search, favorites, share)
- **Phase 7:** Custom style presets and user controls

## Project Philosophy

This project follows an **iterative, vibe-coding approach**:
1. ✅ **Phase 0:** Basic local slideshow (DONE!)
2. ✅ **Phase 1-2:** Development tooling and baseline (DONE!)
3. ✅ **Phase 3:** AI generation with context-aware styles (DONE!)
4. 🎯 **Phase 4+:** GitHub release, curated photo bundle, and deployment

Start simple, add complexity only when needed!

**📐 For Developers:** See [TECH_NOTES.md](./TECH_NOTES.md) for complete architecture documentation.

## License

MIT
