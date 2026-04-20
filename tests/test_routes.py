import importlib
import os
import unittest
from contextlib import contextmanager
from unittest.mock import patch

import numpy as np
from fastapi.testclient import TestClient

from app.db.vector_store import vector_store
from app.core import config as config_module
from app.main import app


@contextmanager
def client_context():
    with patch("app.db.vector_store.vector_store.load", return_value=None):
        with TestClient(app) as client:
            yield client


class RoutesTestCase(unittest.TestCase):
    def setUp(self):
        self._original_index = vector_store.index
        self._original_chunks = list(vector_store.chunks)
        vector_store.index = None
        vector_store.chunks = []

    def tearDown(self):
        vector_store.index = self._original_index
        vector_store.chunks = self._original_chunks

    def test_upload_pdf_returns_chunk_count(self):
        fake_chunks = [
            {"text": "Chunk 1", "source": "report.pdf", "page": 1},
            {"text": "Chunk 2", "source": "report.pdf", "page": 2},
        ]

        with client_context() as client, patch(
            "app.api.routes.extract_and_chunk", return_value=fake_chunks
        ) as mock_extract, patch(
            "app.api.routes.embed_chunks",
            return_value=np.array([[0.1, 0.2], [0.3, 0.4]], dtype="float32"),
        ) as mock_embed, patch("app.api.routes.vector_store.add") as mock_add:
            response = client.post(
                "/upload",
                files={"file": ("report.pdf", b"%PDF-1.4 fake content", "application/pdf")},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "chunks_stored": 2})
        mock_extract.assert_called_once()
        mock_embed.assert_called_once_with(["Chunk 1", "Chunk 2"])
        mock_add.assert_called_once()

    def test_upload_rejects_non_pdf(self):
        with client_context() as client:
            response = client.post(
                "/upload",
                files={"file": ("notes.txt", b"plain text", "text/plain")},
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Only PDF files are accepted.")

    def test_query_rejects_when_store_is_empty(self):
        with client_context() as client, patch(
            "app.api.routes.vector_store.is_empty", return_value=True
        ):
            response = client.post("/query", json={"question": "What is this about?"})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "No documents uploaded yet.")

    def test_query_returns_fallback_when_no_chunks_match(self):
        retrieval = {
            "chunks": [],
            "meta": {
                "top_score": 0.2,
                "min_relevance_score": 0.35,
                "used_chunks": 0,
                "retrieved_chunks": 3,
                "candidate_chunks": 3,
                "rerank_applied": True,
                "weak_evidence": True,
            },
        }

        with client_context() as client, patch(
            "app.api.routes.vector_store.is_empty", return_value=False
        ), patch("app.api.routes.retrieve", return_value=retrieval):
            response = client.post("/query", json={"question": "What is this about?"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "answer": "No relevant information found.",
                "sources": [],
                "meta": {
                    "top_score": 0.2,
                    "min_relevance_score": 0.35,
                    "used_chunks": 0,
                    "retrieved_chunks": 3,
                    "candidate_chunks": 3,
                    "rerank_applied": True,
                    "weak_evidence": True,
                },
            },
        )

    def test_query_returns_answer_and_sources(self):
        fake_chunks = [
            {"text": "Source 1", "source": "report.pdf", "page": 3},
            {"text": "Source 2", "source": "report.pdf", "page": 5},
        ]
        retrieval = {
            "chunks": fake_chunks,
            "meta": {
                "top_score": 0.81,
                "min_relevance_score": 0.35,
                "used_chunks": 2,
                "retrieved_chunks": 3,
                "candidate_chunks": 3,
                "rerank_applied": True,
                "weak_evidence": False,
            },
        }

        with client_context() as client, patch(
            "app.api.routes.vector_store.is_empty", return_value=False
        ), patch("app.api.routes.retrieve", return_value=retrieval), patch(
            "app.api.routes.generate_answer", return_value="A grounded answer."
        ) as mock_generate:
            response = client.post("/query", json={"question": "What is the answer?"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "answer": "A grounded answer.",
                "sources": [
                    {"text": "Source 1", "source": "report.pdf", "page": 3},
                    {"text": "Source 2", "source": "report.pdf", "page": 5},
                ],
                "meta": {
                    "top_score": 0.81,
                    "min_relevance_score": 0.35,
                    "used_chunks": 2,
                    "retrieved_chunks": 3,
                    "candidate_chunks": 3,
                    "rerank_applied": True,
                    "weak_evidence": False,
                },
            },
        )
        mock_generate.assert_called_once_with("What is the answer?", fake_chunks)

    def test_query_returns_503_when_llm_service_fails(self):
        retrieval = {
            "chunks": [{"text": "Source 1", "source": "report.pdf", "page": 3}],
            "meta": {
                "top_score": 0.8,
                "min_relevance_score": 0.35,
                "used_chunks": 1,
                "retrieved_chunks": 3,
                "candidate_chunks": 3,
                "rerank_applied": True,
                "weak_evidence": False,
            },
        }

        with client_context() as client, patch(
            "app.api.routes.vector_store.is_empty", return_value=False
        ), patch("app.api.routes.retrieve", return_value=retrieval), patch(
            "app.api.routes.generate_answer", side_effect=RuntimeError("LLM down")
        ):
            response = client.post("/query", json={"question": "What is the answer?"})

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "LLM service unavailable.")

    def test_config_reads_environment_overrides(self):
        original_values = {
            "SIMHAS_APP_TITLE": os.environ.get("SIMHAS_APP_TITLE"),
            "SIMHAS_DATA_DIR": os.environ.get("SIMHAS_DATA_DIR"),
            "SIMHAS_EMBEDDING_MODEL": os.environ.get("SIMHAS_EMBEDDING_MODEL"),
            "SIMHAS_OLLAMA_URL": os.environ.get("SIMHAS_OLLAMA_URL"),
            "SIMHAS_OLLAMA_MODEL": os.environ.get("SIMHAS_OLLAMA_MODEL"),
            "SIMHAS_TOP_K": os.environ.get("SIMHAS_TOP_K"),
            "SIMHAS_RETRIEVAL_CANDIDATE_K": os.environ.get("SIMHAS_RETRIEVAL_CANDIDATE_K"),
            "SIMHAS_CHUNK_SIZE": os.environ.get("SIMHAS_CHUNK_SIZE"),
            "SIMHAS_CHUNK_OVERLAP": os.environ.get("SIMHAS_CHUNK_OVERLAP"),
            "SIMHAS_MIN_RELEVANCE_SCORE": os.environ.get("SIMHAS_MIN_RELEVANCE_SCORE"),
            "SIMHAS_RERANK_LEXICAL_WEIGHT": os.environ.get("SIMHAS_RERANK_LEXICAL_WEIGHT"),
        }

        try:
            os.environ["SIMHAS_APP_TITLE"] = "Custom Title"
            os.environ["SIMHAS_DATA_DIR"] = "/tmp/simhas-data"
            os.environ["SIMHAS_EMBEDDING_MODEL"] = "test-embedding"
            os.environ["SIMHAS_OLLAMA_URL"] = "http://example.com/generate"
            os.environ["SIMHAS_OLLAMA_MODEL"] = "test-model"
            os.environ["SIMHAS_TOP_K"] = "7"
            os.environ["SIMHAS_RETRIEVAL_CANDIDATE_K"] = "15"
            os.environ["SIMHAS_CHUNK_SIZE"] = "99"
            os.environ["SIMHAS_CHUNK_OVERLAP"] = "11"
            os.environ["SIMHAS_MIN_RELEVANCE_SCORE"] = "0.42"
            os.environ["SIMHAS_RERANK_LEXICAL_WEIGHT"] = "0.25"

            reloaded = importlib.reload(config_module)

            self.assertEqual(reloaded.APP_TITLE, "Custom Title")
            self.assertEqual(reloaded.DATA_DIR, "/tmp/simhas-data")
            self.assertEqual(reloaded.EMBEDDING_MODEL, "test-embedding")
            self.assertEqual(reloaded.OLLAMA_URL, "http://example.com/generate")
            self.assertEqual(reloaded.OLLAMA_MODEL, "test-model")
            self.assertEqual(reloaded.TOP_K, 7)
            self.assertEqual(reloaded.RETRIEVAL_CANDIDATE_K, 15)
            self.assertEqual(reloaded.CHUNK_SIZE, 99)
            self.assertEqual(reloaded.CHUNK_OVERLAP, 11)
            self.assertEqual(reloaded.MIN_RELEVANCE_SCORE, 0.42)
            self.assertEqual(reloaded.RERANK_LEXICAL_WEIGHT, 0.25)
        finally:
            for key, value in original_values.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value

            importlib.reload(config_module)


if __name__ == "__main__":
    unittest.main()