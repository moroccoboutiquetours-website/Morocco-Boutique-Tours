const crypto = require('crypto');
const { submitToIndexNow } = require('./_lib/indexnow');

// This site has no CMS to fire a "content published" webhook, so this
// endpoint is meant to be called manually (or from a future deploy hook)
// with a shared secret — not on every page request. Never wired into a
// page load path.
function isAuthorized(event) {
  const secret = process.env.INDEXNOW_SUBMIT_SECRET;
  if (!secret) return false;
  const provided = event.headers['x-indexnow-secret'] || event.headers['X-Indexnow-Secret'] || '';
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  if (!isAuthorized(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const urls = Array.isArray(payload.urls) ? payload.urls : payload.url ? [payload.url] : [];
  if (urls.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Provide "url" or "urls" (absolute, under the site origin)' }) };
  }

  const result = await submitToIndexNow(urls);

  return {
    statusCode: result.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
};
