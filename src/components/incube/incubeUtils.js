/** Niveau gamifié : Lionceau → En chemin → Gaindé */
export function getNiveauBadge(profile) {
  if (profile?.global_status === 'CERTIFIED') return { label: 'Gaindé', color: 'bg-cerip-lime text-white' };
  const p1 = profile?.p1_score != null ? Number(profile.p1_score) : 0;
  if (p1 >= 70 || profile?.current_parcours === 'P2') return { label: 'En chemin', color: 'bg-cerip-forest-mid text-white' };
  return { label: 'Lionceau', color: 'bg-cerip-magenta/15 text-cerip-magenta-dark' };
}

/** Retourne une URL embed pour YouTube/Vimeo, ou null si non reconnu */
export function getEmbedVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export const REQUIRED_QUIZ_SCORE_PCT = 70;
