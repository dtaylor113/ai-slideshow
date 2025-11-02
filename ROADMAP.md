# Digital Wallpaper Frame - Development Roadmap

## Project Vision

A web-based digital frame that:
1. Displays your family photos as AI-generated artwork
2. Automatically selects artistic styles based on photo content
3. Provides seamless auto-rotating slideshow experience
4. (Future) Can be shared with family via public URL
5. Rediscovers forgotten memories through randomization
6. Ships with a curated `/photos` set that can be swapped for personal favorites

---

## Phase 0: Local Photo Slideshow ✅ **COMPLETE**

### Goal
Get the basic slideshow working with local photos - prove the concept!

### What We Built
- ✅ FastAPI backend serving photos from `photos/` directory
- ✅ React frontend with auto-rotation
- ✅ Random photo selection
- ✅ Clean, minimalist interface
- ✅ Single startup script

**Result:** Working local slideshow foundation!

---

## Phase 1-2: Development Foundation ✅ **COMPLETE**

### What We Built
- ✅ Project structure and tooling
- ✅ TypeScript strict mode
- ✅ Component architecture
- ✅ API service layer
- ✅ Development workflow

**Result:** Solid foundation for rapid iteration!

---

## Phase 3: AI Image Generation with Context-Aware Styles ✅ **COMPLETE**

### Goal
Transform photos into AI-generated artwork with intelligent style selection.

### What We Built

#### **Core AI Pipeline**
- ✅ Gemini 2.5 Flash vision analysis (2-3 sentence descriptions)
- ✅ AI-powered prompt generation (context-aware art styles)
- ✅ Gemini 2.5 Flash Image ("Nano Banana") for generation
- ✅ Image optimization (800px analysis, 1024px generation)
- ✅ All FREE using Gemini API!
- ✅ Verbose (20–35 word) image prompts for richer, more descriptive generations

#### **Intelligent Style Selection**
- ✅ Analysis-driven style choices
- ✅ Adapts to photo content and mood
- ✅ Varies between dozens of artistic styles
- ✅ Examples:
  - Halloween → Tim Burton gothic illustrations
  - Sports celebration → Neon synthwave album covers
  - Beach sunset → J.M.W. Turner atmospheric paintings
  - Nature → Impressionist, watercolor, Japanese woodblock

#### **Slideshow Experience**
- ✅ Seamless auto-rotation while new images are generating
- ✅ Background processing while viewing current image
- ✅ Natural pacing based on generation time, or timed cycles when generation is paused
- ✅ Play/pause and speed controls for the curated slideshow (default 8s)
- ✅ Footer shows next image progress:
  - "Next Image: Analysing..."
  - "Next Image: Creating image prompt..."
  - "Next Image: Generating image..."

#### **History & Navigation**
- ✅ Left filmstrip showing the latest 200 images with thumbnails
- ✅ Click any thumbnail to revisit with full metadata
- ✅ Auto-managed storage (keeps last 200, deletes oldest)
- ✅ Saves to `photos/generated/`

- ✅ Minimalist full-screen design
- ✅ Right panel: Analysis + Image Prompt display
- ✅ Toggle between original and generated
- ✅ Hover previews show generated art alongside the original photo
- ✅ Active thumbnail highlighting
- ✅ Smooth transitions and loading states
- ✅ Prompt details popup with scrollable template + generation sections (no slider fuss)
- ✅ Admin settings gear (password `football`) gates image generation controls

### Technical Implementation

**API Endpoints:**
```
GET  /api/photos/random          # Random photo
POST /api/analyze                # Gemini vision analysis  
POST /api/prompt                 # AI style prompt generation
POST /api/generate               # Image generation
GET  /api/generated/history      # Last 200 images metadata
GET  /api/generated/{filename}   # Serve generated image
```

