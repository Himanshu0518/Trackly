/**
 * Thin wrapper around sessionStorage for the JWT access token.
 *
 * Why sessionStorage (not localStorage)?
 *  - Cleared automatically when the tab/browser is closed — behaves like a
 *    session cookie, which mirrors the intent of the httpOnly cookie.
 *  - Not shared between tabs, so a logout in one tab doesn't silently affect
 *    another tab's in-flight requests.
 *
 * Why store it at all?
 *  - In incognito / strict-privacy mode, cross-origin SameSite=None cookies
 *    are blocked by the browser. The server already sends the raw token in
 *    the login/signup JSON body, so we can store it here and attach it as an
 *    Authorization header on every request — the server accepts either form.
 */

const KEY = "trackly_token";

export const tokenStore = {
  get: (): string | null => sessionStorage.getItem(KEY),
  set: (token: string): void => { sessionStorage.setItem(KEY, token); },
  clear: (): void => { sessionStorage.removeItem(KEY); },
};
