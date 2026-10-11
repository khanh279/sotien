// Sổ Thu Chi: chạy được khi mất mạng.
// Mỗi lần sửa index.html, tăng số phiên bản dưới đây để điện thoại tải bản mới.
const CACHE = 'so-tien-v90';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // Chỉ dọn bộ nhớ đệm cũ của chính Sổ Thu Chi, không đụng tới app khác chung tên miền.
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('so-tien-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return;
  // Trả bản đã lưu ngay, đồng thời tải bản mới về cho lần mở sau.
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: req.mode === 'navigate'});
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error()));
    return hit || net;
  }));
});
