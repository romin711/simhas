const BASE_URL = "http://127.0.0.1:8000";

async function parseResponse(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function toErrorMessage(data, fallback) {
  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail;
  }
  return fallback;
}

export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await parseResponse(res);
  if (!res.ok) throw new Error(toErrorMessage(data, "Upload failed"));
  return data;
}

export async function queryRAG(question) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const data = await parseResponse(res);
  if (!res.ok) throw new Error(toErrorMessage(data, "Query failed"));
  return data;
}