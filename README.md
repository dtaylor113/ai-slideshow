# Our Wallpaper - AI-Powered Digital Frame

A web application that transforms your personal photos into AI-generated artwork. Each image is analyzed and reimagined in context-aware artistic styles using Google's Gemini AI.

## 🚀 Quick Start

```bash
./start.sh
```

Then open `http://localhost:5173` in your browser!

**Repository:** Published at [dtaylor113/ai-slideshow](https://github.com/dtaylor113/ai-slideshow)

**Requirements:**
- Python 3.10+
- Node.js 18+
- Gemini API key (free tier works great!)

## Current Status: Phase 4 - Hosted Family Slideshow ✅

**What's Working:**
- ✅ Auto-rotating gallery of curated AI artwork (randomized subset of up to 200 images ready instantly)
- ✅ Context-aware style selection (Gemini analyzes each photo and chooses fitting art styles)
- ✅ Seamless background processing (next image generates while you view current one)
- ✅ Gallery filmstrip showing a randomized slice (up to 200 generated images)
- ✅ Click any history thumbnail to revisit with full metadata
- ✅ Hover preview shows generated art alongside the original photo
- ✅ Slideshow playback controls (play/pause + 3–30s speed selector)
- ✅ Admin-only image generation controls (settings gear → password `football`)
- ✅ Slideshow-only kiosk mode (single toggle hides all controls)
- ✅ Auto-pruning keeps history clean; filmstrip waits for thumbnails before displaying
- ✅ Randomized gallery sample on each load (no two refreshes feel the same)
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
- **View-only by default:** Hosted build loads with a pre-generated gallery so family can watch immediately
- **Playback controls:** Play/pause toggle plus 3–30s speed selector (default 8 seconds)
- **Auto-rotation:** Seamless transitions when next image is ready (newly added originals are prioritized for generation so fresh uploads appear quickly)
- **Adaptive pacing:** Natural flow based on generation time, or timed cycling when running through saved history only
- **Filmstrip sidebar:** Scrollable view of up to 200 generated images sampled randomly per refresh
- **Click to revisit:** View any past image with its analysis and prompt
- **Admin start/stop:** Settings gear (password `football`) reveals generation controls when you want fresh AI renders
- **Slideshow-only mode:** One toggle hides all controls for a distraction-free viewing experience
- **Saved locally:** Generated images stored in `photos/generated/`

### 📊 UI/UX
- **Minimalist design:** Full-screen image display with discreet controls
- **Right panel:** Analysis text and image prompt displayed elegantly
- **Background status:** Footer shows next image progress once admin enables generation
- **Hover previews:** Thumbnail hover reveals generated art next to the source photo
- **Click-to-toggle:** Tap the main image (or press space/enter) to compare original vs generated artwork
- **Pin to original:** Tap the pin icon on the hero image to fetch every generated variation for that photo. The slideshow pauses while we load them, shows “Getting variations of this image…”, then resumes once the full set is ready; tap again to unpin and return to the randomized gallery.
- **Responsive:** Works on desktop and tablet

- **Slideshow-only as default:** The app loads in view-only mode (no controls), serving curated artwork from `photos/generated/` instantly.
- **Show details toggle:** Bottom-center pill (and the spacebar) switch between full UI and kiosk view; the choice persists per browser session.
- **Image click swap:** Click the main image to toggle between generated and original (if available).
- **Shuffle without repeats:** Slideshow cycles through every image before repeating and gives priority to freshly generated art.
- **Queue intelligence:** Newly generated artwork is surfaced within the next few slides before the queue reshuffles for another lap.
- **Admin unlock:** Settings gear (password `football`) reveals generation controls when you want fresh AI renders.
- **Playback controls:** Play/pause and 3–30 second speed selector (default 8s).
- **Auto-refresh:** History refreshes every three minutes so all viewers see new art once generation restarts (refresh keeps the queue order unless new files arrive).
- **Thumbnail spinner & pruning:** Filmstrip waits for “Loading thumbnails…” to resolve; missing files are pruned automatically.
- **Friendly notices:** If the original photo is missing, the toggle click shows a gentle notification instead of an intrusive alert.

## Project Structure

```
ai-slideshow/
├── backend/
│   ├── main.py              # FastAPI server with AI endpoints
│   └── requirements.txt     # Python deps (FastAPI, Gemini, Pillow)
├── photos/
│   ├── *.jpg                # 📸 Your source photos
│   └── generated/           # 🎨 Curated AI artwork (committed); auto-managed to keep the latest 200 when generation runs
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
| `/api/generated/history` | GET | Get the randomized gallery (last 200) or, when called with `?original=<filename>`, every generated variation of that source photo |
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
- The filmstrip now waits for thumbnails to load and shows **Loading thumbnails…** while images are fetched.
- If a generated file was removed, the backend prunes it automatically; refresh to pick up the updated gallery.

### "Model not found" error
- Make sure you're using the FREE Gemini tier (not Vertex AI)
- Model names: `gemini-2.5-flash` (vision), `gemini-2.5-flash-image` (generation)

## What's Next?

See **[ROADMAP.md](./ROADMAP.md)** for the complete development plan.

**Upcoming phases:**
- ✅ **Phase 4:** Hosted family slideshow (view-only defaults + admin controls)
- **Phase 5:** Public hosting for family sharing (Railway, Fly.io) using the curated library
- **Phase 6:** Enhanced history (search, favorites, share)
- **Phase 7:** Custom style presets and user controls

## Project Philosophy

This project follows an **iterative, vibe-coding approach**:
1. ✅ **Phase 0:** Basic local slideshow (DONE!)
2. ✅ **Phase 1-2:** Development tooling and baseline (DONE!)
3. ✅ **Phase 3:** AI generation with context-aware styles (DONE!)
4. ✅ **Phase 4:** Hosted family slideshow (view-only defaults + admin controls)
5. 🎯 **Phase 5+:** Public hosting, enhanced history, custom controls

Start simple, add complexity only when needed!

**📐 For Developers:** See [TECH_NOTES.md](./TECH_NOTES.md) for complete architecture documentation.

## License

MIT
