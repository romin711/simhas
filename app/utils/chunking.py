import re

from app.core.config import CHUNK_SIZE, CHUNK_OVERLAP


def _sentence_spans(text: str) -> list[tuple[int, int]]:
    spans = []
    for match in re.finditer(r"[^.!?\n]+[.!?\n]*", text):
        start, end = match.span()
        if text[start:end].strip():
            spans.append((start, end))
    return spans or [(0, len(text))]


def chunk_text(text: str, source: str, page_map: list[tuple[int, int]]) -> list[dict]:
    """
    Splits text into overlapping word chunks, tracking source and page number.

    page_map: list of (start_char, page_number) pairs, sorted by start_char.
    """
    chunks = []
    sentence_spans = _sentence_spans(text)

    sentences: list[list[tuple[str, int]]] = []
    for start, end in sentence_spans:
        sentence = text[start:end]
        sentence_words = [
            (word_match.group(), start + word_match.start())
            for word_match in re.finditer(r"\S+", sentence)
        ]
        if sentence_words:
            sentences.append(sentence_words)

    def get_page(char_idx: int) -> int:
        page = 1
        for start, pnum in page_map:
            if char_idx >= start:
                page = pnum
            else:
                break
        return page

    overlap_words = max(0, CHUNK_OVERLAP)
    current_chunk: list[tuple[str, int]] = []

    def emit_chunk(chunk_words: list[tuple[str, int]]):
        if not chunk_words:
            return
        char_idx = chunk_words[0][1]
        chunks.append(
            {
                "text": " ".join(word for word, _ in chunk_words),
                "source": source,
                "page": get_page(char_idx),
            }
        )

    def append_sentence(sentence_words: list[tuple[str, int]]):
        nonlocal current_chunk

        if len(sentence_words) > CHUNK_SIZE:
            if current_chunk:
                emit_chunk(current_chunk)
                current_chunk = current_chunk[-overlap_words:] if overlap_words else []

            step = max(1, CHUNK_SIZE - overlap_words)
            for offset in range(0, len(sentence_words), step):
                emit_chunk(sentence_words[offset:offset + CHUNK_SIZE])
            current_chunk = []
            return

        if current_chunk and len(current_chunk) + len(sentence_words) > CHUNK_SIZE:
            emit_chunk(current_chunk)
            current_chunk = current_chunk[-overlap_words:] if overlap_words else []

        current_chunk.extend(sentence_words)

    for sentence_words in sentences:
        append_sentence(sentence_words)

    if current_chunk:
        emit_chunk(current_chunk)

    return chunks