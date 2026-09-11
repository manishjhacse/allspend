// Custom Service Worker code — merged into next-pwa's generated SW
// Handles Web Share Target POST from Android Share Sheet

// ─── Share Target Handler ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept POST to /import (Web Share Target action)
  if (event.request.method !== 'POST' || url.pathname !== '/import') return;

  event.respondWith(
    (async () => {
      try {
        const formData = await event.request.formData();

        // Try common field names that share targets use
        const file =
          formData.get('screenshot') ||
          formData.get('file') ||
          formData.get('files') ||
          [...formData.values()].find((v) => v instanceof File);

        if (file && file instanceof File) {
          // Convert File to base64 and stash in a temporary cache
          const arrayBuffer = await file.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);

          const shareData = JSON.stringify({
            data: base64,
            type: file.type || 'image/png',
            name: file.name || 'screenshot.png',
          });

          const cache = await caches.open('allspend-share-temp');
          await cache.put(
            '/share-data',
            new Response(shareData, {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      } catch (err) {
        console.error('[SW] Share target error:', err);
      }

      // Always redirect to /import?shared=1 after processing
      return Response.redirect('/import?shared=1', 303);
    })()
  );
});

// ─── Message handler (page asks SW for the shared file) ───────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'GET_SHARE_DATA') return;

  const [port] = event.ports;
  if (!port) return;

  (async () => {
    try {
      const cache = await caches.open('allspend-share-temp');
      const response = await cache.match('/share-data');

      if (response) {
        const shareData = await response.text();
        await cache.delete('/share-data'); // consume once
        port.postMessage({ shareData });
      } else {
        port.postMessage({ shareData: null });
      }
    } catch (err) {
      port.postMessage({ shareData: null });
    }
  })();
});

// ─── Helper ────────────────────────────────────────────────────────────────
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
