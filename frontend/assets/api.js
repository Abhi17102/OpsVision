function getApiBase() {
  // When opened directly via file://, use local backend by default.
  if (window.location.protocol === "file:") return "http://127.0.0.1:8000";
  return "";
}

function withBase(path) {
  return `${getApiBase()}${path}`;
}

async function apiGet(path) {
  const url = withBase(path);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return await res.json();
}

async function apiPost(path, body) {
  const url = withBase(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return await res.json();
}

window.OpsVisionApi = {
  listMetrics: (limit) => apiGet(`/api/metrics?limit=${encodeURIComponent(limit)}`),
  collect: () => apiPost("/api/metrics/collect"),
  latest: () => apiGet("/api/metrics/latest"),
};

