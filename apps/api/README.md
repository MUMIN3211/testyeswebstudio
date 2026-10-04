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

### Supabase connection string template

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

> If your database password contains special characters, percent-encode it in the URL.
