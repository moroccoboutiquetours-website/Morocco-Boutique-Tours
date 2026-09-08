const SITE_HOST = 'www.moroccoboutiquetours.com';
const SITE_ORIGIN = `https://${SITE_HOST}`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

function keyLocation() {
  const key = process.env.INDEXNOW_KEY;
  return key ? `${SITE_ORIGIN}/${key}.txt` : null;
}

// Submits a batch of absolute URLs to IndexNow. Silently drops anything not
// under our own origin and de-dupes. Never throws — callers (an HTTP
// function, a scheduled script) should be able to treat a failed submission
// as "log it and move on" rather than a fatal error.
async function submitToIndexNow(urls) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return { ok: false, skipped: true, reason: 'INDEXNOW_KEY is not set' };
  }

  const urlList = [...new Set((urls || []).filter((u) => typeof u === 'string' && u.startsWith(SITE_ORIGIN)))];

  if (urlList.length === 0) {
    return { ok: false, skipped: true, reason: 'No valid URLs under the site origin were provided' };
  }

  const body = JSON.stringify({
    host: SITE_HOST,
    key,
    keyLocation: keyLocation(),
    urlList,
  });

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body,
    });
    const ok = res.status >= 200 && res.status < 300;
    return { ok, status: res.status, submitted: urlList.length, urlList };
  } catch (err) {
    return { ok: false, error: err.message || String(err), submitted: 0, urlList };
  }
}

module.exports = { submitToIndexNow, SITE_ORIGIN, SITE_HOST, keyLocation };
