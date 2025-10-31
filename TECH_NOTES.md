# Technical Notes - Our Wallpaper

## Project Architecture Overview

**Type:** Full-stack AI-powered web application  
**Purpose:** Digital frame that transforms photos into AI-generated artwork  
**Repository:** https://github.com/dtaylor113/ai-slideshow  
**Current Phase:** Phase 4 - Hosted Family Slideshow (view-only defaults + admin controls)  
**Deployment Model:** Local development + hosted Railway deployment (Phase 5 will expand hosting automation)

---

## Current Architecture (Phase 3)

### AI-Powered Three-Tier Architecture

```
┌────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  Vite Dev Server   │←───────→│  Python/FastAPI      │←───────→│  Gemini API     │
│  localhost:5173    │  CORS   │  localhost:8000      │  HTTPS  │  (Google Cloud) │
│  (React/TS/CSS)    │         │  (Backend + AI)      │         │  Vision + Image │
└────────────────────┘         └──────────────────────┘         └─────────────────┘
                                         ↓       ↑
                               ┌─────────────────────┐
                               │  photos/            │
                               │  ├─ source images   │
                               │  └─ generated/      │
                               │     (last 200)      │
                               └─────────────────────┘
```

**Data Flow:**
1. Frontend requests random photo
2. Backend selects from `photos/`
3. **AI Pipeline:**
   - Gemini 2.5 Flash analyzes image (vision)
   - AI generates context-aware art style prompt
   - Gemini 2.5 Flash Image ("Nano Banana") generates artwork
4. Saves to `photos/generated/`
5. Returns to frontend with metadata
6. Background immediately starts processing next image

---

## Project Structure

```
ai-slideshow/
│
├── 📄 Configuration
│   ├── package.json              # Node deps: React, TypeScript, Vite, Axios
│   ├── tsconfig.json             # TypeScript strict mode config
│   ├── vite.config.ts            # Vite bundler
│   ├── .env                      # API keys (GEMINI_API_KEY)
│   └── .env.example              # Template for API keys
│
├── 📚 Documentation
│   ├── README.md                 # Main project overview (UPDATED!)
│   ├── ROADMAP.md                # Development plan (UPDATED!)
│   ├── TECH_NOTES.md             # This file
│   └── GETTING_STARTED.md        # Quick start guide
│
├── 🐍 Backend (Python/FastAPI + AI)
│   └── backend/
│       ├── main.py               # FastAPI + Gemini integration
│       ├── requirements.txt      # Dependencies (updated for AI)
│       └── README.md             # Backend docs
│
├── ⚛️ Frontend (React/TypeScript)
│   ├── src/
│   │   ├── main.tsx              # React entry (StrictMode removed)
│   │   ├── App.tsx               # Minimal root component
│   │   ├── App.css               # Global reset styles
│   │   │
│   │   ├── components/
│   │   │   ├── PhotoViewer.tsx   # Main AI slideshow component
│   │   │   └── PhotoViewer.css   # Full-screen minimalist design
│   │   │
│   │   └── services/
│   │       └── api.ts            # API client with AI endpoints
│   │
│   └── index.html                # HTML entry
│
├── 📒 generation-log-DO-NOT-DELETE.txt  # Structured metadata log for generated images
├── 📸 Photos & Generated Art
│   └── photos/
│       ├── *.jpg, *.png, etc.    # Curated source photos bundled for deployment (gitignored locally)
│       └── generated/            # Committed AI artwork bundle; auto-managed cap of latest 200 when generation runs
│           └── gen_*.png         # Timestamped generated files
│
├── 🛠️ Scripts
│   ├── start.sh                  # Start both servers (kills old processes)
│   ├── start-backend.sh          # Backend only
│   └── start-frontend.sh         # Frontend only
│
└── 📦 Build Output (gitignored)
    ├── dist/
    └── node_modules/
```

---

## Technology Stack

### Frontend

**React 18.2**
- Functional components with hooks
- No class components
- State management via useState/useRef
- useEffect for lifecycle

**TypeScript 5.2 (Strict Mode)**
- Full type safety
- Interface definitions for API responses
- No `any` types where possible

**Vite 5.0**
- Fast HMR (Hot Module Replacement)
- Modern build tool
- Development server on localhost:5173

**Axios 1.6**
- HTTP client for API calls
- Handles CORS automatically
- Error handling

**Plain CSS**
- No preprocessors
- BEM-style naming
- Full-screen minimalist design
- Flexbox layout

### Backend

