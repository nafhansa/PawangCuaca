export async function generateFingerprint() {
  const stored = localStorage.getItem('pwc_fp');
  if (stored) return stored;

  const components = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ];

  const raw = components.join('|');
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw)
  );

  const hash = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  localStorage.setItem('pwc_fp', hash);
  return hash;
}

export function getFingerprint() {
  return localStorage.getItem('pwc_fp') || null;
}
