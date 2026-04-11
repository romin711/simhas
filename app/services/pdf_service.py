import fitz  # PyMuPDF
from app.utils.chunking import chunk_text


def extract_and_chunk(pdf_path: str, filename: str) -> list[dict]:
    doc = fitz.open(pdf_path)
    full_text = ""
    page_map: list[tuple[int, int]] = []

    for page_num, page in enumerate(doc, start=1):
        page_map.append((len(full_text), page_num))
        full_text += page.get_text()

    doc.close()

    if not full_text.strip():
        return []

    return chunk_text(full_text, source=filename, page_map=page_map)