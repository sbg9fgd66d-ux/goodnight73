/* 离线缓存：改了音频后，把 CORE 列表更新成实际文件名，并把版本号 +1 */
const VERSION = 'goodnight-v10';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './audio/intro.mp3',
  './audio/XXI.mp3',
  './audio/XXII.mp3',
  './audio/XXIV.mp3'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isDoc = e.request.mode === 'navigate'
    || e.request.destination === 'document'
    || e.request.url.endsWith('/index.html');
  if (isDoc) {
    // 页面：联网优先（有网就拿最新版），断网回退缓存 → 更新即时生效
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
  } else {
    // 音频/图标：缓存优先（省流量、离线可听）
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }).catch(() => cached))
    );
  }
});
