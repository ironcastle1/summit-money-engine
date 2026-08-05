export function installDemoMode(options = {}) {
  const params = new URLSearchParams(location.search);
  const active = ['1', 'true', 'yes'].includes(String(params.get('demo') || '').toLowerCase());
  if (!active) return Object.freeze({ active: false, close() {} });
  document.documentElement.dataset.demo = 'true';
  const banner = document.createElement('div');
  banner.className = 'demo-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = '<strong>DEMONSTRATION MODE</strong><span>Sample and reference content may be shown. It is not a live operational assessment.</span><button type="button">EXIT DEMO</button>';
  document.body.append(banner);
  const close = () => {
    const url = new URL(location.href);
    url.searchParams.delete('demo');
    location.assign(url.toString());
  };
  banner.querySelector('button').addEventListener('click', close);
  options.onActivate?.();
  return Object.freeze({ active: true, close });
}
