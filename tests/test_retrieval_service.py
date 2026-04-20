import unittest
from unittest.mock import patch

import numpy as np

from app.services import retrieval_service


class RetrievalServiceTestCase(unittest.TestCase):
    def test_retrieve_filters_low_score_chunks(self):
        scored_chunks = [
            {"text": "Strong chunk", "source": "a.pdf", "page": 2, "score": 0.88},
            {"text": "Weak chunk", "source": "a.pdf", "page": 3, "score": 0.2},
        ]

        with patch("app.services.retrieval_service.embed_query", return_value=np.array([0.1, 0.2], dtype="float32")), patch(
            "app.services.retrieval_service.vector_store.search_with_scores", return_value=scored_chunks
        ) as mock_search, patch("app.services.retrieval_service.MIN_RELEVANCE_SCORE", 0.35), patch(
            "app.services.retrieval_service.TOP_K", 2
        ), patch("app.services.retrieval_service.RETRIEVAL_CANDIDATE_K", 6):
            result = retrieval_service.retrieve("What happened?")

        mock_search.assert_called_once()
        self.assertEqual(mock_search.call_args.kwargs["k"], 6)
        self.assertEqual(len(result["chunks"]), 1)
        self.assertEqual(result["chunks"][0]["text"], "Strong chunk")
        self.assertEqual(result["meta"]["top_score"], 0.88)
        self.assertFalse(result["meta"]["weak_evidence"])
        self.assertTrue(result["meta"]["rerank_applied"])
        self.assertEqual(result["meta"]["candidate_chunks"], 2)

    def test_retrieve_marks_weak_evidence_when_below_threshold(self):
        scored_chunks = [
            {"text": "Weak chunk", "source": "a.pdf", "page": 3, "score": 0.2},
            {"text": "Also weak", "source": "a.pdf", "page": 5, "score": 0.3},
        ]

        with patch("app.services.retrieval_service.embed_query", return_value=np.array([0.1, 0.2], dtype="float32")), patch(
            "app.services.retrieval_service.vector_store.search_with_scores", return_value=scored_chunks
        ), patch("app.services.retrieval_service.MIN_RELEVANCE_SCORE", 0.35):
            result = retrieval_service.retrieve("Any result?")

        self.assertEqual(result["chunks"], [])
        self.assertEqual(result["meta"]["top_score"], 0.3)
        self.assertTrue(result["meta"]["weak_evidence"])

    def test_retrieve_reranks_by_lexical_overlap(self):
        scored_chunks = [
            {"text": "General summary paragraph", "source": "a.pdf", "page": 1, "score": 0.92},
            {"text": "Policy reimbursement deadline is thirty days", "source": "a.pdf", "page": 2, "score": 0.76},
        ]

        with patch("app.services.retrieval_service.embed_query", return_value=np.array([0.1, 0.2], dtype="float32")), patch(
            "app.services.retrieval_service.vector_store.search_with_scores", return_value=scored_chunks
        ), patch("app.services.retrieval_service.MIN_RELEVANCE_SCORE", 0.35), patch(
            "app.services.retrieval_service.RERANK_LEXICAL_WEIGHT", 0.7
        ), patch("app.services.retrieval_service.TOP_K", 1), patch(
            "app.services.retrieval_service.RETRIEVAL_CANDIDATE_K", 2
        ):
            result = retrieval_service.retrieve("What is the reimbursement deadline?")

        self.assertEqual(len(result["chunks"]), 1)
        self.assertEqual(result["chunks"][0]["page"], 2)


if __name__ == "__main__":
    unittest.main()