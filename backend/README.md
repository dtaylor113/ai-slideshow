# iCloud Photo Bridge - Backend

Python FastAPI server that provides API access to iCloud photos.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. (Optional) Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### Authentication
- `POST /api/auth/login` - Login with Apple ID
- `POST /api/auth/verify-2fa` - Verify 2FA code
- `GET /api/auth/status` - Check authentication status

### Photos
- `GET /api/photos/albums` - List all albums
- `GET /api/photos/random` - Get a random photo (optionally filtered by album)

## Notes

- First time authentication requires 2FA
- Photos are returned as base64-encoded data URLs
- CORS is enabled for local development (ports 3000 and 5173)

