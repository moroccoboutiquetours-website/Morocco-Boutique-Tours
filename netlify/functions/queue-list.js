const { isAuthorized } = require('./_lib/auth');
const { readManifest } = require('./_lib/queue');

exports.handler = async (event) => {
  if (!isAuthorized(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  try {
    const manifest = await readManifest();
    const items = [...manifest.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    };
  } catch (err) {
    console.error('queue-list failed:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not load the queue right now.' }),
    };
  }
};