**Processing Flow:**
```
1. Fetch random photo from photos/
   ↓
2. Gemini Vision analyzes (thumbnail 800px)
   ↓
3. AI generates context-aware style prompt
   Examples:
   - "in the style of Tim Burton's gothic illustrations"
   - "as a vibrant Monet impressionist painting"
   - "in the dramatic style of Caravaggio"
   ↓
4. Gemini Nano Banana generates image (1024px)
   ↓
5. Save to photos/generated/
   ↓
6. Display with metadata
   ↓
7. Immediately start processing next in background
```

**Speed Optimizations:**
- Resize images before API calls (4-10x faster)
- Analysis uses 800px thumbnails (~2-3 seconds)
- Generation uses 1024px images (~15-20 seconds)
- Background processing = no waiting between images

### Milestone Achieved
✅ **Working AI-powered digital frame with intelligent style selection!**

---

## Phase 4: Hosted Family Slideshow 🎯 **COMPLETE**

### Goal
Deliver a hosted, view-only slideshow experience backed by curated generated art, while keeping image generation under admin control.

### What We Did
- [x] Ship hosted defaults: slideshow loads in view-only mode, generation disabled by default, footer controls hidden.
- [x] Add admin unlock workflow (password gate + start generation button) for controlled API usage.
- [x] Expose slideshow playback controls (play/pause + 3–30s speed selector, default 8s).
- [x] Track/deploy curated `photos/` + `photos/generated/` bundle so family sees finished art immediately.
- [x] Auto-prune missing generated images and show a clean loading state for thumbnails.
- [x] Randomize filmstrip + slideshow queue so viewers get fresh mixes and newly generated art appears within a few slides.
- [x] Polish kiosk UX: glass info badges, footer toggle, keyboard shortcuts, and persistent slideshow-only preference.
- [x] Add pin-to-original mode: pause slideshow, fetch every variation for the selected photo, then resume with the filtered gallery.

**Milestone:** Hosted URL shows an immediately-available slideshow; admin can selectively enable generation when desired.
---
## Phase 5: Public Deployment 🎯

### Goal
Deploy the curated gallery so family can access via public URL.

### Hosting Options

#### Railway.app (Recommended)
- Git push → auto deploy
- $5/month free tier
- Easy environment variables
- Automatic HTTPS

#### Alternative: Fly.io / Render.com
- Similar features
- Free tiers available

### Security
- [ ] HTTP Basic Auth for viewer access
- [ ] Environment variables for credentials
- [ ] HTTPS only
- [ ] Simple shared password

### Tasks
- [ ] Choose hosting platform
- [ ] Add authentication
- [ ] Confirm curated `/photos` bundle is shipped with the container image
- [ ] Deploy and test
- [ ] Share URL with family

**Milestone:** Family can access from anywhere!

---

## Phase 6: Enhanced History & Controls 🎯

### Goal
Better history management and user controls.

### Features
- [ ] Search history by date, style, or original photo
- [ ] Favorite/star best generations
- [ ] Export/download generated images
- [ ] Share individual generations (permalink)
- [ ] Regenerate with different style
- [ ] Style presets (save favorite prompts)
- [ ] Manual style override
- [ ] Slideshow speed control
- [ ] Experiment with parallel/"multi-threaded" AI pipelines (e.g. two background generations queued at once)
- [ ] Introduce curated style buckets that map photo themes to suggested art movements (reduce AI repetition)
- [ ] Keyboard shortcuts

### Tasks
- [ ] Add search/filter UI
- [ ] Implement favorites system
- [ ] Add export functionality
- [ ] Create settings panel
- [ ] Add keyboard navigation

**Milestone:** Power-user features for full control!

---

## Phase 7: Multi-User & Advanced Features 🎯

### Future Ideas
- [ ] Multiple user accounts (different photo libraries)
- [ ] Schedule-based themes (Christmas styles in December)
- [ ] Weather-based prompt modifications
- [ ] Multiple AI model support (Stable Diffusion, DALL-E)
- [ ] Video support (first frame → artwork)
- [ ] Mobile companion app
- [ ] Chromecast/AirPlay support
- [ ] Electron app for dedicated displays
- [ ] Multi-display sync (same image on multiple frames)

