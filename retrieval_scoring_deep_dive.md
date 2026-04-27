# Retrieval Scoring Deep Dive (Simhas)

Professional technical documentation for the retrieval layer that produces:
- Top score
- Used chunks
- Candidates
- Reranking status

---

## 1. Purpose

This document explains how the retrieval pipeline works internally in Simhas, how each metadata number is produced, and how to improve retrieval quality (especially top score) without changing API contracts.

Scope includes:
- PDF text extraction and cleaning
- Chunk generation
- Embedding + vector search
- Hybrid reranking
- Thresholding and duplicate suppression
- Returned metadata semantics

---

## 2. Relevant Backend Components

| Layer | File | Responsibility |
|---|---|---|
| API | app/api/routes.py | Orchestrates upload/query flow and returns retrieval metadata |
| PDF preprocessing | app/services/pdf_service.py | Extracts sorted page text and cleans OCR/layout artifacts |
| Chunking | app/utils/chunking.py | Builds overlapping chunks with source/page attribution |
| Embeddings | app/services/embedding_service.py | Encodes chunks/query in shared vector space |
| Vector search | app/db/vector_store.py | FAISS search + similarity score conversion |
| Retrieval logic | app/services/retrieval_service.py | Hybrid rerank, thresholding, diversity filtering |
| Configuration | app/core/config.py | Runtime tuning knobs |

---

## 3. End-to-End Query Flow

1. Client sends question to POST /query.
2. Query is normalized (whitespace collapse).
3. Query embedding is generated with sentence-transformers.
4. FAISS returns top-N candidates (N = RETRIEVAL_CANDIDATE_K).
5. Each candidate gets:
   - Semantic similarity score (from FAISS distance)
   - Lexical overlap score (token overlap with query)
6. Hybrid rerank score is computed.
7. Candidates are filtered by quality gates:
   - rerank_score >= MIN_RELEVANCE_SCORE
   - semantic score >= semantic floor
8. Near-duplicate passages from the same source/page are removed.
9. Final top-K chunks are returned to API and used for generation.
10. Metadata fields are returned to frontend.

---

## 4. How Each Number Is Computed

### 4.1 Top score

Definition:
- The highest semantic similarity score among raw FAISS candidates before thresholding.

Source logic:
- retrieval_service.retrieve() calculates top_score = max(c["score"] for c in scored_chunks).

Interpretation:
- Higher is better semantic match.
- Rough guidance:
  - >= 0.70: strong match
  - 0.45 to 0.69: moderate match
  - < 0.45: weak match or poor chunk/query alignment

### 4.2 Candidates

Definition:
- Number of retrieved FAISS candidates considered before reranking.

Source logic:
- candidate_k = max(TOP_K, RETRIEVAL_CANDIDATE_K)
- candidate_chunks = len(scored_chunks)

Interpretation:
- Higher candidate pool can improve recall but increases reranking noise and latency.

### 4.3 Used chunks

Definition:
- Number of chunks that survive all filters and are passed to answer generation.

Source logic:
- used_chunks = len(chunks)

Interpretation:
- 0 means weak evidence path.
- Typical healthy value is 1 to TOP_K depending on threshold strictness.

### 4.4 Reranking

Definition:
- Whether hybrid reranking is applied.

Source logic:
- Current retrieval always computes hybrid rerank and returns rerank_applied = true when candidates exist.

---

## 5. Scoring Mathematics

### 5.1 Semantic similarity from FAISS

Vector store uses normalized vectors with IndexFlatL2.

For normalized vectors, squared L2 distance and cosine similarity are related.
Similarity conversion used by code:

$$
\text{similarity} = 1 - \frac{\text{distance}}{2}
$$

Clamped to [0, 1].

### 5.2 Lexical overlap

Tokenization rules:
- Lowercase
- Regex word extraction
- Length > 2
- Stopword removal

F1-style lexical score:

$$
\text{recall} = \frac{|Q \cap C|}{|Q|}, \quad
\text{precision} = \frac{|Q \cap C|}{|C|}
$$

$$
\text{lexical\_score} = \frac{2 \cdot \text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}}
$$

Where:
- Q = query term set
- C = chunk term set

### 5.3 Hybrid rerank score

$$
\text{final} = (1 - w) \cdot \text{semantic} + w \cdot \text{lexical}
$$

Where:
- w = RERANK_LEXICAL_WEIGHT

### 5.4 Quality gates

Candidate is kept only if:

