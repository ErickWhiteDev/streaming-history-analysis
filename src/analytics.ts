import { DateTime } from 'luxon';
import { StreamRecord, TimeframeRecord } from './types';
import { THEME } from './theme';

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const asKey = (track: string, artist: string): string => `${track}__${artist}`;

export const buildTimeframe = (records: StreamRecord[], timezone: string): TimeframeRecord[] => {
  const zone = timezone === THEME.timezone.localValue ? undefined : timezone;
  return records.map((record) => {
    const utc = DateTime.fromISO(record.ts, { zone: 'utc' });
    const local = zone ? utc.setZone(zone) : utc.toLocal();
    return {
      ...record,
      localDate: local.toJSDate(),
      yearLocal: local.year,
      hourLocal: local.hour,
      weekdayLocal: local.weekdayLong,
    };
  });
};

export const filterByYear = (records: TimeframeRecord[], yearStart: number, yearEnd: number): TimeframeRecord[] => {
  return records.filter((r) => r.yearLocal >= yearStart && r.yearLocal <= yearEnd);
};

const topByMap = (map: Map<string, number>, n: number): Array<[string, number]> => {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
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
    return { label: `${album} - ${artist}`, value };
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
    return { label: `${album} - ${artist}`, value };
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
