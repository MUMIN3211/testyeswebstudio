# FastAPI backend

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Environment

- `DATABASE_URL` (required for Supabase/PostgreSQL)
- `CORS_ORIGINS` (comma-separated, default `http://localhost:3000`)
