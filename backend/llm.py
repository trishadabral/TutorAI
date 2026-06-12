import os
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Call Groq's Llama 3 70B model with retry logic for rate limits."""
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
               model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = "rate" in error_str or "429" in error_str
            if is_rate_limit and attempt < MAX_RETRIES - 1:
                wait = RETRY_DELAY * (2 ** attempt)
                print(f"Groq rate limited, retrying in {wait}s (attempt {attempt + 1})")
                time.sleep(wait)
            else:
                print(f"Groq error: {e}")
                return f"LLM error: {e}. Check your GROQ_API_KEY in .env"
