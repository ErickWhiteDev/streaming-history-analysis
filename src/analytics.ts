import { DateTime } from 'luxon';
import { StreamRecord, TimeframeRecord } from './types';
import { THEME } from './theme';

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_MS = 86_400_000;

const asKey = (track: string, artist: string): string => `${track}__${artist}`;

export const buildTimeframe = (records: StreamRecord[], timezone: string): TimeframeRecord[] => {
  const zone = timezone === THEME.timezone.localValue ? undefined : timezone;
  return records.map((record) => {
    const utc = DateTime.fromISO(record.ts, { zone: 'utc' });
    const local = zone ? utc.setZone(zone) : utc.toLocal();
    return {
      ...record,
      localDate: local.toJSDate(),
      localDateKey: local.toISODate() ?? '1970-01-01',
      yearLocal: local.year,
      hourLocal: local.hour,
      weekdayLocal: local.weekdayLong,
    };
  });
};

export const filterByDateRange = (
  records: TimeframeRecord[],
  startDate: string,
  endDate: string,
): TimeframeRecord[] => {
  return records.filter((r) => r.localDateKey >= startDate && r.localDateKey <= endDate);
};

const topByMap = (map: Map<string, number>, n: number): Array<[string, number]> => {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
};

const isoToDayIndex = (isoDate: string): number => {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS);
};

const dayIndexToDate = (dayIndex: number): Date => {
  return new Date(dayIndex * DAY_MS);
};

const buildDayIndexRange = (startDate: string, endDate: string): { start: number; end: number } => {
  const start = isoToDayIndex(startDate);
  const end = isoToDayIndex(endDate);
  return { start: Math.min(start, end), end: Math.max(start, end) };
};

const toDailyCountMap = (records: TimeframeRecord[], keyFn: (record: TimeframeRecord) => string): Map<string, Map<number, number>> => {
  const grouped = new Map<string, Map<number, number>>();
  for (const record of records) {
    const entityKey = keyFn(record);
    const dayIndex = isoToDayIndex(record.localDateKey);
    const dayCounts = grouped.get(entityKey) ?? new Map<number, number>();
    dayCounts.set(dayIndex, (dayCounts.get(dayIndex) ?? 0) + 1);
    grouped.set(entityKey, dayCounts);
  }
  return grouped;
};

const centeredWindowRange = (centerDay: number, windowDays: number): { start: number; end: number } => {
  const left = Math.floor((windowDays - 1) / 2);
  const right = windowDays - 1 - left;
  return { start: centerDay - left, end: centerDay + right };
};

const buildPrefixCounts = (countsByDay: Map<number, number>, startDay: number, endDay: number): number[] => {
  const size = endDay - startDay + 1;
  const values = Array.from({ length: size }, (_, idx) => countsByDay.get(startDay + idx) ?? 0);
  const prefix = new Array<number>(size + 1).fill(0);
  for (let i = 0; i < size; i += 1) {
    prefix[i + 1] = prefix[i] + values[i];
  }
  return prefix;
};

const sumInRange = (prefix: number[], startDay: number, endDay: number, queryStart: number, queryEnd: number): number => {
  const from = Math.max(queryStart, startDay);
  const to = Math.min(queryEnd, endDay);
  if (to < from) return 0;
  const fromIdx = from - startDay;
  const toIdx = to - startDay;
  return prefix[toIdx + 1] - prefix[fromIdx];
};

const buildWindowedPoints = (
  countsByDay: Map<number, number>,
  windowDays: number,
  startDate: string,
  endDate: string,
): Array<{ x: Date; y: number }> => {
  const safeWindowDays = Math.max(1, windowDays);
  const { start, end } = buildDayIndexRange(startDate, endDate);
  const prefix = buildPrefixCounts(countsByDay, start, end);
  const points: Array<{ x: Date; y: number }> = [];

  for (let center = start; center <= end; center += 1) {
    const window = centeredWindowRange(center, safeWindowDays);
    points.push({
      x: dayIndexToDate(center),
      y: sumInRange(prefix, start, end, window.start, window.end),
    });
  }

  return points;
};

type FrequencyRow = {
  label: string;
  value: number;
  peakDate: Date;
};

