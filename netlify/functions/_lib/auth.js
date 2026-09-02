const crypto = require('crypto');

const COOKIE_NAME = 'mbt_ig_session';

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function makeSessionCookie() {
  const secret = process.env.COOKIE_SIGNING_SECRET;
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt, secret);
  const value = `${issuedAt}.${signature}`;
  const secureFlag = process.env.NETLIFY_DEV ? '' : ' Secure;';
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly;${secureFlag} SameSite=Strict; Max-Age=2592000`;
}

function isAuthorized(event) {
  const secret = process.env.COOKIE_SIGNING_SECRET;
  const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;
  const value = match.slice(COOKIE_NAME.length + 1);
  const [issuedAt, signature] = value.split('.');
  if (!issuedAt || !signature) return false;
  const expected = sign(issuedAt, secret);
  return timingSafeEqual(signature, expected);
}

module.exports = { makeSessionCookie, isAuthorized };
