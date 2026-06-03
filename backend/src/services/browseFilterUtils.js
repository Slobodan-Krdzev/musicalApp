export function parseTagsParam(tags) {
  if (!tags) return [];
  return String(tags)
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function parseTimeToMinutes(value) {
  if (!value) return null;
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function dateTimeMinutes(date) {
  const d = new Date(date);
  return d.getHours() * 60 + d.getMinutes();
}

export function matchesTimeRange(date, timeFrom, timeTo) {
  const mins = dateTimeMinutes(date);
  const from = parseTimeToMinutes(timeFrom);
  const to = parseTimeToMinutes(timeTo);
  if (from != null && mins < from) return false;
  if (to != null && mins > to) return false;
  return true;
}

export function matchesSearch(q, ...fields) {
  if (!q) return true;
  const needle = String(q).trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field && String(field).toLowerCase().includes(needle));
}

export function matchesTagsFilter(tagList, entityTags) {
  if (!tagList.length) return true;
  const normalized = (entityTags || []).map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  return tagList.some((tag) =>
    normalized.some((value) => value.includes(tag) || tag.includes(value))
  );
}

export function paginateItems(items, page, limit) {
  const total = items.length;
  const skip = (page - 1) * limit;
  return {
    items: items.slice(skip, skip + limit),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit) || 1) },
  };
}
