/** Tags that must never appear on the public parties page or in newsletter digests. */
export function isExcludedPublicParty(party) {
  const tags = [...(party.tags || [])];
  if (party.musicianProfile?.genres) tags.push(...party.musicianProfile.genres);

  const normalized = tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean);
  if (normalized.some((t) => t.includes('wedding'))) return true;
  if (normalized.some((t) => t.includes('private'))) return true;
  return false;
}
