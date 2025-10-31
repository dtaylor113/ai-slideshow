"""
FastAPI backend for Local Photo Slideshow
Serves random photos from local photos/ directory
Uses Gemini 2.5 Flash for vision + Gemini 2.5 Flash Image (Nano Banana) for generation
All FREE with Gemini API!
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import base64
import random
from pathlib import Path
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv
import io
from PIL import Image
import time
from typing import Optional
import textwrap
import asyncio
import re
from collections import deque, defaultdict
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI(title="Local Photo Slideshow with AI Generation")

# Configure Gemini API (for vision analysis)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini API configured (vision analysis)")
else:
    print("⚠️  GEMINI_API_KEY not found - vision analysis will not work")

# Note: OpenAI support kept for future use, but not required
# Currently using Gemini for all operations (free!)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    print("ℹ️  OpenAI API configured (optional, not currently used)")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Photos directory
PHOTOS_DIR = Path(__file__).parent.parent / "photos"
GENERATED_DIR = PHOTOS_DIR / "generated"
LOG_FILE = Path(__file__).parent.parent / "generation-log-DO-NOT-DELETE.txt"

# Supported image extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'}

# History of generated images (capped to the most recent 200 in memory)
generated_history = []
MAX_HISTORY = 200

# Track recently used style prompts to encourage variety
recent_style_prompts: deque[tuple[str, str]] = deque(maxlen=20)

def extract_style_identifier(prompt: str) -> tuple[str, str]:
    """Return display text and lowercase key for the core style identifier."""
    patterns = [
        r"in the(?: [^.,;]+)? style of ([^.;\n]+)",
        r"as a(?:n)? ([^.;\n]+)",
        r"as an ([^.;\n]+)",
        r"rendered as a ([^.;\n]+)",
        r"in the ([^.;\n]+) style"
    ]
    for pattern in patterns:
        match = re.search(pattern, prompt, flags=re.IGNORECASE)
        if match:
            display = match.group(1).strip().strip('"\' ')
            key = display.lower()
            if display:
                return display, key
    fallback = prompt.strip().strip('"\' ')
    return fallback, fallback.lower()


def log_generation(
    original_filename: str,
    description: str,
    prompt: str,
    prompt_template: Optional[str] = None,
    generation_prompt: Optional[str] = None,
    generated_filename: Optional[str] = None,
    generation_time_seconds: Optional[float] = None,
    generation_timestamp_ms: Optional[int] = None,
):
    """Append generation details to generation-log-DO-NOT-DELETE.txt for analysis"""
    try:
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"""
{'='*80}
TIMESTAMP: {timestamp}
FILENAME: {original_filename}
ANALYSIS:
{description}

IMAGE PROMPT:
{prompt}
"""
        if prompt_template:
            log_entry += f"""

PROMPT TEMPLATE:
{prompt_template}
"""
        if generation_prompt:
            log_entry += f"""

GENERATION PROMPT:
{generation_prompt}
"""
        if generated_filename:
            log_entry += f"""

GENERATED FILENAME:
{generated_filename}
"""
        if generation_time_seconds is not None:
            log_entry += f"""

GENERATION TIME:
{generation_time_seconds:.2f}s
"""
        if generation_timestamp_ms is not None:
            log_entry += f"""

GENERATION TIMESTAMP MS:
{generation_timestamp_ms}
"""
        log_entry += f"""
{'='*80}

