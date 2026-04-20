from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str


class QueryMeta(BaseModel):
    top_score: float
    min_relevance_score: float
    used_chunks: int
    retrieved_chunks: int
    candidate_chunks: int
    rerank_applied: bool
    weak_evidence: bool


class SourceChunk(BaseModel):
    text: str
    source: str
    page: int


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    meta: QueryMeta


class UploadResponse(BaseModel):
    status: str
    chunks_stored: int