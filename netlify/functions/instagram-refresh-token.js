const { getCurrentToken, setCurrentToken } = require('./_lib/token');

const GRAPH_API_VERSION = 'v21.0';

exports.handler = async () => {
  const currentToken = await getCurrentToken();
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', currentToken);

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error || !data.access_token) {
    const message = data.error ? data.error.message : `Token refresh failed (${response.status})`;
    console.error('Instagram token refresh failed:', message);
    return { statusCode: 500, body: message };
  }

  await setCurrentToken(data.access_token);
  console.log('Instagram access token refreshed successfully.');

  return { statusCode: 200, body: 'Token refreshed' };
};