"""
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_entry)
        print(f"📝 Logged generation to {LOG_FILE.name}")
    except Exception as e:
        print(f"⚠️  Failed to write to log: {str(e)}")


def _parse_timestamp_ms(timestamp_str: Optional[str]) -> Optional[int]:
    if not timestamp_str:
        return None
    try:
        dt = datetime.strptime(timestamp_str.strip(), "%Y-%m-%d %H:%M:%S")
        return int(dt.timestamp() * 1000)
    except Exception:
        return None


def _parse_log_history() -> list[dict]:
    if not LOG_FILE.exists():
        return []

    entries: list[dict] = []
    current: dict[str, object] = {}
    section: Optional[str] = None
    pending_single_value: Optional[str] = None

    try:
        with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            for raw_line in f:
                line = raw_line.rstrip('\n')

                if pending_single_value:
                    stripped = line.strip()
                    if not stripped:
                        continue
                    if pending_single_value == 'generation_timestamp_ms':
                        try:
                            current['generation_timestamp_ms'] = int(stripped)
                        except Exception:
                            current['generation_timestamp_ms'] = None
                    else:
                        current[pending_single_value] = stripped
                    pending_single_value = None
                    continue
                if line.startswith('===') and set(line.strip()) == {'='}:
                    if current:
                        original_filename = current.get('original_filename')
                        analysis_lines = current.get('analysis')
                        prompt_lines = current.get('prompt')
                        prompt_template_lines = current.get('prompt_template')
                        generation_prompt_lines = current.get('generation_prompt')
                        entry = {
                            'timestamp': current.get('timestamp'),
                            'timestamp_ms': _parse_timestamp_ms(current.get('timestamp')),
                            'original_filename': original_filename,
                            'original_basename': Path(original_filename).stem if original_filename else '',
                            'generated_filename': current.get('generated_filename'),
                            'generation_time': current.get('generation_time'),
                            'generation_timestamp_ms': current.get('generation_timestamp_ms'),
                            'analysis': '\n'.join(analysis_lines).rstrip('\n') if analysis_lines else '',
                            'prompt': '\n'.join(prompt_lines).rstrip('\n') if prompt_lines else '',
                            'prompt_template': '\n'.join(prompt_template_lines).rstrip('\n') if prompt_template_lines else None,
                            'generation_prompt': '\n'.join(generation_prompt_lines).rstrip('\n') if generation_prompt_lines else None,
                        }
                        entries.append(entry)
                    current = {}
                    section = None
                    pending_single_value = None
                    continue

                if line.startswith('TIMESTAMP:'):
                    current['timestamp'] = line.split(':', 1)[1].strip()
                    continue
                if line.startswith('FILENAME:'):
                    current['original_filename'] = line.split(':', 1)[1].strip()
                    continue
                if line.startswith('GENERATED FILENAME:'):
                    value = line.split(':', 1)[1].strip()
                    if value:
                        current['generated_filename'] = value
                    else:
                        pending_single_value = 'generated_filename'
                    section = None
                    continue
                if line.startswith('GENERATION TIME:'):
                    value = line.split(':', 1)[1].strip()
                    if value:
                        current['generation_time'] = value
                    else:
                        pending_single_value = 'generation_time'
                    section = None
                    continue
                if line.startswith('GENERATION TIMESTAMP MS:'):
                    value = line.split(':', 1)[1].strip()
                    if value:
                        try:
                            current['generation_timestamp_ms'] = int(value)
                        except Exception:
                            current['generation_timestamp_ms'] = None
                    else:
                        pending_single_value = 'generation_timestamp_ms'
                    section = None
                    continue
                if line.startswith('ANALYSIS:'):
                    section = 'analysis'
                    current.setdefault(section, [])
                    continue
                if line.startswith('IMAGE PROMPT:'):
                    section = 'prompt'
                    current.setdefault(section, [])
                    continue
                if line.startswith('PROMPT TEMPLATE:'):
                    section = 'prompt_template'
                    current.setdefault(section, [])
                    continue
                if line.startswith('GENERATION PROMPT:'):
                    section = 'generation_prompt'
                    current.setdefault(section, [])
                    continue

                if section:
                    current.setdefault(section, []).append(line)

        # Final entry if file does not end with separator
        if current:
            original_filename = current.get('original_filename')
            analysis_lines = current.get('analysis')
            prompt_lines = current.get('prompt')
            prompt_template_lines = current.get('prompt_template')
            generation_prompt_lines = current.get('generation_prompt')
            entry = {
                'timestamp': current.get('timestamp'),
                'timestamp_ms': _parse_timestamp_ms(current.get('timestamp')),
                'original_filename': original_filename,
                'original_basename': Path(original_filename).stem if original_filename else '',
                'generated_filename': current.get('generated_filename'),
                'generation_time': current.get('generation_time'),
                'generation_timestamp_ms': current.get('generation_timestamp_ms'),
                'analysis': '\n'.join(analysis_lines).rstrip('\n') if analysis_lines else '',
                'prompt': '\n'.join(prompt_lines).rstrip('\n') if prompt_lines else '',
                'prompt_template': '\n'.join(prompt_template_lines).rstrip('\n') if prompt_template_lines else None,
                'generation_prompt': '\n'.join(generation_prompt_lines).rstrip('\n') if generation_prompt_lines else None,
            }
            entries.append(entry)
    except Exception as exc:
        print(f"⚠️  Failed to parse log history: {exc}")

    return entries


def load_generated_history_from_disk(max_entries: int = MAX_HISTORY):
    global generated_history

    metadata_entries = _parse_log_history()

    metadata_by_generated: dict[str, dict] = {}
    fallback_by_original: defaultdict[str, list[dict]] = defaultdict(list)

    for entry in metadata_entries:
        generated_name = entry.get('generated_filename')
        if generated_name:
            metadata_by_generated[str(generated_name)] = entry
        else:
            original_basename = entry.get('original_basename') or ''
            fallback_by_original[original_basename].append(entry)

    for key in fallback_by_original:
        fallback_by_original[key].sort(key=lambda e: e.get('generation_timestamp_ms') or e.get('timestamp_ms') or 0, reverse=True)

    loaded_entries: list[dict] = []

    if GENERATED_DIR.exists():
        generated_files = [
            path for path in GENERATED_DIR.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ]
        generated_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)

        for path in generated_files:
            if len(loaded_entries) >= max_entries:
                break

            filename = path.name
            meta = metadata_by_generated.get(filename)

            parts = filename.split('_', 2)
            original_guess = parts[2] if len(parts) == 3 else ''
            original_guess_basename = Path(original_guess).stem if original_guess else ''

            if not meta and original_guess_basename in fallback_by_original and fallback_by_original[original_guess_basename]:
                meta = fallback_by_original[original_guess_basename].pop(0)

            timestamp_ms = None
            if meta:
                timestamp_ms = meta.get('generation_timestamp_ms') or meta.get('timestamp_ms')
            if not timestamp_ms and len(parts) >= 3:
                try:
                    timestamp_ms = int(parts[1])
                except Exception:
                    timestamp_ms = None
            if not timestamp_ms:
                timestamp_ms = int(path.stat().st_mtime * 1000)

            entry = {
                "id": str(timestamp_ms),
                "filename": filename,
                "original_filename": (meta.get('original_filename') if meta else original_guess) or original_guess,
                "prompt": meta.get('prompt') if meta else '',
                "description": meta.get('analysis') if meta else '',
                "prompt_template": meta.get('prompt_template') if meta else None,
                "generation_prompt": meta.get('generation_prompt') if meta else None,
                "timestamp": timestamp_ms,
                "generation_time": meta.get('generation_time') if meta else '',
            }

            loaded_entries.append(entry)

    generated_history = loaded_entries
    print(f"🗂️  Loaded {len(generated_history)} generated history entries from disk (cap {max_entries})")


# Load any existing history when the server process starts
load_generated_history_from_disk()

class AnalyzeRequest(BaseModel):
    """Request model for image analysis"""
    photo_data: str  # base64 encoded image
    filename: str


class PromptRequest(BaseModel):
    """Request model for generating art style prompt"""
    description: str  # Image description from analysis
    filename: str


class GenerateRequest(BaseModel):
    """Request model for AI image generation"""
    photo_data: str  # base64 encoded image
    filename: str
    description: str  # Analysis text from analyze endpoint
    prompt: str  # Art style prompt from /api/prompt
    prompt_template: Optional[str] = None  # Full prompt instructions sent to AI
    generation_prompt: Optional[str] = None  # Final prompt sent to image generation


def get_all_photos():
    """Get list of all photo files in the photos directory"""
    if not PHOTOS_DIR.exists():
        return []
    
    photos = []
    for file in PHOTOS_DIR.iterdir():
        if file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS:
            photos.append(file)
    
    return photos


@app.on_event("startup")
async def startup_event():
    """Check photos directory on startup"""
    print("🚀 Starting Local Photo Slideshow...")
    
    if not PHOTOS_DIR.exists():
        print(f"⚠️  Photos directory not found: {PHOTOS_DIR}")
        print("📝 Creating photos directory...")
        PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create generated images directory
    if not GENERATED_DIR.exists():
        print(f"📝 Creating generated images directory: {GENERATED_DIR}")
        GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    
    photos = get_all_photos()
    print(f"📸 Found {len(photos)} photos in {PHOTOS_DIR}")
    
    if len(photos) == 0:
        print("⚠️  No photos found! Add some photos to the photos/ directory")
    else:
        print("✅ Ready to serve photos!")


@app.get("/")
async def root():
    """Health check endpoint"""
    photo_count = len(get_all_photos())
    return {
        "status": "ok",
        "message": "Local Photo Slideshow API",
        "photo_count": photo_count
    }


@app.get("/api/auth/status")
async def auth_status():
    """Always authenticated for local photos"""
    return {"authenticated": True}


@app.get("/api/photos/random")
async def get_random_photo():
    """
    Get a random photo from the photos directory - INSTANT!
    """
    import time
    start_time = time.time()
    
    photos = get_all_photos()
    
    if len(photos) == 0:
        raise HTTPException(
            status_code=404, 
            detail=f"No photos found in {PHOTOS_DIR}. Add some photos to get started!"
        )
    
    # Pick random photo - INSTANT!
    random_photo = random.choice(photos)
    
    print(f"🎲 Selected: {random_photo.name}")
    
    try:
        # Read photo file
        with open(random_photo, 'rb') as f:
            photo_data = f.read()
        
        # Encode to base64
        photo_base64 = base64.b64encode(photo_data).decode('utf-8')
        
        # Determine mime type
        mime_type = f"image/{random_photo.suffix[1:].lower()}"
        if mime_type == "image/jpg":
            mime_type = "image/jpeg"
        
        total_time = time.time() - start_time
        print(f"✅ Served in {total_time:.3f}s")
        
        return {
            "filename": random_photo.name,
            "created": None,
            "dimensions": {
                "width": None,
                "height": None,
            },
            "data": f"data:{mime_type};base64,{photo_base64}"
        }
    
    except Exception as e:
        print(f"❌ Error reading photo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to read photo: {str(e)}")


@app.get("/api/photos/{filename}")
async def get_photo_by_filename(filename: str):
    """Get a specific photo by filename"""
    try:
        start_time = time.time()
        
        # Find the photo file
        photo_path = PHOTOS_DIR / filename
        
        if not photo_path.exists():
            raise HTTPException(status_code=404, detail=f"Photo not found: {filename}")
        
        # Read and encode
        with open(photo_path, 'rb') as f:
            photo_bytes = f.read()
        
        photo_base64 = base64.b64encode(photo_bytes).decode()
        
        # Determine mime type
        extension = photo_path.suffix.lower()
        mime_types = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.gif': 'image/gif',
            '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif'
        }
        mime_type = mime_types.get(extension, 'image/jpeg')
        
        elapsed = time.time() - start_time
        print(f"📸 Fetched {filename} in {elapsed:.3f}s")
        
        return {
            "filename": filename,
            "created": None,
            "dimensions": {"width": None, "height": None},
            "data": f"data:{mime_type};base64,{photo_base64}"
        }
    
    except Exception as e:
        print(f"❌ Error fetching photo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch photo: {str(e)}")


@app.post("/api/analyze")
async def analyze_image(request: AnalyzeRequest):
    """
    Analyze image using Gemini 2.5 Flash Vision
    Returns a brief description of the image
    """
    start_time = time.time()
    
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Set GEMINI_API_KEY in .env file"
        )
    
    try:
        print(f"👁️  Analyzing image: {request.filename}")
        
        # Decode the base64 image
        image_data = request.photo_data
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode in ['RGBA', 'P']:
            image = image.convert('RGB')
        
        print(f"📐 Original image size: {image.size}")
        
        # Resize to thumbnail for faster analysis (max 800px on longest side)
        max_size = 800
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image_thumbnail = image.resize(new_size, Image.Resampling.LANCZOS)
            print(f"📐 Thumbnail size: {image_thumbnail.size}")
        else:
            image_thumbnail = image
        
        # Use Gemini Flash to analyze the image with brief prompt
        vision_model = genai.GenerativeModel('models/gemini-2.5-flash')
        
        analysis_prompt = """Describe this image briefly in 2-3 sentences. Focus on:
