<div align="center">

```
    ___       __                 __            __  ______            __          
   /   | ____/ /___ _____  _____/ /_  ______  / /_/ ____/_  ______/ /_____  _____
  / /| |/ __  / __ `/ __ \/ ___/ __ \/ / __ \/ __/ /   / / / / __  / _ \ \/ / _ \
 / ___ / /_/ / /_/ / /_/ / /__/ / / / / /_/ / /_/ /___/ /_/ / /_/ /  __>  <  __/
/_/  |_\__,_/\__,_/ .___/\___/_/ /_/_/____/\__/\____/\__,_/\__,_/\___/_/\_\/___/ 
                 /_/                                                              
```

**A RAG-Powered Personalized Study Assistant with Deep Knowledge Tracing**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Problem Statement

Students upload massive PDFs to chat with them, but traditional RAG systems treat every student the same. A struggling student and an advanced student get identical answers and identical quiz questions. **AdaptiveTutor** solves this by modeling *what each student actually knows* using Deep Knowledge Tracing (DKT) and dynamically adapting both retrieval results and MCQ difficulty per individual student.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Upload   │ │   Chat   │ │   Quiz   │ │ Knowledge Map │  │
│  │   Page    │ │   Page   │ │   Page   │ │    Page       │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       └────────────┴────────────┴───────────────┘           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (localhost:5173 → :8000)
┌───────────────────────────┴─────────────────────────────────┐
│                    Backend (FastAPI)                          │
│                                                              │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────┐  │
│  │  Document     │───>│  Hybrid       │───>│  RAG Chain  │  │
│  │  Pipeline     │    │  Retriever    │    │  (LangChain)│  │
│  │  (OCR+Chunk)  │    │  BM25+Dense   │    │             │  │
│  └──────────────┘    │  +RRF+Rerank  │    └─────────────┘  │
│                       └───────┬───────┘                      │
│                               │                              │
│  ┌──────────────┐    ┌───────┴───────┐    ┌─────────────┐  │
│  │  MCQ         │───>│  Deep         │───>│  Evaluation  │  │
│  │  Generator   │    │  Knowledge    │    │  (RAGAs+AUC) │  │
│  │  (Adaptive)  │    │  Tracing      │    │             │  │
│  └──────────────┘    │  (LSTM/PyTorch)│    └─────────────┘  │
│                      └───────────────┘                       │
│                                                              │
│  ChromaDB (Vector Store)  │  BM25 Index  │  Student States  │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer        | Technology                                               |
| ------------ | -------------------------------------------------------- |
| **Frontend** | React 18, Vite, TailwindCSS, Framer Motion, Recharts    |
| **Backend**  | Python 3.10+, FastAPI, LangChain, PyTorch               |
| **Storage**  | ChromaDB (vector), JSON (student states), File (PDFs)   |
| **ML/NLP**   | sentence-transformers, KeyBERT, PyTorch LSTM, BM25      |
| **OCR**      | pytesseract (for scanned PDFs)                          |
| **Eval**     | RAGAs metrics, scikit-learn AUC                         |
| **LLM**      | OpenAI GPT-3.5-turbo (optional, template fallback)      |

---

## How to Run

### Prerequisites

- Python 3.10+
- Node.js 18+
- Tesseract OCR installed (`sudo apt install tesseract-ocr` or [Windows installer](https://github.com/UB-Mannheim/tesseract/wiki))

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your OpenAI API key in .env
# OPENAI_API_KEY=sk-your-key-here

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The frontend will be available at **http://localhost:5173** and will proxy API calls to the backend at **http://localhost:8000**.

---

## API Endpoints

| Method | Path              | Description                                    |
| ------ | ----------------- | ---------------------------------------------- |
| POST   | `/upload`         | Upload and index a PDF document                |
| POST   | `/chat`           | Ask a question, get RAG answer + citations     |
| POST   | `/mcq`            | Generate adaptive MCQ for a topic              |
| POST   | `/mcq/answer`     | Submit MCQ answer, update DKT knowledge state  |
| GET    | `/knowledge/{id}` | Get student knowledge scores per concept       |
| GET    | `/eval`           | Return evaluation metrics                      |
| POST   | `/eval/run`       | Run the full evaluation suite                  |

---

## Evaluation Results

| Metric             | Score  | Description                               |
| ------------------ | ------ | ----------------------------------------- |
| Faithfulness       | ~0.72  | How grounded answers are in source docs   |
| Answer Relevancy   | ~0.68  | How relevant answers are to questions     |
| Context Recall     | ~0.61  | How much relevant context was retrieved   |
| DKT AUC            | ~0.50* | AUC on held-out interaction sequences     |

*\*DKT AUC improves significantly as more student interactions are collected. Initial value is 0.5 (random baseline) with no interaction data.*

---

## Features

- **Smart PDF Processing** - Handles both digital and scanned PDFs with OCR
- **Hybrid Retrieval** - Combines BM25 sparse + dense vector search with Reciprocal Rank Fusion
- **Knowledge-Aware Reranking** - Retrieval adapts based on what the student knows/doesn't know
- **Adaptive MCQs** - Questions get harder as student mastery increases (Conceptual -> Application -> Analytical)
- **Deep Knowledge Tracing** - LSTM model tracks per-concept knowledge probability (0-1)
- **Beautiful UI** - Premium EdTech aesthetic with dark/light mode, glassmorphism, smooth animations
- **Knowledge Visualization** - Radar chart + progress bars showing mastery per concept

---

## Screenshots

*Screenshots coming soon. Run the app to see:*
- Upload page with drag-and-drop PDF zone
- Chat interface with page citations and concept tags
- Adaptive quiz with difficulty badges
- Knowledge map with radar chart and progress bars

---

## Future Work

- [ ] Multi-modal document support (images, tables, LaTeX)
- [ ] Collaborative study sessions with shared knowledge models
- [ ] Spaced repetition scheduling based on DKT predictions
- [ ] Fine-tuned embedding model on educational content
- [ ] Mobile-responsive PWA support
- [ ] Integration with LMS platforms (Canvas, Moodle)
- [ ] Real-time collaborative annotation of study materials
- [ ] Transfer learning: pre-train DKT on population data, fine-tune per student

---

## License

MIT
