const NOT_IMPLEMENTED_TEXT = "Feature is not implemented yet";

export default function Message({ message, onSelect, isActive }) {
  const isUser = message.role === "user";
  const hasSources = Array.isArray(message.sources) && message.sources.length > 0;
  const confidence = message.meta?.top_score;

  const confidenceLabel =
    typeof confidence !== "number"
      ? NOT_IMPLEMENTED_TEXT
      : confidence >= 0.75
        ? `High (${confidence.toFixed(2)})`
        : confidence >= 0.5
          ? `Medium (${confidence.toFixed(2)})`
          : `Low (${confidence.toFixed(2)})`;

  return (
    <article
      className={`entry ${isUser ? "entry-question" : "entry-answer"} ${!isUser ? "selectable" : ""} ${isActive ? "active" : ""}`}
      onClick={() => onSelect?.(message)}
    >
      <header className="entry-head">
        <p className="entry-role">{isUser ? "Question" : "Answer"}</p>
        {!isUser && <span className="meta-chip">Click to inspect</span>}
      </header>

      <div className="entry-body">
        <p className="entry-text">{message.content || NOT_IMPLEMENTED_TEXT}</p>

        {!isUser && (
          <div className="meta-row">
            <span className="meta-chip">Confidence: {confidenceLabel}</span>
            <span className="meta-chip">
              Retrieved: {typeof message.meta?.retrieved_chunks === "number" ? message.meta.retrieved_chunks : NOT_IMPLEMENTED_TEXT}
            </span>
            <span className="meta-chip">
              Reranked: {typeof message.meta?.rerank_applied === "boolean" ? (message.meta.rerank_applied ? "Yes" : "No") : NOT_IMPLEMENTED_TEXT}
            </span>
          </div>
        )}

        {!isUser && (
          <div className="chip-row">
            {hasSources &&
              message.sources.map((source, index) => (
                <span key={`${source.source}-${source.page}-${index}`} className="source-chip">
                  {source.source || NOT_IMPLEMENTED_TEXT} - p.{typeof source.page === "number" ? source.page : NOT_IMPLEMENTED_TEXT}
                </span>
              ))}
            {!hasSources && <span className="source-chip">{NOT_IMPLEMENTED_TEXT}</span>}
          </div>
        )}

        {!isUser && (
          <div className="source-details">
            {hasSources && (
              <>
                {message.sources.map((source, index) => (
                  <details key={`${source.source}-${source.page}-${index}`} className="source-item">
                    <summary>
                      Passage {index + 1} from {source.source || NOT_IMPLEMENTED_TEXT}
                    </summary>
                    <p>{source.text || NOT_IMPLEMENTED_TEXT}</p>
                  </details>
                ))}
              </>
            )}

            {!hasSources && <div className="placeholder">{NOT_IMPLEMENTED_TEXT}</div>}
          </div>
        )}
      </div>
    </article>
  );
}