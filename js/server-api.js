/* Attach the signed-in identity only to this site's API requests. */
(() => {
  const nativeFetch = window.fetch.bind(window);
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
    return nativeFetch(input, { ...options, headers });
  };
})();
