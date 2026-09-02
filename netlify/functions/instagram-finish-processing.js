const { readManifest, writeManifest } = require('./_lib/queue');
const { getCurrentToken } = require('./_lib/token');

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const PROCESSING_TIMEOUT_MS = 30 * 60 * 1000;

async function graphRequest(path, params, method = 'GET') {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  if (method === 'GET') {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  const response = await fetch(url, {
    method,
    ...(method === 'POST' ? { body: new URLSearchParams(params) } : {}),
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    const message = data.error ? data.error.message : `Graph API request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

async function publishContainer({ igUserId, accessToken, containerId }) {
  const data = await graphRequest(
    `/${igUserId}/media_publish`,
    { access_token: accessToken, creation_id: containerId },
    'POST'
  );
  return data.id;
}

// Runs every few minutes to finish any video (Reels) posts left in 'processing' by
// instagram-post-daily.js — Instagram needs time to transcode video before it can be
// published, and that can outlast a single function invocation's time limit.
exports.handler = async () => {
  const manifest = await readManifest();
  const processingItems = manifest.items.filter((entry) => entry.status === 'processing');

  if (!processingItems.length) {
    return { statusCode: 200, body: 'Nothing processing' };
  }

  const igUserId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const accessToken = await getCurrentToken();

  for (const item of processingItems) {
    try {
      const data = await graphRequest(`/${item.containerId}`, {
        access_token: accessToken,
        fields: 'status_code',
      });

      if (data.status_code === 'FINISHED') {
        const mediaId = await publishContainer({ igUserId, accessToken, containerId: item.containerId });
        item.status = 'posted';
        item.postedAt = new Date().toISOString();
        item.igMediaId = mediaId;
        item.error = null;
      } else if (data.status_code === 'ERROR') {
        item.status = 'failed';
        item.error = 'Instagram failed to process the video container';
      } else if (Date.now() - new Date(item.processingStartedAt).getTime() > PROCESSING_TIMEOUT_MS) {
        item.status = 'failed';
        item.error = 'Timed out waiting for Instagram to finish processing the video';
      }
    } catch (err) {
      item.status = 'failed';
      item.error = err.message;
      console.error(`Failed to finish processing queue item ${item.id}:`, err.message);
    }
  }

  await writeManifest(manifest);

  return { statusCode: 200, body: `Checked ${processingItems.length} item(s)` };
};
