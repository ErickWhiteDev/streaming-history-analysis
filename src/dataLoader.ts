import JSZip from 'jszip';
import { RawStreamRecord, StreamRecord } from './types';

const toRecord = (raw: RawStreamRecord): StreamRecord | null => {
  if (!raw.ts || typeof raw.ms_played !== 'number') {
    return null;
  }

  return {
    ts: raw.ts,
    msPlayed: raw.ms_played,
    trackName: raw.master_metadata_track_name ?? 'Unknown Track',
    artistName: raw.master_metadata_album_artist_name ?? 'Unknown Artist',
    albumName: raw.master_metadata_album_album_name ?? 'Unknown Album',
    skipped: Boolean(raw.skipped),
  };
};

export const loadSpotifyZip = async (file: File): Promise<StreamRecord[]> => {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.keys(zip.files).filter((name) => name.includes('Streaming_History_Audio_') && name.endsWith('.json'));

  if (!entries.length) {
    throw new Error('No Streaming_History_Audio_*.json files were found in this ZIP.');
  }

  const records: StreamRecord[] = [];
  for (const entry of entries) {
    const text = await zip.files[entry].async('string');
    const parsed = JSON.parse(text) as RawStreamRecord[];
    for (const item of parsed) {
      const normalized = toRecord(item);
      if (normalized) {
        records.push(normalized);
      }
    }
  }

  return records;
};
