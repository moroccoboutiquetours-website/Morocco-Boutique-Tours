const crypto = require('crypto');
const { makeSessionCookie } = require('./_lib/auth');

function safeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: 'Invalid request body' };
  }

  const password = payload.password || '';
  const expected = process.env.UPLOAD_PAGE_PASSWORD || '';

  if (!expected || !safeCompare(password, expected)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect password' }) };
  }

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': makeSessionCookie(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ok: true }),
  };
};
