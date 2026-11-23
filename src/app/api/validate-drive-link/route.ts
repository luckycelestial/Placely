import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return Response.json({ error: 'URL is required' }, { status: 400 });
  }

  const cleanUrl = url.trim();
  
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    return Response.json({ valid: false, error: 'Invalid URL format' });
  }

  const allowedHosts = ['drive.google.com', 'docs.google.com'];
  const hostname = parsedUrl.hostname.toLowerCase();
  const isGoogleDrive = allowedHosts.includes(hostname) && parsedUrl.protocol === 'https:';

  if (!isGoogleDrive) {
    return Response.json({ valid: false, error: 'Must be an HTTPS Google Drive or Google Docs link' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(cleanUrl, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
      },
      redirect: 'manual',
      signal: controller.signal,
      next: { revalidate: 0 }
    });
    clearTimeout(timeoutId);

    if (res.status >= 400) {
      return Response.json({ valid: false, error: 'Link returned an error. Please verify the URL.' });
    }

    const text = await res.text();
    const isLoginPage = res.url.includes('accounts.google.com');
    const isAccessDenied = text.includes('You need permission') || text.includes('Request access');

    if (isLoginPage || isAccessDenied) {
      return Response.json({ 
        valid: false, 
        error: 'Link is private. Please change your Google Drive share settings to "Anyone with the link can view".' 
      });
    }

    return Response.json({ valid: true });
  } catch (err: unknown) {
    console.error('Error validating drive link:', err);
    return Response.json({ valid: false, error: 'Could not connect to the link. Make sure it is public and valid.' });
  }
}
