export const PUSH_API_URL =
  import.meta.env.VITE_PUSH_API_URL || 'http://localhost:8787';

async function request(path, options = {}) {
  const response = await fetch(`${PUSH_API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export function refreshTelegram() {
  return request('/api/telegram/refresh', {
    method: 'POST'
  });
}

export function pushLark(item) {
  return request('/api/lark/push', {
    method: 'POST',
    body: JSON.stringify({ item })
  });
}

export function previewLark(item) {
  return request('/api/lark/preview', {
    method: 'POST',
    body: JSON.stringify({ item })
  });
}