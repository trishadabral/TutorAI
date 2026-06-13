<div align="center">

# 🧠 AdaptiveTutor

### AI-Powered Personalized Study Assistant

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5-FF6B35?style=for-the-badge)](https://trychroma.com)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-6C63FF?style=for-the-badge)](LICENSE)

<br/>

> **Turn your lecture notes and PDFs into a personal AI tutor that actually knows what you know — and adapts to help you learn faster.**

<br/>

## 🎬 Demo Video

[![AdaptiveTutor Demo](https://img.shields.io/badge/▶%20Watch%20Full%20Demo-FF0000?style=for-the-badge&logo=google-drive&logoColor=white)](https://drive.google.com/file/d/1gmdl-aJrU2E94DNVMyRMAZqZcytaiide/view?usp=sharing)

*Click above to watch the full demo — PDF upload → AI Chat → Adaptive Quiz → Knowledge Map*

</div>

---

## 📖 What is AdaptiveTutor?

AdaptiveTutor is a full-stack AI study assistant that transforms your college PDFs, lecture slides, and notes into an intelligent, personalized tutor. 

Unlike generic chatbots, AdaptiveTutor uses **Retrieval-Augmented Generation (RAG)** to ground every answer in your actual study material — with page citations — and **Bayesian Knowledge Tracing (BKT)** to model your understanding per concept, dynamically adapting quiz difficulty as you learn.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **PDF Intelligence** | Upload any PDF — text or scanned. OCR fallback ensures nothing is missed. |
| 💬 **Grounded Chat** | Ask anything about your material. Every answer cites the exact page number. |
| 🎯 **Adaptive Quizzes** | MCQs that start easy and get harder as you improve — powered by real ML. |
| 🧠 **Knowledge Tracing** | Bayesian Knowledge Tracing models your mastery per concept in real time. |
| 📊 **Knowledge Map** | Radar chart + progress bars showing strong topics, weak spots, and growth. |
| 🌙 **Dark / Light Mode** | Premium UI with smooth theme toggle, persisted across sessions. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│         React + Vite  •  TailwindCSS  •  Framer Motion  │
│    Upload  │  Chat  │  Quiz  │  Knowledge Map           │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│                      BACKEND                            │
│                   FastAPI + Python                      │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │  pipeline   │   │     rag      │   │     mcq     │  │
│  │  PDF → OCR  │   │  Retriever   │   │  Generator  │  │
│  │  Chunk/Embed│   │  + LLM Chain │   │  Adaptive   │  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬──────┘  │
│         │                 │                  │          │
│  ┌──────▼──────┐   ┌──────▼───────┐   ┌──────▼──────┐  │
│  │  ChromaDB   │   │  Groq LLM    │   │    dkt      │  │
│  │Vector Store │   │Llama 3.3 70B │   │Bayesian KT  │  │
│  └─────────────┘   └──────────────┘   └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🤖 How the ML Works

### RAG Pipeline
1. PDF is loaded and chunked (512 tokens, 64 overlap)
2. Chunks embedded with `all-MiniLM-L6-v2` → stored in ChromaDB
3. On query: top-5 relevant chunks retrieved via semantic search
4. Chunks + question passed to Llama 3.3 70B → grounded answer with page citations

### Bayesian Knowledge Tracing (BKT)
Tracks your knowledge state per concept using 4 parameters:
- **P(Learn)** = 0.30 — probability of learning from each attempt
- **P(Forget)** = 0.05 — probability of forgetting
- **P(Guess)** = 0.25 — probability of guessing correctly
- **P(Slip)** = 0.10 — probability of slipping despite knowing

### Adaptive Difficulty
```
conceptual  ──► (score > 0.5, attempts ≥ 2) ──► application
application ──► (score > 0.7, attempts ≥ 4) ──► analytical
any level   ──► (score < 0.35)              ──► conceptual (reset)
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18 + Vite** — UI framework
- **TailwindCSS** — utility-first styling
- **Framer Motion** — animations
- **Recharts** — radar chart visualizations
- **Lucide React** — icon library

### Backend
- **FastAPI** — REST API server
- **LangChain** — document loading + chunking pipeline
- **ChromaDB** — vector database
- **Sentence Transformers** — `all-MiniLM-L6-v2` embeddings
- **PyPDF + pytesseract** — PDF parsing + OCR fallback
- **Groq API** — Llama 3.3 70B inference

### ML / AI
- **RAG** — Retrieval Augmented Generation
- **BKT** — Bayesian Knowledge Tracing
- **Adaptive MCQ** — difficulty progression system

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/adaptive-tutor.git
cd adaptive-tutor
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:
```bash
uvicorn main:app --reload
```
Backend runs at `http://localhost:8000`

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload and index a PDF |
| `POST` | `/chat` | Ask a question about uploaded material |
| `POST` | `/mcq` | Generate an adaptive MCQ |
| `POST` | `/mcq/answer` | Submit answer + update knowledge state |
| `GET` | `/knowledge/{session_id}` | Get full knowledge state |
| `GET` | `/health` | Health check |

---

## 📁 Project Structure

```
adaptive-tutor/
├── backend/
│   ├── main.py          # FastAPI app + all endpoints
│   ├── pipeline.py      # PDF ingestion + ChromaDB indexing
│   ├── rag.py           # RAG chain + answer generation
│   ├── mcq.py           # Adaptive MCQ generation
│   ├── dkt.py           # Bayesian Knowledge Tracing
│   ├── llm.py           # Groq LLM wrapper
│   ├── requirements.txt
│   └── .env             # GROQ_API_KEY 
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Upload.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Quiz.jsx
│   │   │   └── KnowledgeMap.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## 🔮 Future Work

- [ ] Multi-PDF support per session
- [ ] Spaced repetition scheduling (SM-2 algorithm)
- [ ] Support for PPTX and DOCX files
- [ ] Collaborative study rooms
- [ ] Mobile app (React Native)
- [ ] Export knowledge report as PDF
- [ ] Fine-tuned embedding model for academic text

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with by trisha

</div>
