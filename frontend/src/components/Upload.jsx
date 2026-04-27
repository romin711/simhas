import { useState } from "react";
import { uploadPDF } from "../api";

const NOT_IMPLEMENTED_TEXT = "Feature is not implemented yet";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState(null);
  const [noticeType, setNoticeType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  const showNotice = (type, text) => {
    setNoticeType(type);
    setNotice(text);
  };

  const renderStatusClass = (status) => {
    if (status === "ready") return "doc-status doc-status-ready";
    if (status === "failed") return "doc-status doc-status-failed";
    return "doc-status";
  };

  const handleUpload = async () => {
    if (!file) return;

    const uploadId = `${file.name}-${Date.now()}`;

    setLoading(true);
    showNotice("info", null);
    setDocuments((prev) => [
      {
        id: uploadId,
        name: file.name,
        status: "processing",
        detail: "Indexing document",
      },
      ...prev,
    ]);

    try {
      const data = await uploadPDF(file);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === uploadId
            ? {
                ...doc,
                status: "ready",
                detail:
                  typeof data.chunks_stored === "number"
                    ? `${data.chunks_stored} chunks stored`
                    : NOT_IMPLEMENTED_TEXT,
              }
            : doc,
        ),
      );
      showNotice("success", "Document uploaded and indexed successfully.");
      setFile(null);
    } catch {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === uploadId
            ? {
                ...doc,
                status: "failed",
                detail: "Upload could not be completed",
              }
            : doc,
        ),
      );
      showNotice("error", "We could not process this file right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnavailableFeature = () => {
    showNotice("info", NOT_IMPLEMENTED_TEXT);
  };

  return (
    <section>
      <h2 className="section-title">Documents</h2>
      <p className="section-text">Upload and organize source PDFs for retrieval.</p>

      <div className="upload-dropzone">
        <label className="upload-file">
          <span className="upload-file-name">{file ? file.name : "Choose a PDF file"}</span>
          <span className="section-text" style={{ marginTop: 0 }}>
            {file ? "Ready to upload" : "Drop, click, or browse"}
          </span>
          <input
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              setFile(e.target.files[0] || null);
              showNotice("info", null);
            }}
          />
        </label>

        <div className="upload-actions">
          <button className="btn btn-primary" onClick={handleUpload} disabled={loading || !file}>
            {loading ? "Processing..." : "Upload"}
          </button>
          <button className="btn btn-muted" onClick={() => setFile(null)} disabled={loading || !file}>
            Clear
          </button>
        </div>
      </div>

      {notice && (
        <div className={`notice ${noticeType === "error" ? "notice-error" : noticeType === "success" ? "notice-success" : "notice-info"}`}>
          {notice}
        </div>
      )}

      <div className="doc-stack" aria-live="polite">
        {documents.length === 0 && <div className="placeholder">No uploaded documents in this session.</div>}

        {documents.map((doc) => (
          <article key={doc.id} className="doc-card">
            <div className="doc-head">
              <h3 className="doc-name">{doc.name}</h3>
              <span className={renderStatusClass(doc.status)}>{doc.status}</span>
            </div>
            <div className="doc-meta">{doc.detail}</div>
            <div className="doc-actions">
              <button type="button" className="btn btn-muted" onClick={handleUnavailableFeature}>
                Delete
              </button>
              <button type="button" className="btn btn-muted" onClick={handleUnavailableFeature}>
                Reprocess
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}