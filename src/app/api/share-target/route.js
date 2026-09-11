import { NextResponse } from 'next/server';

/**
 * Handle POST /api/share-target for Web Share Target (Android Share Sheet)
 * When Android shares an image while SW is not active (cold start),
 * Next.js server receives the POST request here.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();

    // Check all common field names used by Android share targets
    let file = null;
    for (const [key, val] of formData.entries()) {
      if (val && typeof val === 'object' && val.name && val.size > 0) {
        file = val;
        break;
      }
    }

    if (!file) {
      return NextResponse.redirect(new URL('/import', request.url), 303);
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const fileName = file.name || 'screenshot.jpg';

    // Return HTML page that injects base64 into sessionStorage and redirects to /import?shared=1
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AllSpend - Receiving Screenshot</title>
    <script>
      try {
        sessionStorage.setItem('allspend_shared_image', JSON.stringify({
          data: "${base64}",
          type: "${mimeType}",
          name: "${fileName}"
        }));
      } catch (e) {
        console.error('Failed to store shared image in sessionStorage', e);
      }
      window.location.href = "/import?shared=1";
    </script>
  </head>
  <body style="background:#050505;color:#F5F5F5;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
    <div style="width:36px;height:36px;border:3px solid #1A1A1A;border-top-color:#00C853;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    <p style="margin-top:16px;font-size:14px;color:#8A8A8A;">Receiving payment screenshot…</p>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  </body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err) {
    console.error('[AllSpend Web Share Target Route Error]:', err);
    return NextResponse.redirect(new URL('/import', request.url), 303);
  }
}
