const crypto = require('crypto');
const { isAuthorized } = require('./_lib/auth');
const { addItem } = require('./_lib/queue');

exports.handler = async (event) => {
  if (!isAuthorized(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authorized' }) };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { url, resourceType, caption } = payload;

  if (!url || !/^https:\/\//.test(url)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'A valid https media URL is required' }) };
  }
  if (resourceType !== 'image' && resourceType !== 'video') {
    return { statusCode: 400, body: JSON.stringify({ error: 'resourceType must be "image" or "video"' }) };
  }

  const item = {
    id: crypto.randomUUID(),
    url,
    resourceType,
    caption: typeof caption === 'string' ? caption.slice(0, 2200) : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    postedAt: null,
    igMediaId: null,
    error: null,
  };

  try {
    await addItem(item);
  } catch (err) {
    console.error('queue-add failed:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not save this item to the queue right now.' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, item }),
  };
};
