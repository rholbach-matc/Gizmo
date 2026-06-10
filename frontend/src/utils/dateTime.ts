function timestampIncludesTimezone(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

export function formatLocalTimestamp(value: string) {
  const utcValue = timestampIncludesTimezone(value) ? value : `${value}Z`;

  return new Date(utcValue).toLocaleString();
}
