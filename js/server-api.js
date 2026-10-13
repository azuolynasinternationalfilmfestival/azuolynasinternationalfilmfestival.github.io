/* Attach the signed-in identity only to this site's API requests. */
(() => {
  const nativeFetch = window.fetch.bind(window);
  const apiBase = () => (window.FESTIVAL_API_BASE_URL || '').replace(/\/$/, '');
  let serverCheck;
  window.FestivalApi = {
    async hasServer() {
      if (!apiBase() && window.location.hostname.endsWith('.github.io')) return false;
      if (!serverCheck) serverCheck = (async () => {
        const response = await nativeFetch(`${apiBase()}/health`, { cache: 'no-store' });
        if ([404, 405].includes(response.status)) return false;
        if (!response.ok) throw new Error('Laiškų serveris šiuo metu nepasiekiamas. Bandykite dar kartą.');
        if (!(response.headers.get('content-type') || '').includes('application/json')) return false;
        const data = await response.json();
        return data.status === 'ok' && !!data.env?.firebaseDatabase;
      })().catch(error => { serverCheck = null; throw error; });
      return serverCheck;
    },
    async json(route, options) {
      const response = await window.fetch(route, options);
      if (!(response.headers.get('content-type') || '').includes('application/json')) {
        throw new Error('Laiškų API nepasiekiamas. Patikrinkite serverio adresą arba naudokite Firestore laiškų eilę.');
      }
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.error || 'Nepavyko atlikti serverio užklausos.');
      return data;
    }
  };
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
      return nativeFetch(input, options);
    }
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
    const user = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
    if (user) headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
    else {
      const sessionToken = sessionStorage.getItem('admin_jwt_token');
      if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
    }
    if (apiBase()) {
      const target = `${apiBase()}${url.pathname}${url.search}`;
      // Preserve Request bodies and methods when forwarding to a separate backend.
      return nativeFetch(input instanceof Request ? new Request(target, input) : target, { ...options, headers });
    }
    return nativeFetch(input, { ...options, headers });
  };
})();