$$
\text{rerank\_score} \ge \text{MIN\_RELEVANCE\_SCORE}
$$

and

$$
\text{semantic\_score} \ge 0.7 \cdot \text{MIN\_RELEVANCE\_SCORE}
$$

This avoids selecting lexically matched but semantically irrelevant chunks.

---

## 6. Ingestion Quality Effects on Top Score

Top score depends heavily on ingestion quality, not only query-time logic.

### 6.1 PDF cleaning improvements currently applied

During extraction:
- Soft hyphen removal
- Hyphenated line break joining
- Single-line wrap collapse
- Multi-space cleanup
- Sorted text extraction for better reading order

Impact:
- Cleaner chunk text yields more semantically coherent embeddings.
- Better embeddings usually increase nearest-neighbor relevance and top score consistency.

### 6.2 Chunk granularity defaults

Current defaults:
- CHUNK_SIZE = 120
- CHUNK_OVERLAP = 40

Reasoning:
- Smaller chunks improve query specificity.
- Moderate overlap preserves context continuity.

---

## 7. Duplicate Suppression Logic

After filtering, retrieval suppresses near-duplicate chunks from the same source and page.

Current criterion:
- Token overlap ratio >= 0.85 against already selected chunk
- Applies only when source and page match

Benefit:
- Improves diversity of evidence.
- Reduces repetitive passages sent to LLM.

---

## 8. Metadata Lifecycle Example

Assume:
- RETRIEVAL_CANDIDATE_K = 16
- TOP_K = 3
- 16 candidates returned
- 6 pass threshold gates
- 2 removed as near-duplicates
- 3 selected for final context
- Highest raw semantic score = 0.63

Then metadata is:
- top_score: 0.63
- candidate_chunks: 16
- retrieved_chunks: 6
- used_chunks: 3
- rerank_applied: true
- weak_evidence: false

---

## 9. Why Top Score Can Be Low

Common causes:
1. OCR/noisy PDF text (tables, headers, line wraps).
2. Query vocabulary mismatch with document wording.
3. Chunk boundaries splitting key facts.
4. Embedding model limits for domain-specific terminology.
5. Document genuinely lacks direct evidence for the question.

---

## 10. Professional Tuning Playbook

### 10.1 Safe first steps

1. Re-index after changing chunking or extraction logic.
2. Increase RETRIEVAL_CANDIDATE_K gradually (for example 16 to 24).
3. Tune MIN_RELEVANCE_SCORE by evaluation set, not anecdotes.
4. Adjust RERANK_LEXICAL_WEIGHT in small steps (for example +/-0.05).

### 10.2 Suggested tuning ranges

| Variable | Typical Range | Effect |
|---|---|---|
| RETRIEVAL_CANDIDATE_K | 12 to 32 | Higher recall, higher latency |
| CHUNK_SIZE | 90 to 180 | Smaller = sharper matching, larger = broader context |
| CHUNK_OVERLAP | 20 to 60 | Higher continuity, more redundancy |
| MIN_RELEVANCE_SCORE | 0.15 to 0.45 | Higher precision, lower recall |
| RERANK_LEXICAL_WEIGHT | 0.10 to 0.35 | Higher keyword sensitivity |

### 10.3 Advanced options (future)

- Multi-query expansion at retrieval time
- Metadata-aware rerank (section title, heading proximity)
- Cross-encoder reranking for better precision
- Document-level routing before chunk retrieval

---

## 11. Operational Checklist for Better Scores

1. Confirm documents are text-based, not image-only scans.
2. Rebuild index after changing extraction/chunk parameters.
3. Use evaluation harness to compare avg_top_score and source_match_rate.
4. Track weak_evidence_rate over representative query sets.
5. Tune one variable at a time and record deltas.

---

## 12. API Compatibility Statement

All improvements described here preserve existing backend endpoints and response schema:
- POST /upload
- POST /query

No contract-breaking changes are required to improve retrieval quality.

---

## 13. Quick Glossary

- Top score: best semantic candidate score before filtering.
- Candidate: chunk returned from FAISS before rerank filtering.
- Retrieved chunk: candidate passing threshold gates.
- Used chunk: final chunk selected for LLM context.
- Weak evidence: no chunk selected for generation.

---

## 14. One-Line Summary

Simhas top-score quality is driven by three coupled stages: clean extraction, coherent chunking, and hybrid retrieval filtering; improving any one stage without re-indexing only gives partial gains.
