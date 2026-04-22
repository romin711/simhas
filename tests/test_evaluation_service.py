import unittest
from unittest.mock import patch

from app.services.evaluation_service import EvalCase, load_eval_cases, run_evaluation


class EvaluationServiceTestCase(unittest.TestCase):
    def test_load_eval_cases(self):
        cases = load_eval_cases("tests/fixtures/eval_cases.json")

        self.assertEqual(len(cases), 3)
        self.assertIsInstance(cases[0], EvalCase)
        self.assertEqual(cases[0].expected_source, "README.md")

    def test_run_evaluation_aggregates_metrics(self):
        cases = [
            EvalCase(question="q1", expected_source="a.pdf", expected_page=2),
            EvalCase(question="q2", expected_source="b.pdf"),
        ]

        results = [
            {
                "chunks": [{"text": "A", "source": "a.pdf", "page": 2}],
                "meta": {
                    "top_score": 0.8,
                    "min_relevance_score": 0.2,
                    "used_chunks": 1,
                    "retrieved_chunks": 1,
                    "candidate_chunks": 3,
                    "rerank_applied": True,
                    "weak_evidence": False,
                },
            },
            {
                "chunks": [],
                "meta": {
                    "top_score": 0.1,
                    "min_relevance_score": 0.2,
                    "used_chunks": 0,
                    "retrieved_chunks": 0,
                    "candidate_chunks": 3,
                    "rerank_applied": False,
                    "weak_evidence": True,
                },
            },
        ]

        with patch("app.services.evaluation_service.retrieve", side_effect=results):
            summary = run_evaluation(cases)

        self.assertEqual(summary["case_count"], 2)
        self.assertEqual(summary["source_match_rate"], 0.5)
        self.assertEqual(summary["weak_evidence_rate"], 0.5)
        self.assertAlmostEqual(summary["avg_top_score"], 0.45)
        self.assertEqual(summary["cases"][0]["source_match"], True)
        self.assertEqual(summary["cases"][1]["source_match"], False)


if __name__ == "__main__":
    unittest.main()