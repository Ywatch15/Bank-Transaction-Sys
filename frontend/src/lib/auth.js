/**
 * auth.js — Token & session helpers
 * ----------------------------------
 * Centralised place for all token read/write/decode operations.
 *
 * Current storage: localStorage
 *   Trade-off: Accessible by JS (XSS risk) but works without backend cookie
 *   support. Migrate to httpOnly cookies server-side for production hardening.
 *
 * NEVER log tokens to the console in production code.
 */

const TOKEN_KEY = 'bts_auth_token';

/** Persist token after login */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Retrieve stored token */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove token on logout */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decode a JWT payload WITHOUT verifying the signature.
 * Verification must happen server-side.
 * Returns null if the token is malformed.
 */
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    // atob decodes base64; add padding if needed
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null; // expired
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check whether the current user is an admin.
 * The backend embeds `isAdmin` in the token payload OR we check it on user object.
 * Pass the user object from AuthContext as a fallback.
 */
export function isAdmin(user) {
  const token = getToken();
  if (token) {
    const decoded = decodeToken(token);
    if (decoded?.isAdmin) return true;
  }
  // Fallback: check user object from context
  return user?.isAdmin === true;
}

/** True if a valid (non-expired) token is stored */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  return decodeToken(token) !== null;
}
