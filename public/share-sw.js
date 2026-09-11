// Service Worker for AllSpend Web Share Target API
// This handles POST requests from Android Share Sheet

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Web Share Target POST
  if (event.request.method === 'POST' && (url.pathname === '/import' || url.pathname === '/api/share-target')) {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        let file = null;
        for (const [key, val] of formData.entries()) {
          if (val && typeof val === 'object' && val.name && val.size > 0) {
            file = val;
            break;
          }
        }

        if (file) {
          // Convert file to base64 in ServiceWorker scope (FileReader is not available in SW)
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
          }
          const base64 = btoa(binary);

          const shareData = JSON.stringify({
            data: base64,
            type: file.type || 'image/png',
            name: file.name || 'screenshot.png',
          });

          // Store in a temp cache to hand off to the page
          const cache = await caches.open('share-target-temp');
          await cache.put('/share-data', new Response(shareData, {
            headers: { 'Content-Type': 'application/json' },
          }));
        }

        return Response.redirect('/import?shared=1', 303);
      })()
    );
    return;
  }
});

// Handle the client reading share data
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_SHARE_DATA') {
    (async () => {
      const cache = await caches.open('share-target-temp');
      const response = await cache.match('/share-data');
      if (response) {
        const data = await response.text();
        await cache.delete('/share-data');
        event.ports[0].postMessage({ shareData: data });
      } else {
        event.ports[0].postMessage({ shareData: null });
      }
    })();
  }
});
