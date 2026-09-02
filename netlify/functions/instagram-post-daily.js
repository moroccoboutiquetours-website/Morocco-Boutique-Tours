const { readManifest, writeManifest } = require('./_lib/queue');
const { getCurrentToken } = require('./_lib/token');

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

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

async function createContainer({ igUserId, accessToken, item }) {
  const params = {
    access_token: accessToken,
    caption: item.caption || '',
  };
  if (item.resourceType === 'video') {
    params.media_type = 'REELS';
    params.video_url = item.url;
  } else {
    params.image_url = item.url;
  }
  const data = await graphRequest(`/${igUserId}/media`, params, 'POST');
  return data.id;
}

async function publishContainer({ igUserId, accessToken, containerId }) {
  const data = await graphRequest(
    `/${igUserId}/media_publish`,
    { access_token: accessToken, creation_id: containerId },
    'POST'
  );
  return data.id;
}

// Kicks off the daily post: creates the Graph API media container for the oldest
// pending item. Photos publish immediately here. Videos (Reels) need Instagram-side
// processing time, so this only creates the container and leaves the item in
// 'processing' status — instagram-finish-processing.js (run every few minutes)
// publishes it once Instagram reports the container is ready. Splitting the flow
// this way keeps both functions within a regular (non-Background) function's
// execution time limit, since Background Functions require a paid Netlify plan.
exports.handler = async () => {
  const manifest = await readManifest();
  const item = manifest.items.find((entry) => entry.status === 'pending');

  if (!item) {
    console.log('Instagram queue is empty, nothing to post today.');
    return { statusCode: 200, body: 'Queue empty' };
  }

  const igUserId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const accessToken = await getCurrentToken();

  try {
    const containerId = await createContainer({ igUserId, accessToken, item });

    if (item.resourceType === 'video') {
      item.status = 'processing';
      item.containerId = containerId;
      item.processingStartedAt = new Date().toISOString();
    } else {
      const mediaId = await publishContainer({ igUserId, accessToken, containerId });
      item.status = 'posted';
      item.postedAt = new Date().toISOString();
      item.igMediaId = mediaId;
    }
    item.error = null;
  } catch (err) {
    item.status = 'failed';
    item.error = err.message;
    console.error(`Failed to post queue item ${item.id}:`, err.message);
  }

  await writeManifest(manifest);

  return { statusCode: 200, body: item.status };
};
