import requests
from app.core.config import OLLAMA_URL, OLLAMA_MODEL


def generate_answer(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(c["text"] for c in chunks)

    prompt = f"""You are a strict assistant.

Answer ONLY from the given context.
Keep the answer SHORT (max 3 sentences).
Do NOT use prior knowledge.
If not found, say: "Not found in provided data."

Context:
{context}

Question: {question}

Answer:"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=300,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError("Failed to contact the local LLM service.") from exc

    return response.json()["response"].strip()