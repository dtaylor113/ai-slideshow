# 🚀 Deployment Guide (Phase 2)

> **Note:** This guide is for **Phase 2** of the project. Currently, the app is in **Phase 0** (local development only).

> **Current Status:** The app runs locally and serves photos from the `photos/` directory. Before deploying, you'll need to complete **Phase 1** (cloud storage migration).

---

## Deployment Roadmap

### Prerequisites for Deployment

**Before deploying, you need:**
1. ✅ Phase 0: Local slideshow working (DONE!)
2. 🎯 Phase 1: Cloud storage implemented (S3, Google Photos, or iCloud)
3. 🎯 Phase 2: Authentication added (HTTP Basic Auth)
4. 🎯 Phase 2: Environment variables configured

**Why Cloud Storage First?**
- Local `photos/` directory doesn't exist in deployed containers
- Need persistent storage accessible from anywhere
- Must choose: S3, Google Photos API, or iCloud

---

## Hosting Options (Phase 2)

### Option A: Railway.app (Recommended)

**Why Railway:**
- ✅ Git push = automatic deployment
- ✅ $5/month free tier
- ✅ No container management needed
- ✅ Automatic HTTPS
- ✅ Easy environment variables
- ✅ Good for Python + Node.js apps

**Steps (Once Phase 1 Complete):**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

**Environment Variables to Set:**
```
# Cloud storage credentials (choose one)
AWS_ACCESS_KEY_ID=xxx              # If using S3
AWS_SECRET_ACCESS_KEY=xxx          # If using S3

GOOGLE_PHOTOS_CLIENT_ID=xxx        # If using Google Photos
GOOGLE_PHOTOS_CLIENT_SECRET=xxx    # If using Google Photos

APPLE_ID=your@email.com            # If using iCloud
APPLE_PASSWORD=xxxx-xxxx-xxxx      # If using iCloud

# Viewer authentication
VIEWER_PASSWORD=family2024         # Simple password for family access
```

**Cost:** ~$3-5/month (within free tier)

---

### Option B: Fly.io (Lightweight Containers)

**Why Fly.io:**
- ✅ Docker-based deployment
- ✅ Free allowance includes 3 VMs
- ✅ Good performance
- ✅ Simple CLI

**Steps (Once Phase 1 Complete):**

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (creates fly.toml)
fly launch

# Set secrets
fly secrets set VIEWER_PASSWORD=family2024
# Add cloud storage credentials here

# Deploy
fly deploy
```

**Cost:** Free tier available, ~$0-5/month

---

### Option C: Render.com (Easy Alternative)

**Why Render:**
- ✅ Free tier (750 hours/month)
- ✅ GitHub integration
- ✅ Auto-deploys on push
- ✅ No CLI needed

**Steps (Once Phase 1 Complete):**

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. "New Web Service"
4. Connect GitHub repo
5. Render auto-detects build settings
6. Add environment variables in dashboard
7. Deploy!

**Cost:** Free with sleep after inactivity, or $7/month for always-on

---

### Option D: OpenShift (Your Domain!)

**Why OpenShift:**
- ✅ You have experience with it
- ✅ Kubernetes-native
- ✅ Container-based
- ✅ OpenShift Sandbox is free

**Steps (Once Phase 1 Complete):**

```bash
# Login to OpenShift
oc login

# Create new project
oc new-project our-wallpaper

# Use provided manifests (see deploy/)
oc apply -f deploy/openshift.yaml

# Set secrets
oc create secret generic app-secrets \
  --from-literal=VIEWER_PASSWORD=family2024
  # Add cloud storage credentials

# Get public URL
oc get route
```

**Cost:** OpenShift Sandbox is free (renew every 30 days)

---

## Build Configuration

### Railway / Render (Auto-Detected)

**Build Steps (Handled Automatically):**
1. Install Node dependencies: `npm ci`
2. Build frontend: `npm run build` → Creates `dist/`
3. Install Python dependencies: `pip install -r backend/requirements.txt`
4. Start server: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

**Files That Make This Work:**
- `package.json` - Defines build script
- `backend/requirements.txt` - Python dependencies
- `backend/main.py` - Serves both API and static files (once updated)

### Dockerfile (For Fly.io / Manual Deployment)

**Currently included but not needed for Railway/Render.**

For Docker-based deployment, see `Dockerfile` in the repository.

---

## Security Setup (Phase 2)

### Authentication

**Add HTTP Basic Auth:**

```python
# backend/main.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import os

security = HTTPBasic()
VIEWER_PASSWORD = os.getenv("VIEWER_PASSWORD", "changeme")

def verify_password(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.password != VIEWER_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    return True

# Protect photo endpoint
@app.get("/api/photos/random", dependencies=[Depends(verify_password)])
async def get_random_photo():
    # ... existing code
```

### Environment Variables

**Required in Production:**
```bash
# Choose cloud storage provider and add credentials
# Option 1: AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_BUCKET_NAME=our-wallpaper-photos

# Option 2: Google Photos
GOOGLE_PHOTOS_CLIENT_ID=xxx
GOOGLE_PHOTOS_CLIENT_SECRET=xxx
GOOGLE_PHOTOS_REFRESH_TOKEN=xxx

# Option 3: iCloud
APPLE_ID=your@email.com
APPLE_PASSWORD=xxxx-xxxx-xxxx  # App-specific password

# Viewer authentication
VIEWER_PASSWORD=family2024
```

---

## Post-Deployment

### Verify Deployment

```bash
# Railway
railway open

# Fly.io
fly open

# Manual
curl https://your-app-url.com/
```

### Share with Family

1. Get your public URL
2. Share URL + viewer password
3. Family can bookmark for easy access

### Monitor

```bash
# Railway
railway logs

# Fly.io
fly logs

# Render
# Check dashboard
```

---

## Current Blockers

**Before you can deploy:**

- [ ] **Phase 1:** Implement cloud storage (choose S3, Google Photos, or iCloud)
- [ ] **Phase 1:** Update backend to use cloud storage instead of local files
- [ ] **Phase 1:** Test cloud storage integration locally
- [ ] **Phase 2:** Add authentication layer
- [ ] **Phase 2:** Configure environment variables
- [ ] **Phase 2:** Update backend to serve static frontend files

**See [ROADMAP.md](./ROADMAP.md) for detailed Phase 1 and Phase 2 tasks.**

---

## Estimated Timeline

**From Current State to Deployed:**
- Phase 1 (Cloud Storage): 1-2 days
- Phase 2 (Deployment Setup): 1 day
- Testing & Debugging: 1 day

**Total:** 3-4 days of focused work

---

## Need Help?

**For Current Phase (Phase 0):**
- See [GETTING_STARTED.md](./GETTING_STARTED.md)
- See [TECH_NOTES.md](./TECH_NOTES.md)

**For Planning:**
- See [ROADMAP.md](./ROADMAP.md)

---

## Summary

This deployment guide will be relevant once:
1. ✅ Phase 0 complete (local slideshow working) - DONE!
2. 🎯 Phase 1 complete (cloud storage implemented) - TODO
3. 🎯 Phase 2 ready (authentication added) - TODO

Come back to this guide when you're ready to deploy!