---

## Current Status Summary

### ✅ Completed
- **Phase 0:** Local slideshow
- **Phase 1-2:** Development foundation
- **Phase 3:** AI generation with context-aware styles ⭐ **MAJOR MILESTONE**
- **Phase 4:** Hosted family slideshow (view-only defaults + admin controls)

### 🎯 Next Up
- **Phase 5:** Public deployment (host curated gallery for family)

### What's Working Right Now
- AI-powered slideshow with intelligent style selection
- Background processing for seamless experience
- History filmstrip with latest 200 images
- Context-aware prompts (Halloween → spooky, celebration → vibrant, etc.)
- Hosted slideshow defaults to view-only mode; admin enables generation via password
- Auto-pruning keeps history clean after manual file deletions; thumbnails only appear once loaded
- Pin-to-original lets hosts review every generated variation for a photo with a single click (auto pauses and resumes slideshow)
- Full metadata display
- Original vs generated comparison
- Automatic local storage management

### Estimated Timeline
- **Phase 4 (GitHub Release & Prep):** 1-2 days
- **Phase 5 (Deployment):** 1-2 days
- **Phase 6 (Enhanced History):** 3-4 days
- **Phase 7 (Advanced Features):** Ongoing

**Total to family-shareable app:** 1 week

---

## Technical Stack

### Current (Phase 3)
- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Python 3.10, FastAPI, Uvicorn
- **AI:** Google Gemini 2.5 Flash (vision + image generation)
- **Image Processing:** Pillow (resize, format conversion)
- **Storage:** Local filesystem (`photos/` + `photos/generated/`)
- **Styling:** Plain CSS (BEM-style)

### Future Additions (Phase 4+)
- Cloud storage SDK (boto3 for S3, or google-cloud-storage)
- Redis (optional, for caching generated images)
- PostgreSQL (optional, for user accounts and favorites)
- HTTP Basic Auth or OAuth
- WebSocket (for multi-device sync)

### Deployment Targets
- **Primary:** Railway.app (git-based, $5/month)
- **Alternative:** Fly.io, Render.com
- **Future:** OpenShift (container-native)

---

## Decision Log

### Why Gemini API?
- **FREE tier** for both vision and generation
- Fast enough for real-time use (2-3s analysis, 15-20s generation)
- Good quality results
- No credit card required
- "Nano Banana" (gemini-2.5-flash-image) works great

### Why Context-Aware Styles?
- More interesting than single style
- Matches photo content naturally
- Creates variety in the slideshow
- Feels "smart" and personalized

### Why Background Processing?
- Natural pacing without arbitrary timers while generation runs
- When generation is paused, a short timer rotates the saved history
- Smooth user experience
- Always have next image ready
- Viewers get plenty of time with each image

### Why Filmstrip History?
- Easy to revisit favorites
- Shows what AI has created
- No need to re-generate
- Visual timeline of the session

### Why Local Storage First?
- Fastest path to working prototype
- No authentication complexity
- Easy iteration and testing
- Can add cloud storage later without breaking anything

---

## Questions to Resolve

1. **Cloud Storage:** S3 (simple) or Google Photos (auto-sync)?
2. **Deployment:** Railway (easiest) or self-hosted (more control)?
3. **Cost Budget:** $5-10/month okay for hosting + storage?
4. **Sharing:** Private link only, or add accounts for different families?

---

## Success Metrics

### Phase 3 Success ✅
- [x] Generates artwork from any photo
- [x] Styles match photo content
- [x] Seamless auto-rotation
- [x] Easy to revisit history
- [x] All FREE (no API costs yet!)

### Phase 4-5 Success (Next)
- [ ] Works with full photo library (1000s of photos)
- [ ] Accessible via public URL
- [ ] Family can view anytime
- [ ] Reliable and fast
- [ ] Under $10/month total cost

---

**🎨 Ready for Phase 4!** Time to evaluate cloud storage options and prep for deployment.
