(() => {
  const built = document.querySelector('meta[name="brallent-release"]').content;
  const url = new URL(location.href);
  if (url.searchParams.get('_release') === built) {
    url.searchParams.delete('_release');
    history.replaceState(history.state, '', url);
  }

  // Older pages may predate this checker. Request the matching document on
  // internal navigation as well, preserving service parameters and anchors.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented) return;
    const href = link.getAttribute('href');
    if (!/^[\w-]+\.html(?:[?#]|$)/.test(href)) return;
    const target = new URL(href, location.href);
    target.searchParams.set('_release', built);
    link.href = target.href;
    setTimeout(() => link.setAttribute('href', href), 0);
  });

  let checking = false;
  function editingInquiry() {
    return [...document.querySelectorAll('#inquiry input:not([type=hidden]), #inquiry textarea')]
      .some(field => field.value.trim());
  }
  async function check() {
    if (checking || document.hidden || editingInquiry()) return;
    checking = true;
    try {
      const manifest = new URL('release.json', location.href);
      manifest.searchParams.set('check', Date.now());
      const response = await fetch(manifest, { cache: 'no-store' });
      if (!response.ok) return;
      const { release } = await response.json();
      const target = new URL(location.href);
      if (!/^[a-f0-9]{16}$/.test(release) || built === release ||
          target.searchParams.get('_release') === release || editingInquiry()) return;
      target.searchParams.set('_release', release);
      location.replace(target);
    } catch {
      // Cached pages remain usable while offline.
    } finally {
      checking = false;
    }
  }
  window.addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();
