import requests

from app.core.config import OLLAMA_MODEL, OLLAMA_URL


def _format_chunk(index: int, chunk: dict) -> str:
    source = chunk.get("source", "unknown source")
    page = chunk.get("page", "?")
    text = chunk.get("text", "").strip()
    return f"[{index}] {source} p. {page}\n{text}"


def _extract_response_text(payload: dict) -> str:
    response = payload.get("response")
    if not isinstance(response, str) or not response.strip():
        raise RuntimeError("LLM returned an empty response.")
    return response.strip()


def generate_answer(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(_format_chunk(i + 1, chunk) for i, chunk in enumerate(chunks))

    prompt = f"""You are a strict assistant.

Answer ONLY from the given context.
Keep the answer SHORT (max 3 sentences).
Do NOT use prior knowledge.
Prefer the most relevant evidence and mention uncertainty if the context is weak.
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

    try:
        payload = response.json()
    except ValueError as exc:
        raise RuntimeError("LLM returned invalid JSON.") from exc

    return _extract_response_text(payload)