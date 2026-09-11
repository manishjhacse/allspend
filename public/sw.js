// AllSpend Service Worker — handles offline caching & Web Share Target POST
importScripts('/share-sw.js');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
