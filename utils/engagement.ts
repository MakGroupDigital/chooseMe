export function normalizeEngagementCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return 0;

    const multiplier = normalized.endsWith('k') ? 1000 : 1;
    const numericValue = Number(normalized.replace(/k$/, '').replace(',', '.'));

    return Number.isFinite(numericValue)
      ? Math.max(0, Math.trunc(numericValue * multiplier))
      : 0;
  }

  return 0;
}
