# AdaptiveTutor — Deployment Guide

## Prerequisites

- GitHub repository with your code pushed
- A free Groq API key from [console.groq.com](https://console.groq.com)
- Accounts on [Render.com](https://render.com) and [Vercel](https://vercel.com)

---

## Deploy Backend (Render.com)

### 1. Push code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Create Web Service on Render

1. Go to [render.com](https://render.com) → **New +** → **Web Service**
2. Connect your GitHub repository
3. Set the **Root Directory** to `backend`
4. Configure:
   - **Name**: `adaptivetutor-backend`
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Set Environment Variables

In Render dashboard → your service → **Environment**:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | *(paste your key from console.groq.com)* |
| `CHROMA_PATH` | `/data/chroma_db` |
| `KNOWLEDGE_DIR` | `/data/knowledge_states` |
| `FRONTEND_URL` | *(your Vercel URL, e.g. `https://adaptivetutor.vercel.app`)* |

### 4. Add Persistent Disk

1. Go to your service → **Disks** → **Add Disk**
2. **Name**: `adaptivetutor-data`
3. **Mount Path**: `/data`
4. **Size**: 1 GB

### 5. Deploy

Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://adaptivetutor-backend.onrender.com`).

---

## Deploy Frontend (Vercel)

### 1. Update Environment Variable

Edit `frontend/.env.production` and replace the placeholder URL with your actual Render backend URL:

```
VITE_API_BASE=https://adaptivetutor-backend.onrender.com
```

Commit and push this change.

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repository
3. Set the **Root Directory** to `frontend`
4. Add Environment Variable:
   - **Key**: `VITE_API_BASE`
   - **Value**: `https://adaptivetutor-backend.onrender.com` *(your Render URL)*
5. Click **Deploy**

### 3. Copy Your Frontend URL

Once deployed, Vercel gives you a live URL (e.g. `https://adaptivetutor.vercel.app`).

---

## Post-Deployment Verification

1. **Open** your Vercel frontend URL
2. **Upload a PDF** → should show "chunks indexed: N" where N > 0
3. **Ask a question** in Chat → should get a real answer citing page numbers
4. **Take a quiz** → should generate unique MCQs with A/B/C/D options
5. **Check Knowledge Map** → should update after answering quiz questions

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
# Set GROQ_API_KEY in backend/.env
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

The frontend reads `VITE_API_BASE` from `.env.development` (defaults to `http://localhost:8000`).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "LLM error: Check your GROQ_API_KEY" | Verify `GROQ_API_KEY` is set in Render environment |
| Upload fails with 500 | Check Render disk is mounted at `/data` |
| CORS error in browser | Set `FRONTEND_URL` in Render to your Vercel URL |
| "No document found" in chat | Upload a PDF first for the same session |
| Knowledge map empty | Answer quiz questions first — it updates live |
