import fitz  # PyMuPDF
from app.utils.chunking import chunk_text


def extract_and_chunk(pdf_path: str, filename: str) -> list[dict]:
    try:
        doc = fitz.open(pdf_path)
    except Exception as exc:
        raise RuntimeError("Unable to open the uploaded PDF.") from exc

    full_text = ""
    page_map: list[tuple[int, int]] = []

    try:
        for page_num, page in enumerate(doc, start=1):
            page_map.append((len(full_text), page_num))
            full_text += page.get_text()
    finally:
        doc.close()

    if not full_text.strip():
        return []

    return chunk_text(full_text, source=filename, page_map=page_map)