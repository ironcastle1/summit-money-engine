async function request(path,
options = {
}) {
  const response = await fetch(path,
  {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {
      })
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok)
  throw new Error(body?.error?.message || `Request failed ${response.status}`);
  return body;
}
export function createConflictApi() {
  return Object.freeze({
    catalog: () => request('/api/conflict/catalog'),
    snapshot: input => request('/api/conflict/snapshot',
    {
      method: 'POST',
      body: JSON.stringify(input || {
      })
    }),
    theatre: id => request(`/api/conflict/theatre/${encodeURIComponent(id)}`),
    compare: input => request('/api/conflict/compare',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }),
    scenario: input => request('/api/conflict/scenario',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }),
    alerts: input => request('/api/conflict/alerts',
    {
      method: 'POST',
      body: JSON.stringify(input || {
      })
    }),
    watch: input => request('/api/conflict/watchlist',
    {
      method: 'POST',
      body: JSON.stringify(input)
    })
  });
}