- Main subject(s)
- Setting/environment
- Overall mood

Be concise and vivid."""
        
        def run_analysis():
            return vision_model.generate_content([analysis_prompt, image_thumbnail])
        
        vision_response = await asyncio.to_thread(run_analysis)
        description = vision_response.text
        
        analysis_time = time.time() - start_time
        print(f"✅ Analysis complete in {analysis_time:.2f}s: {description[:80]}...")
        
        return {
            "filename": request.filename,
            "description": description,
            "analysis_time": f"{analysis_time:.2f}s"
        }
    
    except Exception as e:
        print(f"❌ Error in image analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Image analysis failed: {str(e)}"
        )


@app.post("/api/prompt")
async def generate_art_prompt(request: PromptRequest):
    """
    Generate a creative art style prompt based on image analysis
    Uses Gemini to create context-aware artistic prompts
    """
    start_time = time.time()
    
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Set GEMINI_API_KEY in .env file"
        )
    
    try:
        print(f"🎨 Generating art prompt for: {request.filename}")
        
        # Use Gemini to create a creative prompt based on the image description
        prompt_model = genai.GenerativeModel('models/gemini-2.5-flash')
        
        # Build recent style list to discourage repeats
        unique_recent = []
        seen_recent = set()
        for display, key in reversed(recent_style_prompts):
            if key not in seen_recent:
                unique_recent.append(display)
                seen_recent.add(key)
        unique_recent.reverse()
        if unique_recent:
            recent_prompt_section = "\n".join(f"- {item}" for item in unique_recent)
        else:
            recent_prompt_section = "- none yet (feel free to explore new directions)"
        
        prompt_template = textwrap.dedent(f"""You are an art director crafting ONE vivid, distinctive art direction for the next image generation.

