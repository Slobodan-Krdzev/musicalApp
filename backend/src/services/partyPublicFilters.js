const EXCLUDED_KEYWORDS = ['wedding', 'private'];

function hasExcludedKeyword(texts) {
  const normalized = texts
    .map((t) => String(t || '').trim().toLowerCase())
    .filter(Boolean);
  return normalized.some((t) => EXCLUDED_KEYWORDS.some((kw) => t.includes(kw)));
}

/**
 * Exclude wedding/private gigs from the public parties page and newsletter digests.
 * Only event/offering fields count — not venue gig types or musician services/genres
 * (e.g. a band that plays weddings can still appear on a public rock gig).
 */
export function isExcludedPublicParty(party) {
  const entityTags = party.entityTags ?? [];
  return hasExcludedKeyword([...entityTags, party.title, party.description]);
}