**Python 3.10+**
- Type hints with Pydantic
- Async/await for FastAPI
- Required for AI libraries

**FastAPI 0.104**
- Async endpoints
- Automatic API docs at `/docs`
- CORS middleware for local dev
- Pydantic models for validation

**Google Generative AI SDK (google-generativeai >= 0.8.0)**
- Gemini 2.5 Flash for vision analysis
- Gemini 2.5 Flash Image ("Nano Banana") for generation
- FREE API tier (no credit card)

**Pillow 10.1**
- Image resizing (optimization)
- Format conversion (RGBA → RGB)
- Thumbnail generation (800px analysis, 1024px generation)

**Python-dotenv 1.0**
- Environment variable management
- `.env` file support

**Uvicorn 0.24**
- ASGI server for FastAPI
- Production-ready

---

## Key Components

### Backend: `backend/main.py`

**API Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /` | GET | Health check, photo count |
| `GET /api/photos/random` | GET | Random photo from collection |
| `POST /api/analyze` | POST | Gemini vision analysis |
| `POST /api/prompt` | POST | AI-generated art style prompt |
| `POST /api/generate` | POST | Generate styled image |
| `GET /api/generated/history` | GET | Last 200 generated images |
| `GET /api/generated/{filename}` | GET | Serve specific generated image |

**Key Data Structures:**
```python
# In-memory history (last 200 generated images)
generated_history = []
MAX_HISTORY = 10

# Request/Response models
class AnalyzeRequest(BaseModel):
    photo_data: str  # base64
    filename: str

class PromptRequest(BaseModel):
    description: str  # from analyze
    filename: str

class GenerateRequest(BaseModel):
    photo_data: str  # base64
    filename: str
    description: str  # from analyze
    prompt: str      # from prompt endpoint
```

**AI Pipeline Implementation:**

```python
# 1. Analyze with Gemini Vision
vision_model = genai.GenerativeModel('models/gemini-2.5-flash')
image = resize_to_thumbnail(image, 800)  # Optimize for speed
vision_response = vision_model.generate_content([analysis_prompt, image])
description = vision_response.text

# 2. Generate context-aware prompt
prompt_model = genai.GenerativeModel('models/gemini-2.5-flash')
# Prompt asks AI to choose style based on image description
# Examples: Tim Burton for Halloween, synthwave for celebrations, etc.
art_prompt = prompt_model.generate_content(prompt_generation_text)

# 3. Generate styled image
imagen_model = genai.GenerativeModel('models/gemini-2.5-flash-image')
image = resize_for_generation(image, 1024)  # Balance quality/speed
imagen_response = imagen_model.generate_content([art_prompt, image])
generated_image = extract_image_from_response(imagen_response)

# 4. Save to disk
timestamp = int(time.time() * 1000)
filename = f"gen_{timestamp}_{original_name}.png"
save_to(GENERATED_DIR / filename)

# 5. Manage history (keep last 200)
if len(generated_history) > MAX_HISTORY:
    remove_oldest()

# 6. Append prompt + analysis metadata to generation-log-DO-NOT-DELETE.txt (audit trail)
log_generation(
    filename=filename,
    analysis=description,
    art_prompt=art_prompt,
    prompt_template=prompt_template,
    generation_prompt=generation_prompt,
)
```

**Image Optimization:**
- Analysis: Resize to max 800px (4-10x faster)
- Generation: Resize to max 1024px (maintains quality, speeds up API)
- Saves bandwidth and reduces API latency

**Logging & Prompt Tracking:**
- Each generation appends to `generation-log-DO-NOT-DELETE.txt` with timestamp, analysis, art prompt, prompt template, and the exact generation prompt.
- The descriptive name helps prevent "log rotation" tools from deleting it—treat it as application state rather than a disposable debug log.
- Supports downstream analysis (e.g., `ANALYSIS.md`) and helps tune prompt engineering.
- Frontend exposes the prompt template + generation prompt via an info popup for debugging and iteration.

### Frontend: `src/components/PhotoViewer.tsx`

**State Management:**
```typescript
// Core photo state
currentPhoto: Photo | null
generatedImage: string | null
generatedId: string | null

// Metadata
analysis: AnalyzeResponse | null
artPrompt: string | null
promptTemplate: string | null
generationPrompt: string | null

// Processing stages
stage: 'analyzing' | 'prompting' | 'generating' | 'complete' | null
backgroundStage: 'analyzing' | 'prompting' | 'generating' | null
generationPaused: boolean

