import { ChartKey } from './types';

const CHART_LABELS: Record<ChartKey, string> = {
  topSongsTime: 'Top Songs by Time',
  topSongsCount: 'Top Songs by Count',
  topSongsFrequency: 'Top Songs by Frequency',
  topArtistsTime: 'Top Artists by Time',
  topArtistsCount: 'Top Artists by Count',
  topArtistsFrequency: 'Top Artists by Frequency',
  topAlbumsTime: 'Top Albums by Time',
  topAlbumsCount: 'Top Albums by Count',
  topAlbumsFrequency: 'Top Albums by Frequency',
  songsCumulative: 'Songs Cumulative',
  artistsCumulative: 'Artists Cumulative',
  albumsCumulative: 'Albums Cumulative',
  songsFrequency: 'Songs Frequency',
  artistsFrequency: 'Artists Frequency',
  albumsFrequency: 'Albums Frequency',
  listeningByHour: 'Listening by Hour',
  listeningByWeekday: 'Listening by Weekday',
  overallListeningFrequency: 'Overall Listening Frequency',
  insightsOverview: 'Insights Overview',
};

export const labelForChart = (key: ChartKey): string => CHART_LABELS[key];
