import unittest
from unittest.mock import patch

from app.utils.chunking import chunk_text


class ChunkingTestCase(unittest.TestCase):
    def test_chunk_text_keeps_sentence_boundary_and_page_map(self):
        text = "First sentence ends here. Second sentence continues on the next page. Third sentence closes it."
        page_map = [(0, 1), (51, 2)]

        with patch("app.utils.chunking.CHUNK_SIZE", 6), patch("app.utils.chunking.CHUNK_OVERLAP", 2):
            chunks = chunk_text(text, source="report.pdf", page_map=page_map)

        self.assertGreaterEqual(len(chunks), 2)
        self.assertEqual(chunks[0]["source"], "report.pdf")
        self.assertEqual(chunks[0]["page"], 1)
        self.assertIn("First sentence ends here.", chunks[0]["text"])
        self.assertTrue(chunks[0]["text"].endswith("here."))
        self.assertTrue(any(chunk["page"] == 2 for chunk in chunks))


if __name__ == "__main__":
    unittest.main()