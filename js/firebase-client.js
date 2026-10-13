/* Server transport used by the live player and the stream URL editor. */
(() => {
  const routes = {
    'live.verify-access': '/api/live/verify-access',
    'live.heartbeat': '/api/live/heartbeat',
    'live.status': '/api/live/status',
    'votingFilms': '/api/submissions',
    'vote': '/api/vote',
    'submissions': '/api/admin/submissions',
    'stream.viewers': '/api/admin/stream/viewers',
    'live.viewers': '/api/admin/live/viewers',
    'stream.iframe-url': '/api/admin/stream/iframe-url',
    'stream.viewers.resend': '/api/admin/stream/viewers/resend',
    'stream.viewers.delete': '/api/admin/stream/viewers/delete',
    'stream.viewers.create': '/api/admin/stream/viewers/create',
    'stream.status': '/api/admin/stream/status',
    'resend-live-link': '/api/admin/resend-live-link'
  };
  async function request(operation, options = {}) {
    const route = routes[operation];
    if (!route) throw new Error(`Unknown server operation: ${operation}`);
    const headers = { ...options.headers };
    const sessionToken = sessionStorage.getItem('admin_jwt_token');
    const adminEmail = sessionStorage.getItem('admin_user_email');
    if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
    if (adminEmail) headers['x-admin-email'] = adminEmail;
    let body = options.body;
    if (body !== undefined && typeof body !== 'string') body = JSON.stringify(body);
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    return fetch(route, { ...options, headers, body });
  }
  function subscribe(operation, select, callback, onError) {
    let stopped = false;
    let pending = false;
    async function refresh() {
      if (stopped || pending) return;
      pending = true;
      try {
        const response = await request(operation);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load live updates.');
        if (!stopped) callback(select(data));
      } catch (error) {
        if (!stopped) onError(error);
      } finally { pending = false; }
    }
    const timer = setInterval(refresh, 5000);
    refresh();
    return () => { stopped = true; clearInterval(timer); };
  }
  window.FirebaseClient = {
    request,
    subscribeStream(callback, onError = console.error) {
      return subscribe('live.status', data => data, callback, onError);
    },
    subscribeVotingFilms(callback, onError = console.error) {
      return subscribe('votingFilms', data => (data.submissions || []).filter(film => film.inVoting === true), callback, onError);
    }
  };
})();
