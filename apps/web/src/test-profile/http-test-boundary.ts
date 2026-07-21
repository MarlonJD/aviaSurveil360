export function createCanonicalTestFetch(subject: string, token: string): typeof fetch {
  return async (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("x-avia-test-subject", subject);
    headers.set("x-avia-test-token", token);
    return fetch(input, { ...init, headers });
  };
}
