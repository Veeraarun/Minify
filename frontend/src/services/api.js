const API_BASE = import.meta.env.VITE_API_URL || '';

export const getApiUrl = (endpoint) => {
  if (endpoint.startsWith('http')) return endpoint;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};

export async function checkHealth() {
  const res = await fetch(getApiUrl('/api/health'));
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function checkReady() {
  const res = await fetch(getApiUrl('/api/ready'));
  if (!res.ok) throw new Error('Backend readiness check failed');
  return res.json();
}

export async function analyzeFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(getApiUrl('/api/analyze'), {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload and analysis failed' }));
    throw new Error(errorData.detail || 'Upload failed');
  }

  return res.json();
}

export async function compressFile(options) {
  const res = await fetch(getApiUrl('/api/compress'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Compression failed' }));
    throw new Error(errorData.detail || 'Compression failed');
  }

  return res.json();
}

export async function batchCompress(fileIds, options = {}) {
  const res = await fetch(getApiUrl('/api/batch-compress'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_ids: fileIds,
      quality_preset: options.quality_preset || 'balanced',
      target_size_mb: options.target_size_mb || null,
      output_format: options.output_format || null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Batch compression failed' }));
    throw new Error(errorData.detail || 'Batch compression failed');
  }

  return res.json();
}

export async function askAssistant(question, context = null) {
  const res = await fetch(getApiUrl('/api/ai-assistant'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });

  if (!res.ok) {
    throw new Error('AI Assistant request failed');
  }

  return res.json();
}
