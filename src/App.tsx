import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { loadSpotifyZip } from './dataLoader';
import { buildTimezoneOptions } from './timezones';
import { buildTimeframe } from './analytics';
import { ChartKey, StreamRecord } from './types';
import { buildChart, labelForChart } from './charts';

type PlotInstance = {
  data: any[];
  layout: any;
};

const CHART_KEYS: ChartKey[] = [
  'topSongsTime',
  'topSongsCount',
  'topArtistsTime',
  'topArtistsCount',
  'topAlbumsTime',
  'topAlbumsCount',
  'songsCumulative',
  'artistsCumulative',
  'listeningByHour',
  'listeningByWeekday',
  'skipRateByYear',
  'insightsOverview',
];

const App = () => {
  const timezoneOptions = useMemo(() => buildTimezoneOptions(), []);
  const [records, setRecords] = useState<StreamRecord[] | null>(null);
  const [status, setStatus] = useState('Select your Spotify data ZIP to continue.');
  const [fileName, setFileName] = useState('');

  const [yearStart, setYearStart] = useState(2023);
  const [yearEnd, setYearEnd] = useState(2026);
  const [topN, setTopN] = useState(5);
  const [timezone, setTimezone] = useState(timezoneOptions[0]?.value ?? 'UTC');

  const [activeChartKey, setActiveChartKey] = useState<ChartKey | null>(null);
  const [activePlot, setActivePlot] = useState<PlotInstance | null>(null);
  const [PlotComponent, setPlotComponent] = useState<any>(null);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(window.innerWidth < 1200);
  const [isNarrowMobileLayout, setIsNarrowMobileLayout] = useState<boolean>(window.innerWidth < 430);

  useEffect(() => {
    const onResize = () => {
      setIsMobileLayout(window.innerWidth < 1200);
      setIsNarrowMobileLayout(window.innerWidth < 430);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadPlotly = async () => {
      const [{ default: plotly }, factoryModule] = await Promise.all([
        import('plotly.js-dist-min'),
        import('react-plotly.js/factory.js'),
      ]);

      const createPlotlyComponent =
        (factoryModule as any).default?.default ??
        (factoryModule as any).default ??
        (factoryModule as any)['module.exports'] ??
        (factoryModule as any).createPlotlyComponent ??
        factoryModule;

      if (typeof createPlotlyComponent !== 'function') {
        throw new Error('Could not initialize Plotly component factory.');
      }

      if (!isMounted) {
        return;
      }

      setPlotComponent(() => createPlotlyComponent(plotly));
    };

    loadPlotly().catch((error) => {
      if (isMounted) {
        setStatus(`Could not initialize plotting library: ${String(error)}`);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const timeframe = useMemo(() => {
    if (!records) return [];
    return buildTimeframe(records, timezone);
  }, [records, timezone]);

  const yearBounds = useMemo(() => {
    if (!timeframe.length) {
      return { min: yearStart, max: yearEnd };
    }

    let minYear = timeframe[0].yearLocal;
    let maxYear = timeframe[0].yearLocal;
    for (const row of timeframe) {
      if (row.yearLocal < minYear) minYear = row.yearLocal;
      if (row.yearLocal > maxYear) maxYear = row.yearLocal;
    }
    return { min: minYear, max: maxYear };
  }, [timeframe, yearStart, yearEnd]);

  const clampYear = (value: number): number => {
    return Math.min(Math.max(value, yearBounds.min), yearBounds.max);
  };

  const onPickZip = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Loading ZIP data...');
    try {
      const loaded = await loadSpotifyZip(file);
      setRecords(loaded);
      setFileName(file.name);
      setStatus(`Loaded ${loaded.length.toLocaleString()} streams from ${file.name}`);
      setActiveChartKey(null);
      setActivePlot(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Could not load file: ${message}`);
      setRecords(null);
    }
  };

  const renderChart = (key: ChartKey) => {
    const start = Math.min(yearStart, yearEnd);
    const end = Math.max(yearStart, yearEnd);
    const depth = Math.max(1, Math.min(50, topN));
    const spec = buildChart(key, timeframe, start, end, depth, isMobileLayout, isNarrowMobileLayout);
    setActiveChartKey(key);
    setActivePlot({ data: spec.data, layout: spec.layout });
  };

  const onChangeYearStart = (value: number) => {
    if (Number.isNaN(value)) return;
    const nextStart = clampYear(value);
    setYearStart(nextStart);
    setYearEnd((prev) => Math.max(clampYear(prev), nextStart));
  };

  const onChangeYearEnd = (value: number) => {
    if (Number.isNaN(value)) return;
    const nextEnd = clampYear(value);
    setYearEnd(nextEnd);
    setYearStart((prev) => Math.min(clampYear(prev), nextEnd));
  };

  useEffect(() => {
    if (!timeframe.length) return;

    const boundedStart = clampYear(yearStart);
    const boundedEnd = clampYear(yearEnd);
    const normalizedStart = Math.min(boundedStart, boundedEnd);
    const normalizedEnd = Math.max(boundedStart, boundedEnd);

    if (normalizedStart !== yearStart) setYearStart(normalizedStart);
    if (normalizedEnd !== yearEnd) setYearEnd(normalizedEnd);
  }, [timeframe, yearBounds.min, yearBounds.max, yearStart, yearEnd]);

  useEffect(() => {
    if (!activeChartKey) return;
    const start = Math.min(yearStart, yearEnd);
    const end = Math.max(yearStart, yearEnd);
    const depth = Math.max(1, Math.min(50, topN));
    const spec = buildChart(activeChartKey, timeframe, start, end, depth, isMobileLayout, isNarrowMobileLayout);
    setActivePlot({ data: spec.data, layout: spec.layout });
  }, [activeChartKey, timeframe, yearStart, yearEnd, topN, isMobileLayout, isNarrowMobileLayout]);

  if (!records) {
    return (
      <div className="startup-shell">
        <div className="startup-card panel">
          <h1>Choose Spotify ZIP File</h1>
          <p>Select the exported Spotify archive (.zip) that contains your Streaming_History_Audio files.</p>
          <label className="file-picker">
            <input type="file" accept=".zip" onChange={onPickZip} />
            Browse ZIP...
          </label>
          <div className="status">{status}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="controls-row">
        <section className="panel filters-panel">
          <h2>Analysis Filters</h2>
          <p>Choose year range and statistic depth</p>
          <div className="filters-grid">
            <label>Start</label>
            <input
              type="number"
              value={yearStart}
              min={yearBounds.min}
              max={yearEnd}
              onChange={(e) => onChangeYearStart(Number(e.target.value))}
            />
            <label>End</label>
            <input
              type="number"
              value={yearEnd}
              min={yearStart}
              max={yearBounds.max}
              onChange={(e) => onChangeYearEnd(Number(e.target.value))}
            />
            <label>Statistic Depth</label>
            <input type="number" value={topN} min={1} max={50} onChange={(e) => setTopN(Number(e.target.value))} />
            <label>Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {timezoneOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="helper">Loaded file: {fileName}</div>
          <div className="helper">Listening hours, weekday, year, and cumulative timestamps use the selected timezone.</div>
        </section>

        <section className="panel button-panel">
          <h2>Select Statistic</h2>
          <div className="button-grid">
            {CHART_KEYS.map((key) => (
              <button key={key} className="rounded-button" onClick={() => renderChart(key)}>
                {labelForChart(key)}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section
        className={`panel plot-panel${
          isMobileLayout && activeChartKey === 'insightsOverview' ? ' plot-panel-mobile-insights' : ''
        }`}
      >
        {activePlot ? (
          <>
            {PlotComponent ? (
              <PlotComponent
                data={activePlot.data}
                layout={activePlot.layout}
                config={{ responsive: true, displaylogo: false }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
              />
            ) : (
              <div className="empty-state">Loading chart renderer...</div>
            )}
          </>
        ) : (
          <div className="empty-state">Select a statistic to render a chart.</div>
        )}
      </section>
    </div>
  );
};

export default App;