Image description:
"{request.description}"

Instructions:
- Understand the core subjects, environment, and mood described above.
- Propose a bold artistic transformation that amplifies those elements.
- Avoid reusing these recently used styles:
{recent_prompt_section}
- Vary medium, era, and cultural influences over time (e.g., textiles, ceramics, printmaking, digital, folk art).
- Ensure the style still fits the scene (sports → dynamic/comic/graphic, nature → painterly/plein-air, portraits → illustrative/figurative, holidays → seasonal).
- Produce a single sentence (20–35 words) describing the transformation. Mention medium/technique, atmosphere, color palette, and include the exact phrase "in the style of ..." referencing the chosen artist or movement.

Reply with that one sentence only.""").strip()
        
        response = await asyncio.to_thread(prompt_model.generate_content, prompt_template)
        art_prompt = response.text.strip()
        
        # Clean up the response (remove quotes if present)
        art_prompt = art_prompt.strip('"').strip("'")
        
        display_style, style_key = extract_style_identifier(art_prompt)
        recent_style_prompts.append((display_style, style_key))
        
        prompt_time = time.time() - start_time
        print(f"✨ Generated prompt in {prompt_time:.2f}s: {art_prompt}")
        
        return {
            "filename": request.filename,
            "art_prompt": art_prompt,
            "prompt_time": f"{prompt_time:.2f}s",
            "prompt_template": prompt_template
        }
    
    except Exception as e:
        print(f"❌ Error generating prompt: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Prompt generation failed: {str(e)}"
        )


# Legacy prompt builder retained so we can restore the current behavior quickly if new experiments go sideways.
def build_legacy_generation_prompt(style_prompt: str) -> str:
    return (
        f"Transform this image {style_prompt}.\n\n"
        "Preserve the recognizable likeness of every person or subject, matching faces, expressions, and defining details as closely as possible.\n\n"
        "Make the transformation bold and distinctive."
    )


@app.post("/api/generate")
async def generate_ai_image(request: GenerateRequest):
    """
    Generate AI-styled image from original photo using Gemini 2.5 Flash Image (Nano Banana)
    Requires the image and description from /api/analyze
    """
    start_time = time.time()
    
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Set GEMINI_API_KEY in .env file"
        )
    
    try:
        print(f"🍌 Generating styled image for: {request.filename}")
        print(f"📝 Style prompt: {request.prompt}")
        
        # Decode the base64 image
        image_data = request.photo_data
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode in ['RGBA', 'P']:
            image = image.convert('RGB')
        
        print(f"📐 Original image size: {image.size}")
        
        # Resize for faster generation (max 1024px on longest side)
        # Nano Banana doesn't need full resolution and processes faster with smaller images
        max_size = 1024
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            print(f"📐 Resized for generation: {image.size}")
        
        # Generate image with Gemini 2.5 Flash Image (Nano Banana)
        # Use the AI-generated style prompt - Nano Banana works better with concise prompts
        generation_prompt = request.generation_prompt or build_legacy_generation_prompt(request.prompt)
        print(f"📝 Generation prompt: {generation_prompt}")
        print(f"📝 Prompt length: {len(generation_prompt)} chars")
        
        # Use Gemini 2.5 Flash Image for generation
        imagen_model = genai.GenerativeModel('models/gemini-2.5-flash-image')
        
        # Generate the styled image
        imagen_response = await asyncio.to_thread(imagen_model.generate_content, [generation_prompt, image])
        
        # Extract the generated image from response
        generated_image_part = None
        
        if hasattr(imagen_response, 'parts'):
            print(f"🔍 Response has {len(imagen_response.parts)} parts")
            for i, part in enumerate(imagen_response.parts):
                if hasattr(part, 'inline_data') and part.inline_data and hasattr(part.inline_data, 'data') and part.inline_data.data:
                    print(f"✅ Found image in part {i}")
                    generated_image_part = part.inline_data
                    break
        
        if not generated_image_part or not generated_image_part.data:
            raise Exception(f"No image data found in Gemini response")
        
        # Convert from Gemini format to base64
        generated_base64 = base64.b64encode(generated_image_part.data).decode()
        mime_type = generated_image_part.mime_type
        
        total_time = time.time() - start_time
        print(f"✅ Generation complete in {total_time:.2f}s: {mime_type}, {len(generated_image_part.data)} bytes")
        
        # Save generated image to disk
        timestamp = int(time.time() * 1000)  # milliseconds for uniqueness
        extension = '.png' if 'png' in mime_type else '.jpg'
        saved_filename = f"gen_{timestamp}_{request.filename.rsplit('.', 1)[0]}{extension}"
        saved_path = GENERATED_DIR / saved_filename
        
        # Write image bytes to file
        with open(saved_path, 'wb') as f:
            f.write(generated_image_part.data)
        print(f"💾 Saved generated image: {saved_filename}")
        
        # Create history entry
        history_entry = {
            "id": str(timestamp),
            "filename": saved_filename,
            "original_filename": request.filename,
            "prompt": request.prompt,
            "description": request.description,
            "prompt_template": request.prompt_template,
            "generation_prompt": generation_prompt,
            "timestamp": timestamp,
            "generation_time": f"{total_time:.2f}s"
        }
        
        # Add to history (keep most recent MAX_HISTORY entries in memory)
        generated_history[:] = [entry for entry in generated_history if entry.get('filename') != saved_filename]
        generated_history.insert(0, history_entry)
        if len(generated_history) > MAX_HISTORY:
            del generated_history[MAX_HISTORY:]
        
        # Log to file for analysis
        log_generation(
            original_filename=request.filename,
            description=request.description,
            prompt=request.prompt,
            prompt_template=request.prompt_template,
            generation_prompt=generation_prompt,
            generated_filename=saved_filename,
            generation_time_seconds=total_time,
            generation_timestamp_ms=timestamp,
        )
        
        return {
            "id": history_entry["id"],
            "filename": f"ai_{request.filename}",
            "original_filename": request.filename,
            "prompt": request.prompt,
            "description": request.description,
            "prompt_template": request.prompt_template,
            "generation_prompt": generation_prompt,
            "generated_image": f"data:{mime_type};base64,{generated_base64}",
            "generation_time": f"{total_time:.2f}s",
            "saved_path": str(saved_filename)
        }
    
    except Exception as e:
        print(f"❌ Error in AI generation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"AI generation failed: {str(e)}"
        )


@app.get("/api/generated/history")
async def get_generated_history():
    """Get list of recently generated images"""
    return {
        "history": generated_history
    }


@app.get("/api/generated/{filename}")
async def get_generated_image(filename: str):
    """Serve a generated image by filename"""
    try:
        file_path = GENERATED_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Generated image not found: {filename}")
        
        # Read and encode as base64
        with open(file_path, 'rb') as f:
            image_bytes = f.read()
        
        image_base64 = base64.b64encode(image_bytes).decode()
        
        # Determine mime type from extension
        extension = file_path.suffix.lower()
        mime_type = 'image/png' if extension == '.png' else 'image/jpeg'
        
        return {
            "filename": filename,
            "data": f"data:{mime_type};base64,{image_base64}"
        }
    
    except Exception as e:
        print(f"❌ Error serving generated image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to serve image: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