const frequencyTop = (
  records: TimeframeRecord[],
  topN: number,
  windowDays: number,
  startDate: string,
  endDate: string,
  keyFn: (record: TimeframeRecord) => string,
  labelFn: (key: string) => string,
): FrequencyRow[] => {
  if (!records.length) return [];

  const safeWindowDays = Math.max(1, windowDays);
  const { start, end } = buildDayIndexRange(startDate, endDate);
  const grouped = toDailyCountMap(records, keyFn);

  const ranked: FrequencyRow[] = [];
  for (const [entityKey, dayCounts] of grouped.entries()) {
    const prefix = buildPrefixCounts(dayCounts, start, end);
    let bestValue = -1;
    let bestCenter = start;

    for (let center = start; center <= end; center += 1) {
      const window = centeredWindowRange(center, safeWindowDays);
      const value = sumInRange(prefix, start, end, window.start, window.end);
      if (value > bestValue) {
        bestValue = value;
        bestCenter = center;
      }
    }

    ranked.push({
      label: labelFn(entityKey),
      value: bestValue,
      peakDate: dayIndexToDate(bestCenter),
    });
  }

  return ranked.sort((a, b) => b.value - a.value).slice(0, topN);
};

export const topSongsByFrequency = (
  records: TimeframeRecord[],
  topN: number,
  windowDays: number,
  startDate: string,
  endDate: string,
): FrequencyRow[] => {
  return frequencyTop(
    records,
    topN,
    windowDays,
    startDate,
    endDate,
    (r) => asKey(r.trackName, r.artistName),
    (key) => {
      const [track, artist] = key.split('__');
      return `${track} - ${artist}`;
    },
  );
};

export const topArtistsByFrequency = (
  records: TimeframeRecord[],
  topN: number,
  windowDays: number,
  startDate: string,
  endDate: string,
): FrequencyRow[] => {
  return frequencyTop(records, topN, windowDays, startDate, endDate, (r) => r.artistName, (key) => key);
};

export const topAlbumsByFrequency = (
  records: TimeframeRecord[],
  topN: number,
  windowDays: number,
  startDate: string,
  endDate: string,
): FrequencyRow[] => {
  return frequencyTop(
    records,
    topN,
    windowDays,
    startDate,
    endDate,
    (r) => asKey(r.albumName, r.artistName),
    (key) => {
      const [album, artist] = key.split('__');
      return `${album} - ${artist}`;
    },
  );
};

export const overallListeningFrequency = (
  records: TimeframeRecord[],
  windowDays: number,
  startDate: string,
  endDate: string,
): Array<{ x: Date; y: number }> => {
  const safeWindowDays = Math.max(1, windowDays);
  const { start, end } = buildDayIndexRange(startDate, endDate);
  const counts = new Map<number, number>();
  for (const record of records) {
    const dayIndex = isoToDayIndex(record.localDateKey);
    counts.set(dayIndex, (counts.get(dayIndex) ?? 0) + 1);
  }

  const prefix = buildPrefixCounts(counts, start, end);
  const points: Array<{ x: Date; y: number }> = [];
  for (let center = start; center <= end; center += 1) {
    const window = centeredWindowRange(center, safeWindowDays);
    points.push({
      x: dayIndexToDate(center),
      y: sumInRange(prefix, start, end, window.start, window.end),
    });
  }
  return points;
};

export const topSongsByTime = (records: TimeframeRecord[], topN: number) => {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = asKey(r.trackName, r.artistName);
    map.set(key, (map.get(key) ?? 0) + r.msPlayed);
  }
  return topByMap(map, topN).map(([key, value]) => {
    const [track, artist] = key.split('__');
    return { label: `${track} - ${artist}`, track, artist, value };
  });
};

export const topSongsByCount = (records: TimeframeRecord[], topN: number) => {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = asKey(r.trackName, r.artistName);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return topByMap(map, topN).map(([key, value]) => {
    const [track, artist] = key.split('__');
    return { label: `${track} - ${artist}`, track, artist, value };
  });
};

export const topArtistsByTime = (records: TimeframeRecord[], topN: number) => {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.artistName, (map.get(r.artistName) ?? 0) + r.msPlayed);
  }
  return topByMap(map, topN).map(([label, value]) => ({ label, value }));
};

export const topArtistsByCount = (records: TimeframeRecord[], topN: number) => {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.artistName, (map.get(r.artistName) ?? 0) + 1);
  }
  return topByMap(map, topN).map(([label, value]) => ({ label, value }));
};

export const topAlbumsByTime = (records: TimeframeRecord[], topN: number) => {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = asKey(r.albumName, r.artistName);
    map.set(key, (map.get(key) ?? 0) + r.msPlayed);
  }
  return topByMap(map, topN).map(([key, value]) => {
    const [album, artist] = key.split('__');
    return { label: `${album} - ${artist}`, album, artist, value };
  });
};

export const topAlbumsByCount = (records: TimeframeRecord[], topN: number) => {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = asKey(r.albumName, r.artistName);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return topByMap(map, topN).map(([key, value]) => {
    const [album, artist] = key.split('__');
    return { label: `${album} - ${artist}`, album, artist, value };
  });
};

