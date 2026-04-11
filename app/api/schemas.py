from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str


class SourceChunk(BaseModel):
    text: str
    source: str
    page: int


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class UploadResponse(BaseModel):
    status: str
    chunks_stored: int