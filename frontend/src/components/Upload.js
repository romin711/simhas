import { useState } from "react";
import { uploadPDF } from "../api";

export default function Upload() {
  const [file, setFile]       = useState(null);
  const [status, setStatus]   = useState(null);
  const [error, setError]     = useState(null);
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
      <h2 style={styles.heading}>Upload PDF</h2>
      <div style={styles.row}>
        <label style={styles.fileLabel}>
          {file ? file.name : "Choose a PDF file"}
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
      {status && <p style={styles.success}>{status}</p>}
      {error  && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  container: {
    background: "#fff",
    borderRadius: 8,
    padding: "24px 28px",
    marginBottom: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  heading:   { margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111" },
  row:       { display: "flex", gap: 10, alignItems: "center" },
  fileLabel: {
    flex: 1,
    padding: "9px 14px",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 14,
    color: "#444",
    cursor: "pointer",
    background: "#fafafa",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  button: {
    padding: "9px 20px",
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  success: { margin: "12px 0 0", fontSize: 13, color: "#2a7a2a" },
  error:   { margin: "12px 0 0", fontSize: 13, color: "#b00020" },
};