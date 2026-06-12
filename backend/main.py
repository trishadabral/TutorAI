from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil, uuid, os, tempfile, traceback
from pipeline import index_pdf
from rag import answer_question
from mcq import generate_mcq
from dkt import update_knowledge, get_full_knowledge_state

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class ChatRequest(BaseModel):
    question: str
    session_id: str

class MCQRequest(BaseModel):
    topic: str
    session_id: str

class AnswerRequest(BaseModel):
    session_id: str
    concept: str
    correct: bool

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/upload")
async def upload(
    file: UploadFile = File(...),
    session_id: str = Query(default=None)
):
    if not session_id:
        session_id = str(uuid.uuid4())

    # Use cross-platform temp directory
    tmp_dir = tempfile.gettempdir()
    tmp_path = os.path.join(tmp_dir, f"{uuid.uuid4()}_{file.filename}")

    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        result = index_pdf(tmp_path, session_id)

        return {
            "session_id": session_id,
            "filename": file.filename,
            **result
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        return answer_question(req.question, req.session_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mcq")
async def mcq(req: MCQRequest):
    try:
        return generate_mcq(req.topic, req.session_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mcq/answer")
async def submit_answer(req: AnswerRequest):
    try:
        state = update_knowledge(req.session_id, req.concept, req.correct)
        return {
            "updated": True,
            "new_score": state["concepts"].get(req.concept)
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/knowledge/{session_id}")
async def knowledge(session_id: str):
    try:
        return get_full_knowledge_state(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
