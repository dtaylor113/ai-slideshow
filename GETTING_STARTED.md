# 🚀 Getting Started with Our Wallpaper

## What You Have

A **Phase 0** complete application:
- ✅ Local photo slideshow
- ✅ Auto-rotation every 10 seconds
- ✅ Random photo selection
- ✅ Instant loading from local files
- ✅ Modern React + TypeScript frontend
- ✅ Python FastAPI backend
- ✅ 117 photos already loaded!

## Quick Start

### 1. Install Dependencies

**First time setup:**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Add Photos (Already Done! ✅)

Your `photos/` directory already has 117 photos loaded. To add more:

```bash
# Copy photos from anywhere
cp ~/Pictures/*.jpg photos/

# Or drag-and-drop into the photos/ folder
```

**Supported formats:** JPG, JPEG, PNG, GIF, WebP, HEIC, HEIF

### 3. Start the App

**One-command startup (recommended):**

```bash
./start.sh
```

**Or manually in separate terminals:**

```bash
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend
./start-frontend.sh
```

### 4. Open in Browser

Visit: **http://localhost:5173**

You should see:
- A random photo from your collection
- Auto-rotation every 10 seconds
- Clean, fullscreen display

## What Happens Next

### Current Phase: Phase 0 ✅ COMPLETE

You have a working local slideshow! Perfect for testing and enjoying your photos.

### Next Phase: Phase 1 - Cloud Storage

To share with family or access from anywhere, you'll need to:
1. Choose a cloud storage option (S3, Google Photos, or iCloud)
2. Migrate from local `photos/` directory to cloud
3. Deploy to a hosting platform

See **[ROADMAP.md](./ROADMAP.md)** for the complete plan.

## Files You Should Know About

### Essential Files
- `start.sh` - **Start here!** Launches both servers
- `photos/` - Your photo collection (117 photos currently)
- `README.md` - Project overview
- `ROADMAP.md` - Development phases and future plans

### Frontend Code
- `src/App.tsx` - Main React component
- `src/components/PhotoViewer.tsx` - Photo display with auto-rotation
- `src/services/api.ts` - API calls to backend

### Backend Code
- `backend/main.py` - FastAPI server that serves photos
- `backend/requirements.txt` - Python dependencies

## Commands Cheat Sheet

```bash
# Start everything
./start.sh                          # Recommended!

# Individual services
./start-backend.sh                  # Backend only (port 8000)
./start-frontend.sh                 # Frontend only (port 5173)

# Development
npm install                         # Install frontend dependencies
cd backend && pip install -r requirements.txt  # Install backend deps

# Managing processes
pkill -9 -f "python.*main.py"       # Stop backend
pkill -9 -f "vite"                  # Stop frontend
```

## How It Works

1. **Backend** reads photos from `photos/` directory
2. **API endpoint** (`/api/photos/random`) returns a random photo as base64 data
3. **Frontend** displays the photo
4. **Timer** automatically fetches a new photo every 10 seconds
5. **Repeat!**

Simple architecture, instant loading, no complexity!

## Troubleshooting

### "Module 'fastapi' not found"

Backend dependencies not installed:

```bash
cd backend
pip install -r requirements.txt
cd ..
./start.sh
```

### "Cannot find module 'react'"

Frontend dependencies not installed:

```bash
npm install
./start.sh
```

### "No photos found"

Add photos to the `photos/` directory:

```bash
cp ~/Pictures/*.jpg photos/
# Then restart backend
```

### Port already in use

Kill existing processes:

```bash
pkill -9 -f "python.*main.py"
pkill -9 -f "vite"
./start.sh
```

### Photos not changing

Check browser console (F12) for errors. Common issues:
- Backend not running (check terminal for errors)
- API not responding (visit http://localhost:8000 to verify)

### Backend crashes on startup

Check you have Python 3.10+:

```bash
python3 --version
```

If using a different Python version, update the scripts to use your Python command.

## Making Changes

### Change Auto-Rotation Speed

Edit `src/components/PhotoViewer.tsx`:

```typescript
// Find this line:
const interval = setInterval(fetchPhoto, 10000)  // 10 seconds

// Change to 30 seconds:
const interval = setInterval(fetchPhoto, 30000)  // 30 seconds
```

### Add More Photos

Just copy them to `photos/` and restart the backend:

```bash
cp ~/new-photos/*.jpg photos/
pkill -9 -f "python.*main.py"
./start-backend.sh
```

### Change Backend Port

Edit `backend/main.py`:

```python
# Find this line at the bottom:
port = int(os.getenv("PORT", 8000))

# Change to port 5000:
port = int(os.getenv("PORT", 5000))
```

Don't forget to update `src/services/api.ts` to match!

## Next Steps

1. ✅ **You're already running!** Enjoy your slideshow
2. 📖 **Read [ROADMAP.md](./ROADMAP.md)** to see what's next
3. 🎯 **Phase 1:** Add cloud storage for deployment
4. 🌐 **Phase 2:** Deploy for family sharing
5. 🎨 **Phase 3+:** AI prompt generation and image transformation

## Questions?

- **How does it work?** → See [TECH_NOTES.md](./TECH_NOTES.md)
- **What's next?** → See [ROADMAP.md](./ROADMAP.md)
- **Need help?** → Check the troubleshooting section above

---

**Enjoy your digital frame!** 🖼️

Your 117 photos are ready to be rediscovered, 10 seconds at a time.
