export type RawStreamRecord = {
  ts: string;
  ms_played: number;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  skipped?: boolean | null;
};

export type StreamRecord = {
  ts: string;
  msPlayed: number;
  trackName: string;
  artistName: string;
  albumName: string;
  skipped: boolean;
};

export type TimeframeRecord = StreamRecord & {
  localDate: Date;
  localDateKey: string;
  yearLocal: number;
  hourLocal: number;
  weekdayLocal: string;
};

export type TimezoneOption = {
  label: string;
  value: string;
};

export type ChartSpec = {
  title: string;
  data: any[];
  layout: any;
};

export type ChartKey =
  | 'topSongsTime'
  | 'topSongsCount'
  | 'topSongsFrequency'
  | 'topArtistsTime'
  | 'topArtistsCount'
  | 'topArtistsFrequency'
  | 'topAlbumsTime'
  | 'topAlbumsCount'
  | 'topAlbumsFrequency'
  | 'songsCumulative'
  | 'artistsCumulative'
  | 'albumsCumulative'
  | 'songsFrequency'
  | 'artistsFrequency'
  | 'albumsFrequency'
  | 'listeningByHour'
  | 'listeningByWeekday'
  | 'overallListeningFrequency'
  | 'insightsOverview';
