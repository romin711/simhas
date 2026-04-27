export default function SourcePanel({ selectedAnswer }) {
  const hasSources = Array.isArray(selectedAnswer?.sources) && selectedAnswer.sources.length > 0;
  const meta = selectedAnswer?.meta;

  return (
    <section>
      <h2 className="section-title">Verification</h2>
      <p className="section-text">Inspect retrieval context, source snippets, and evidence metadata.</p>

      {!selectedAnswer && (
        <div className="placeholder" style={{ marginTop: 14 }}>
          Select an answer card to inspect its evidence details.
        </div>
      )}

      {selectedAnswer && (
        <>
          <div className="meta-list">
            <div className="meta-line">
              <strong>Retrieval metadata:</strong>{" "}
              {meta ? "Available" : "Feature is not implemented yet"}
            </div>
            {meta && (
              <>
                <div className="meta-line">Top score: {typeof meta.top_score === "number" ? meta.top_score.toFixed(2) : "Feature is not implemented yet"}</div>
                <div className="meta-line">Used chunks: {typeof meta.used_chunks === "number" ? meta.used_chunks : "Feature is not implemented yet"}</div>
                <div className="meta-line">Candidates: {typeof meta.candidate_chunks === "number" ? meta.candidate_chunks : "Feature is not implemented yet"}</div>
                <div className="meta-line">Reranking: {typeof meta.rerank_applied === "boolean" ? (meta.rerank_applied ? "Applied" : "Not applied") : "Feature is not implemented yet"}</div>
              </>
            )}
          </div>

          <div className="placeholder">
            <strong>PDF preview:</strong> Feature is not implemented yet
          </div>

          <div style={{ marginTop: 12 }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Source passages</h3>
            {!hasSources && <div className="placeholder">Feature is not implemented yet</div>}
            {hasSources &&
              selectedAnswer.sources.map((source, index) => (
                <div key={`${source.source}-${source.page}-${index}`} className="source-item">
                  <summary>
                    {source.source || "Feature is not implemented yet"} - p.{typeof source.page === "number" ? source.page : "Feature is not implemented yet"}
                  </summary>
                  <p>{source.text || "Feature is not implemented yet"}</p>
                </div>
              ))}
          </div>
        </>
      )}
    </section>
  );
}
