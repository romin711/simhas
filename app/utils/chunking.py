from app.core.config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_text(text: str, source: str, page_map: list[tuple[int, int]]) -> list[dict]:
    """
    Splits text into overlapping word chunks, tracking source and page number.

    page_map: list of (start_char, page_number) pairs, sorted by start_char.
    """
    words = text.split()
    chunks = []

    char_offset = 0
    word_positions = []
    for word in words:
        idx = text.find(word, char_offset)
        word_positions.append(idx)
        char_offset = idx + len(word)

    def get_page(char_idx: int) -> int:
        page = 1
        for start, pnum in page_map:
            if char_idx >= start:
                page = pnum
            else:
                break
        return page

    for i in range(0, len(words), CHUNK_SIZE - CHUNK_OVERLAP):
        chunk_words = words[i: i + CHUNK_SIZE]
        if not chunk_words:
            continue
        chunk_text_str = " ".join(chunk_words)
        char_idx = word_positions[i] if i < len(word_positions) else 0
        page = get_page(char_idx)
        chunks.append({
            "text": chunk_text_str,
            "source": source,
            "page": page,
        })

    return chunks