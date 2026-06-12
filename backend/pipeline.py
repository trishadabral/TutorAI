import os, uuid
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from chromadb.utils import embedding_functions

CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

def get_or_create_collection(session_id: str):
    name = f"s_{session_id.replace('-','')[:40]}"
    return chroma_client.get_or_create_collection(
        name=name,
        embedding_function=embedding_fn
    )

def extract_text_from_pdf(pdf_path: str) -> list:
    """Extract text page by page. Falls back to OCR if text is empty."""
    pages_text = []

    # Method 1: pypdf (fast, works for text-based PDFs)
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages_text.append({"text": text.strip(), "page": i + 1})
    except Exception as e:
        print(f"pypdf failed: {e}")
        pages_text = []

    # Check if we got meaningful text
    total_text = " ".join([p["text"] for p in pages_text])

    # Method 2: OCR fallback for scanned PDFs
    if len(total_text.strip()) < 100:
        print("Text extraction yielded little content, trying OCR...")
        try:
            from pdf2image import convert_from_path
            import pytesseract
            images = convert_from_path(pdf_path, dpi=150)
            pages_text = []
            for i, img in enumerate(images):
                text = pytesseract.image_to_string(img)
                pages_text.append({"text": text.strip(), "page": i + 1})
        except Exception as e:
            print(f"OCR failed: {e}. Using whatever text we have.")

    return pages_text

def index_pdf(pdf_path: str, session_id: str) -> dict:
    pages_text = extract_text_from_pdf(pdf_path)

    if not pages_text:
        return {"chunks_indexed": 0, "pages_processed": 0, "error": "Could not extract text"}

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=64,
        separators=["\n\n", "\n", ".", " ", ""]
    )

    collection = get_or_create_collection(session_id)

    docs, metadatas, ids = [], [], []
    for page_data in pages_text:
        if not page_data["text"]:
            continue
        chunks = splitter.split_text(page_data["text"])
        for chunk in chunks:
            if len(chunk.strip()) < 30:
                continue
            docs.append(chunk)
            metadatas.append({
                "page": str(page_data["page"]),
                "session_id": session_id
            })
            ids.append(str(uuid.uuid4()))

    if docs:
        # Add in batches of 100 to avoid memory issues
        batch_size = 100
        for i in range(0, len(docs), batch_size):
            collection.add(
                documents=docs[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size],
                ids=ids[i:i+batch_size]
            )

    return {
        "chunks_indexed": len(docs),
        "pages_processed": len(pages_text)
    }

def query_collection(query: str, session_id: str, n_results: int = 5) -> list:
    try:
        collection = get_or_create_collection(session_id)
        count = collection.count()
        if count == 0:
            return []
        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, count)
        )
        chunks = []
        for i, doc in enumerate(results["documents"][0]):
            chunks.append({
                "text": doc,
                "page": results["metadatas"][0][i].get("page", "?")
            })
        return chunks
    except Exception as e:
        print(f"Query failed: {e}")
        return []