// History & navigation
history: HistoryEntry[]
historyThumbnails: Record<string, string>
historyOriginalPhotos: Record<string, Photo>
hoverPreview: HoverPreview | null
showOriginal: boolean

// Refs for concurrency control
initialized: useRef(false)        // Prevent double-init
processing: useRef(false)         // Prevent concurrent foreground
backgroundProcessing: useRef(false)  // Prevent concurrent background
cycleTimerRef: useRef<number | null>(null)
```

**Component Lifecycle:**

```typescript
// 1. Mount - fetch first image
useEffect(() => {
  if (!initialized.current) {
    initialized.current = true
    fetchAndProcessPhoto()  // Shows spinners
  }
}, [])

// 2. Complete - start background processing (unless paused)
useEffect(() => {
  if (stage === 'complete' && !backgroundProcessing.current && !generationPaused) {
    fetchAndProcessPhotoBackground()
  }
}, [stage, generationPaused])

// 3. When generation is paused, keep rotating through history every 5s
useEffect(() => {
  // Manages cycleTimerRef to step through cached history entries
}, [generationPaused, history, generatedId])

// 4. History loaded - fetch thumbnails
fetchHistory()  → loadHistoryThumbnails()
```

**Processing Functions:**

```typescript
// Foreground (shows spinners)
fetchAndProcessPhoto() {
  1. setStage('analyzing')
  2. analyzeImage()
  3. setStage('prompting')
  4. generatePrompt()
  5. setStage('generating')
  6. generateImage()
  7. setStage('complete')
  8. fetchHistory()
}

// Background (silent, respects generationPaused)
fetchAndProcessPhotoBackground() {
  1. Exit early if a run is already in flight or generationPaused is true
  2. setBackgroundStage('analyzing') and request a random photo
  3. Run analyze → prompt → generate sequence
  4. Apply the finished result to foreground state
  5. Schedule the next run (100ms) if generation remains active
}

// History navigation (used for user clicks and auto-cycle)
viewHistoryImage(entry, { fromAutoCycle = false }) {
  1. Update metadata UI instantly
  2. Show cached generated thumbnail immediately
  3. Lazy-load original photo into cache for toggle + hover comparisons
  4. Skip modal toggles when invoked from the auto-cycle timer
}

// API usage guardrail
toggleGeneration() {
  1. Pause: flip generationPaused, clear footer stage, slideshow keeps cycling at the user-selected interval
  2. Resume: restart the background pipeline (fetchAndProcessPhoto) if idle and stage === 'complete'
}
```

---

## UI/UX Design

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────┐ ┌────────────────┐ │
│ │          │ │                        │ │   ANALYSIS     │ │
│ │ Filmstrip│ │                        │ │                │ │
│ │          │ │   Main Image Display   │ │ Photo desc...  │ │
│ │  Recent  │ │                        │ │                │ │
│ │          │ │   [Toggle: 📸/🎨]      │ │ ─────────────  │ │
│ │  🎨      │ │                        │ │ IMAGE PROMPT   │ │
│ │  🎨      │ │                        │ │                │ │
│ │  🎨      │ │                        │ │ "in the style  │ │
│ │ (200)    │ │                        │ │  of..."        │ │
│ │          │ │                        │ │                │ │
│ └──────────┘ └────────────────────────┘ └────────────────┘ │
│──────────────────────────────────────────────────────────────│
│  Play/Pause · Speed (3–30s)   ⚙ Admin Start/Stop Image Gen   │
│                              Next Image: Generating...       │
└─────────────────────────────────────────────────────────────┘
```

**Key UI Elements:**

1. **Filmstrip (Left, 100px)**
   - Latest 200 generated images
   - Thumbnail previews (actual images loaded)
   - Active item highlighted (blue border)
   - Vertical scroll if needed
   - Click to view with full metadata