export const listeningByHour = (records: TimeframeRecord[]) => {
  const values = Array.from({ length: 24 }, () => 0);
  for (const r of records) {
    values[r.hourLocal] += r.msPlayed;
  }
  return values.map((value, hour) => ({ hour, value }));
};

export const listeningByWeekday = (records: TimeframeRecord[]) => {
  const map = new Map<string, number>();
  for (const day of WEEKDAY_ORDER) {
    map.set(day, 0);
  }
  for (const r of records) {
    map.set(r.weekdayLocal, (map.get(r.weekdayLocal) ?? 0) + r.msPlayed);
  }
  return WEEKDAY_ORDER.map((day) => ({ day, value: map.get(day) ?? 0 }));
};

export const skipRateByYear = (records: TimeframeRecord[]) => {
  const map = new Map<number, { skipped: number; total: number }>();
  for (const r of records) {
    const row = map.get(r.yearLocal) ?? { skipped: 0, total: 0 };
    row.total += 1;
    if (r.skipped) row.skipped += 1;
    map.set(r.yearLocal, row);
  }

  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, value]) => ({ year, value: value.total ? (value.skipped / value.total) * 100 : 0 }));
};

export const cumulativeSongs = (records: TimeframeRecord[], topN: number) => {
  const top = topSongsByTime(records, topN);
  return top.map((song) => {
    const points = records
      .filter((r) => r.trackName === song.track && r.artistName === song.artist)
      .sort((a, b) => a.localDate.getTime() - b.localDate.getTime());

    let running = 0;
    return {
      label: `${song.track} - ${song.artist}`,
      points: points.map((point) => {
        running += point.msPlayed;
        return { x: point.localDate, y: running };
      }),
    };
  });
};

export const cumulativeArtists = (records: TimeframeRecord[], topN: number) => {
  const top = topArtistsByTime(records, topN);
  return top.map((artist) => {
    const points = records
      .filter((r) => r.artistName === artist.label)
      .sort((a, b) => a.localDate.getTime() - b.localDate.getTime());

    let running = 0;
    return {
      label: artist.label,
      points: points.map((point) => {
        running += point.msPlayed;
        return { x: point.localDate, y: running };
      }),
    };
  });
};

export const cumulativeAlbums = (records: TimeframeRecord[], topN: number) => {
  const top = topAlbumsByTime(records, topN);
  return top.map((album) => {
    const points = records
      .filter((r) => r.albumName === album.album && r.artistName === album.artist)
      .sort((a, b) => a.localDate.getTime() - b.localDate.getTime());

    let running = 0;
    return {
      label: `${album.album} - ${album.artist}`,
      points: points.map((point) => {
        running += point.msPlayed;
        return { x: point.localDate, y: running };
      }),
    };
  });
};

export const songsFrequencySeries = (
  records: TimeframeRecord[],
  topN: number,
  windowDays: number,
  startDate: string,
  endDate: string,
) => {
  const top = topSongsByTime(records, topN);
  const grouped = toDailyCountMap(records, (r) => asKey(r.trackName, r.artistName));
  return top.map((song) => {
    const key = asKey(song.track, song.artist);
    const dayCounts = grouped.get(key) ?? new Map<number, number>();
    return {
      label: `${song.track} - ${song.artist}`,
      points: buildWindowedPoints(dayCounts, windowDays, startDate, endDate),
    };
  });
};

export const artistsFrequencySeries = (
  records: TimeframeRecord[],
  topN: number,
  windowDays: number,
  startDate: string,
  endDate: string,
) => {
  const top = topArtistsByTime(records, topN);
  const grouped = toDailyCountMap(records, (r) => r.artistName);
  return top.map((artist) => {
    const dayCounts = grouped.get(artist.label) ?? new Map<number, number>();
    return {
      label: artist.label,
      points: buildWindowedPoints(dayCounts, windowDays, startDate, endDate),
    };
  });
};

export const albumsFrequencySeries = (
  records: TimeframeRecord[],
  topN: number,
  windowDays: number,
  startDate: string,
  endDate: string,
) => {
  const top = topAlbumsByTime(records, topN);
  const grouped = toDailyCountMap(records, (r) => asKey(r.albumName, r.artistName));
  return top.map((album) => {
    const key = asKey(album.album, album.artist);
    const dayCounts = grouped.get(key) ?? new Map<number, number>();
    return {
      label: `${album.album} - ${album.artist}`,
      points: buildWindowedPoints(dayCounts, windowDays, startDate, endDate),
    };
  });
};
