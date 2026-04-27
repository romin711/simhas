import re

import fitz  # PyMuPDF
from app.utils.chunking import chunk_text


def _clean_page_text(raw_text: str) -> str:
    # Join hyphenated line breaks common in PDFs: "sys-\ntem" -> "system".
    text = raw_text.replace("\u00ad", "")
    text = text.replace("\r", "\n")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)

    # Keep paragraph breaks, but collapse noisy single newlines and spacing.
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)
    text = re.sub(r"[ \t]{2,}", " ", text)

    return text.strip()


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
            cleaned = _clean_page_text(page.get_text("text", sort=True))
            if cleaned:
                full_text += cleaned + "\n\n"
    finally:
        doc.close()

    if not full_text.strip():
        return []

    return chunk_text(full_text, source=filename, page_map=page_map)