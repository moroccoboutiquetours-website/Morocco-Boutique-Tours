const { getStore } = require('@netlify/blobs');

const TOKEN_KEY = 'access-token.json';

function store() {
  return getStore({
    name: 'instagram-auth',
    siteID: process.env.NETLIFY_SITE_ID || '694b6ff7-3f78-485a-895e-a35ff2698dcd',
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

async function getCurrentToken() {
  const record = await store().get(TOKEN_KEY, { type: 'json' });
  if (record && record.token) return record.token;
  return process.env.IG_ACCESS_TOKEN;
}

async function setCurrentToken(token) {
  await store().setJSON(TOKEN_KEY, { token, updatedAt: new Date().toISOString() });
}

module.exports = { getCurrentToken, setCurrentToken };
