from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from app.services.retrieval_service import retrieve


@dataclass(frozen=True)
class EvalCase:
    question: str
    expected_source: str | None = None
    expected_page: int | None = None

    @classmethod
    def from_dict(cls, data: dict) -> "EvalCase":
        return cls(
            question=data["question"],
            expected_source=data.get("expected_source"),
            expected_page=data.get("expected_page"),
        )


def load_eval_cases(path: str | Path) -> list[EvalCase]:
    raw_path = Path(path)
    with raw_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    return [EvalCase.from_dict(item) for item in payload]


def _matches_expected_source(chunk: dict, expected_source: str | None, expected_page: int | None) -> bool:
    if expected_source is None:
        return False

    source_match = chunk.get("source", "").lower() == expected_source.lower()
    page_match = expected_page is None or chunk.get("page") == expected_page
    return source_match and page_match


def evaluate_case(case: EvalCase) -> dict:
    retrieval = retrieve(case.question)
    chunks = retrieval["chunks"]
    meta = retrieval["meta"]

    matched = any(_matches_expected_source(chunk, case.expected_source, case.expected_page) for chunk in chunks)

    return {
        "question": case.question,
        "expected_source": case.expected_source,
        "expected_page": case.expected_page,
        "top_score": meta["top_score"],
        "used_chunks": meta["used_chunks"],
        "retrieved_chunks": meta["retrieved_chunks"],
        "candidate_chunks": meta["candidate_chunks"],
        "weak_evidence": meta["weak_evidence"],
        "source_match": matched,
    }


def run_evaluation(cases: list[EvalCase]) -> dict:
    results = [evaluate_case(case) for case in cases]
    case_count = len(results)

    return {
        "case_count": case_count,
        "source_match_rate": (sum(1 for item in results if item["source_match"]) / case_count) if case_count else 0.0,
        "weak_evidence_rate": (sum(1 for item in results if item["weak_evidence"]) / case_count) if case_count else 0.0,
        "avg_top_score": (sum(item["top_score"] for item in results) / case_count) if case_count else 0.0,
        "avg_used_chunks": (sum(item["used_chunks"] for item in results) / case_count) if case_count else 0.0,
        "avg_retrieved_chunks": (sum(item["retrieved_chunks"] for item in results) / case_count) if case_count else 0.0,
        "avg_candidate_chunks": (sum(item["candidate_chunks"] for item in results) / case_count) if case_count else 0.0,
        "cases": results,
    }


def main(argv: list[str] | None = None) -> int:
    arguments = argv or []
    if not arguments:
        raise SystemExit("Usage: python -m app.services.evaluation_service <cases.json>")

    summary = run_evaluation(load_eval_cases(arguments[0]))
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    import sys

    raise SystemExit(main(sys.argv[1:]))