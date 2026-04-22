import { useState } from "react";
import { uploadPDF } from "../api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const data = await uploadPDF(file);
      setStatus(`✓ Uploaded successfully — ${data.chunks_stored} chunks stored`);
      setFile(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.heading}>Upload PDF</h2>
          <p style={styles.helper}>Only text-based PDFs are supported. The file stays local.</p>
        </div>
        <div style={styles.pill}>PDF only</div>
      </div>
      <div style={styles.row}>
        <label style={styles.fileLabel}>
          <span style={styles.fileLabelText}>{file ? file.name : "Choose a PDF file"}</span>
          <span style={styles.fileLabelMeta}>{file ? "Ready to upload" : "Drag, click, or browse"}</span>
          <input
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              setFile(e.target.files[0] || null);
              setStatus(null);
              setError(null);
            }}
          />
        </label>
        <button
          style={{ ...styles.button, opacity: loading || !file ? 0.5 : 1 }}
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {file && (
        <div style={styles.fileChipRow}>
          <span style={styles.fileChip}>Selected: {file.name}</span>
          <button
            type="button"
            style={styles.clearButton}
            onClick={() => setFile(null)}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      )}
      {loading && <div style={styles.loadingHint}>Uploading and indexing document...</div>}
      {status && <div style={styles.success}>{status}</div>}
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    background: "rgba(255,255,255,0.78)",
    borderRadius: 24,
    padding: "24px 28px",
    marginBottom: 20,
    border: "1px solid rgba(30,30,30,0.08)",
    boxShadow: "0 18px 50px rgba(16, 24, 40, 0.08)",
    backdropFilter: "blur(14px)",
  },
  headerRow: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", marginBottom: 16 },
  heading:   { margin: 0, fontSize: 18, fontWeight: 800, color: "#111" },
  helper:    { margin: "6px 0 0", fontSize: 13, color: "#5f6b75", lineHeight: 1.5 },
  pill: {
    flexShrink: 0,
    padding: "7px 12px",
    borderRadius: 999,
    background: "#f6e8d7",
    color: "#7a4f1d",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  row:       { display: "flex", gap: 12, alignItems: "center" },
  fileLabel: {
    flex: 1,
    padding: "14px 16px",
    border: "1px dashed rgba(30,30,30,0.18)",
    borderRadius: 18,
    fontSize: 14,
    color: "#444",
    cursor: "pointer",
    background: "linear-gradient(180deg, rgba(250,250,250,0.95) 0%, rgba(242,244,247,0.9) 100%)",
    overflow: "hidden",
    minHeight: 54,
  },
  fileLabelText: {
    display: "block",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    fontWeight: 600,
    color: "#17212b",
  },
  fileLabelMeta: {
    display: "block",
    marginTop: 4,
    fontSize: 12,
    color: "#65727e",
  },
  button: {
    padding: "12px 22px",
    background: "linear-gradient(135deg, #17212b 0%, #2d3a45 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 10px 20px rgba(23, 33, 43, 0.14)",
  },
  fileChipRow: { display: "flex", gap: 10, alignItems: "center", marginTop: 12 },
  fileChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#eef3f7",
    color: "#34424d",
    fontSize: 12,
    fontWeight: 600,
  },
  clearButton: {
    border: "none",
    background: "transparent",
    color: "#66727d",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  loadingHint: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#eef3f7",
    color: "#45525e",
    fontSize: 13,
    fontWeight: 600,
  },
  success: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#edf8ef",
    color: "#1e6a33",
    fontSize: 13,
    fontWeight: 600,
  },
  error: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#fdecec",
    color: "#a11e1e",
    fontSize: 13,
    fontWeight: 600,
  },
};