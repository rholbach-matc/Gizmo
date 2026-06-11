function timestampIncludesTimezone(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function timestampMilliseconds(value: string) {
  const utcValue = timestampIncludesTimezone(value) ? value : `${value}Z`;

  return new Date(utcValue).getTime();
}

export function formatLocalTimestamp(value: string) {
  const utcValue = timestampIncludesTimezone(value) ? value : `${value}Z`;

  return new Date(utcValue).toLocaleString();
}

export function optionalLocalDateTimeToISOString(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export function localDateTimeInputValue(value: string) {
  const utcValue = timestampIncludesTimezone(value) ? value : `${value}Z`;
  const date = new Date(utcValue);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 16);
}

export function sortByEntryTimeDescending<T extends { entry_time: string; id: number }>(
  entries: T[],
) {
  return [...entries].sort((firstEntry, secondEntry) => {
    const timeDifference =
      timestampMilliseconds(secondEntry.entry_time) -
      timestampMilliseconds(firstEntry.entry_time);

    return timeDifference || secondEntry.id - firstEntry.id;
  });
}