2. **Main Image (Center, flex: 1)**
   - Full-screen image display
   - Toggle button (top-right): 📸 original / 🎨 generated
   - Processing overlay (spinner + text) during generation
   - Background black (#000)

3. **Analysis Panel (Right, 400px)**
   - "Analysis" section with description
   - Divider line
   - "Image Prompt" section with style
   - "✅ Complete" when done
   - Scrollable if content is long
   - Dark background (#1a1a1a)

4. **Footer (Bottom, fixed)**
   - Play/pause toggle plus speed selector (3–30s, default 8s)
   - Settings gear (password `football`) reveals admin-only generation controls
   - Status label reflects active stage once generation is enabled
   - Semi-transparent black overlay, minimal and discreet

5. **Thumbnail hover preview**
   - Hovering a history item reveals generated art alongside the original photo
   - Lazy-loads originals only when requested to keep hover responsive

6. **Prompt Details Popup**
   - Accessible from the "Image Prompt" tooltip button in the analysis panel.
   - Two evenly split, scrollable sections: **Image Prompt Template** (top) and **Image Generation Prompt** (bottom).
   - Displays the exact text sent to Gemini for both prompt construction and image generation, aiding transparency.
   - Updated prompt authoring yields 20–35 word, highly descriptive style prompts for richer generations.

### Admin Mode

- Slideshow loads with image generation paused so the hosted gallery appears instantly.
- Footer settings gear unlocks admin mode with password `football`, persisted for the current browser session.
- When admin starts generation, the UI calls `fetchAndProcessPhoto()` to resume the pipeline and reveals status controls.
- Every client polls `/api/generated/history` every 3 minutes, ensuring all viewers see fresh artwork once generation restarts.

### Color Scheme

- **Background:** Pure black (#000)
- **Panel Background:** Dark gray (#1a1a1a)
- **Text Primary:** White (rgba(255, 255, 255, 0.9))
- **Text Secondary:** Light gray (rgba(255, 255, 255, 0.6))
- **Text Tertiary:** Gray (rgba(255, 255, 255, 0.4))
- **Accent:** Blue (#646cff)
- **Borders:** Dark gray (#222, #333)

### Typography

- **Body:** System fonts (Inter, system-ui, sans-serif)
- **Weight:** Light (300) for most text
- **Sizes:** 15px body, 13px small, 18px headings
- **Line Height:** 1.6 for readability
- **Uppercase:** Section headings (Analysis, Image Prompt)

---

## Performance Optimizations

### Image Processing

**Backend:**
- Resize for analysis: Max 800px (2-3 second API calls)
- Resize for generation: Max 1024px (15-20 second API calls)
- Original images can be 4000px+ (would be 60+ seconds!)
- Format conversion: RGBA/P → RGB (Gemini requirement)

**Frontend:**
- Thumbnails load in parallel (`Promise.all`)
- History cached in state (no re-fetching)
- Base64 encoding for efficient transport

### Concurrency Control

**Prevents Race Conditions:**
```typescript
// useRef flags prevent duplicate processing
const initialized = useRef(false)      // No double-mount
const processing = useRef(false)       // No concurrent foreground
const backgroundProcessing = useRef(false)  // No concurrent background

// Check before starting
if (processing.current) return
processing.current = true
try {
  // ... process ...
} finally {
  processing.current = false
}
```

### Background Processing

**Seamless User Experience:**
- Current image displays while next processes
- Natural pacing driven by generation time while models run
- When generation is paused, a 5-second timer cycles through the saved history
- Instant swap when ready (no loading states)
- Footer shows progress discreetly

---

## API Design

### Request/Response Patterns

**Random Photo:**
```typescript
GET /api/photos/random
→ {
    filename: "IMG_1234.jpg",
    created: "2024-01-15",
    dimensions: { width: 4032, height: 3024 },
    data: "data:image/jpeg;base64,/9j/4AAQ..."
  }
```

**Analyze Image:**
```typescript
POST /api/analyze
{
  photo_data: "data:image/jpeg;base64,...",
  filename: "IMG_1234.jpg"
}
→ {
    filename: "IMG_1234.jpg",
    description: "A happy couple smiles warmly...",
    analysis_time: "2.34s"
  }
```

**Generate Prompt:**
```typescript
POST /api/prompt
{
  description: "A happy couple smiles warmly...",
  filename: "IMG_1234.jpg"
}
→ {
    filename: "IMG_1234.jpg",
    art_prompt: "in the dramatic, atmospheric style of J.M.W. Turner",
    prompt_time: "1.82s"
  }
```

**Generate Image:**
```typescript
POST /api/generate
{
  photo_data: "data:image/jpeg;base64,...",
  filename: "IMG_1234.jpg",
  description: "A happy couple smiles warmly...",
  prompt: "in the style of..."
}
→ {
    id: "1704394834120",
    filename: "ai_IMG_1234.jpg",
    original_filename: "IMG_1234.jpg",
    prompt: "in the style of...",
    description: "A happy couple...",
    generated_image: "data:image/png;base64,...",
    generation_time: "18.42s",
    saved_path: "gen_1704394834120_IMG_1234.png"
  }
```

**History:**
```typescript
GET /api/generated/history
→ {
    history: [
      {
        id: "1704394834120",
        filename: "gen_1704394834120_IMG_1234.png",
        original_filename: "IMG_1234.jpg",
        prompt: "in the style of...",
        description: "A happy couple...",
        timestamp: 1704394834120,
        generation_time: "18.42s"
      },
      // ... up to 10 entries
  ]
}
```

---

## Dependencies

### Frontend (`package.json`)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0"
  }
}
```

### Backend (`requirements.txt`)

```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
google-generativeai>=0.8.0
python-dotenv>=1.0.0
Pillow>=10.1.0
```

**Why These Dependencies:**
- `fastapi` - Modern async web framework
- `uvicorn` - ASGI server
- `google-generativeai` - Gemini AI SDK
- `python-dotenv` - Environment variables
- `Pillow` - Image processing

---

## Environment Configuration

### Required Variables (`.env`)

```bash
# Google Gemini API (FREE tier)
GEMINI_API_KEY=your_api_key_here

# Optional: Change server port
PORT=8000
```

### Getting API Keys

**Gemini API (FREE!):**
1. Visit https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. No credit card required
4. Copy key to `.env`

**Rate Limits (Free Tier):**
- Gemini 2.5 Flash: 15 requests/minute
- Gemini 2.5 Flash Image: 2 requests/minute
- More than enough for personal use!

---

## Development Workflow

### Starting Development

```bash
# 1. Install dependencies
npm install
cd backend && pip install -r requirements.txt

# 2. Create .env file
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Add photos
cp ~/Pictures/*.jpg photos/

# 4. Start everything
./start.sh
```

### Development URLs

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000

### Hot Reload

- **Frontend:** Vite HMR (instant updates)
- **Backend:** Manual restart required (FastAPI doesn't auto-reload in production)

### Debugging

**Frontend:**
- Browser DevTools Console
- React DevTools extension
- Network tab for API calls

**Backend:**
- Terminal output (all print statements)
- FastAPI docs at `/docs` (interactive testing)
- Error traceback in terminal

---

## Common Issues & Solutions

### "Model not found" Error

**Problem:** `404 models/gemini-1.5-flash is not found`

**Solution:** Use correct model names:
- Vision: `models/gemini-2.5-flash`
- Generation: `models/gemini-2.5-flash-image`

### Generation Takes Too Long

**Problem:** 60+ seconds per image

**Solution:** Already implemented!
- Images resized to 1024px max
- Should be 15-20 seconds

### Thumbnails Don't Load

**Problem:** Filmstrip shows 🎨 placeholders

**Solution:**
- Wait a few seconds (loading in background)
- Check browser network tab
- Check backend logs for errors

### Background Processing Stops

**Problem:** Slideshow stops advancing

**Solution:**
- Check browser console for errors
- Confirm "Stop Image Generation" toggle is not left in the paused state
- Check backend is still running

### Duplicate Image Generations

**Problem:** Same image processed twice

**Solution:** Already prevented!
- `processing.current` flag
- `backgroundProcessing.current` flag
- Removed React StrictMode (was causing double-mount)

---

## Future Enhancements (Phase 4+)

### GitHub Release & Deployment Prep (Phase 4)
- Publish the codebase to GitHub (private repo is fine for now)
- Document the curated `/photos` set and any licensing restrictions
- Verify `.env` handling and deployment scripts work from a clean clone

### Public Hosting with Curated Library (Phase 5)
- Railway.app or Fly.io
- Bundle the curated photo set in the container image
- Environment-based config
- HTTPS + basic auth
- Public family URL

### Optional: Cloud Storage (Later)
- Re-evaluate S3/Google Photos/iCloud if we outgrow the curated bundle
- Decide whether remote access complexity is worth the trade-offs

### Advanced Features
- Search/filter history
- Favorites system
- Export generated images
- Custom style presets
- Multi-user accounts
- WebSocket sync (multi-device)

---

## Project Philosophy

**Iterative Development:**
- Start simple, add complexity only when needed
- Prove concepts before overengineering
- Keep it working at each phase

**"Vibe Coding":**
- Exploratory approach
- Rapid prototyping
- Learn by building
- Document as you go

**User-First:**
- Minimize friction
- Beautiful, simple UI
- Fast performance
- Seamless experience

---

## References

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev/
- **Vite Docs:** https://vitejs.dev/
- **Gemini API:** https://ai.google.dev/docs
- **Pillow Docs:** https://pillow.readthedocs.io/

---

**Last Updated:** October 30, 2025  
**Current Phase:** Phase 3 Complete ✅  
**Next Phase:** GitHub Release & Deployment Prep (Phase 4)
