/**
 * Utility functions for normalizing media links (Google Drive, YouTube, Vimeo, direct media)
 */

export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Convert Google Drive share links to direct image thumbnail/view URLs
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1920`;
    }
  }

  if (trimmed.includes('drive.google.com/open?id=')) {
    const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1920`;
    }
  }

  return trimmed;
}

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.includes('video/')
  );
}

export function getVideoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
  if (trimmed.includes('youtube.com/shorts/')) {
    const match = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&enablejsapi=1`;
    }
  }

  // YouTube Standard: https://www.youtube.com/watch?v=VIDEO_ID or m.youtube.com/watch
  if (trimmed.includes('youtube.com/watch')) {
    const match = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&enablejsapi=1`;
    }
  }

  // YouTube Short URL: https://youtu.be/VIDEO_ID
  if (trimmed.includes('youtu.be/')) {
    const match = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&enablejsapi=1`;
    }
  }

  // YouTube already embed: https://www.youtube.com/embed/VIDEO_ID
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed.includes('autoplay') ? trimmed : `${trimmed}${trimmed.includes('?') ? '&' : '?'}autoplay=1&rel=0&enablejsapi=1`;
  }

  // Vimeo: https://vimeo.com/VIDEO_ID
  if (trimmed.includes('vimeo.com/')) {
    const match = trimmed.match(/vimeo\.com\/([0-9]+)/);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
    }
  }

  // Google Drive video preview (can be played in iframe): https://drive.google.com/file/d/ID/preview
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }

  if (trimmed.includes('drive.google.com/open?id=')) {
    const match = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }

  return null;
}

export function getDynamicFaviconUrl(settings: {
  favicon_url?: string;
  logo_monogram?: string;
  logo_primary?: string;
  logo_light?: string;
  logo_style?: string;
  logo_initials?: string;
  brand_name?: string;
}): string {
  // 1. If explicit custom favicon uploaded/entered (not the default /favicon.svg)
  if (settings.favicon_url && settings.favicon_url !== '/favicon.svg' && settings.favicon_url.trim() !== '') {
    return normalizeMediaUrl(settings.favicon_url);
  }

  // 2. If monogram/compact mark exists, use it as favicon
  if (settings.logo_monogram && settings.logo_monogram.trim() !== '') {
    return normalizeMediaUrl(settings.logo_monogram);
  }

  // 3. If image_only style and logo image exists, use it
  if (settings.logo_style === 'image_only' && (settings.logo_primary || settings.logo_light)) {
    return normalizeMediaUrl((settings.logo_primary || settings.logo_light)!);
  }

  // 4. Dynamically generate an SVG data URI based on brand initials
  const initials = (
    settings.logo_initials ||
    (settings.brand_name ? settings.brand_name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) : 'AF')
  ).toUpperCase().slice(0, 3) || 'AF';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" rx="22" fill="#0D0D0E"/>
  <rect x="2" y="2" width="96" height="96" rx="20" stroke="#C5A880" stroke-width="3" stroke-opacity="0.9"/>
  <text x="50" y="64" font-family="'Cormorant Garamond', 'Georgia', serif" font-size="44" font-weight="700" fill="#F8F6F0" text-anchor="middle" letter-spacing="2">${initials}</text>
  <line x1="28" y1="76" x2="72" y2="76" stroke="#C5A880" stroke-width="2.5" stroke-opacity="0.9"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

