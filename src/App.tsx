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
  'topSongsCount',
  'topSongsFrequency',
  'topSongsTime',

  'topArtistsCount',
  'topArtistsFrequency',
  'topArtistsTime',

  'topAlbumsCount',
  'topAlbumsFrequency',
  'topAlbumsTime',

  'songsCumulative',
  'artistsCumulative',
  'albumsCumulative',

  'songsFrequency',
  'artistsFrequency',
  'albumsFrequency',

  'overallListeningFrequency',
  'listeningByHour',
  'listeningByWeekday',

  'insightsOverview',
];

const FREQUENCY_WINDOWS = [
  { value: '1d', label: '1 Day', days: 1, unitLabel: 'Day' },
  { value: '3d', label: '3 Days', days: 3, unitLabel: '3 Days' },
  { value: '1w', label: '1 Week', days: 7, unitLabel: 'Week' },
  { value: '2w', label: '2 Weeks', days: 14, unitLabel: '2 Weeks' },
  { value: '1m', label: '1 Month (30 Days)', days: 30, unitLabel: 'Month' },
];

const isoToday = (): string => new Date().toISOString().slice(0, 10);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September','October', 'November', 'December'];

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const parseIsoDate = (value: string): DateParts => {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

const daysInMonth = (year: number, month: number): number => {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

const toDateKey = (parts: DateParts): number => parts.year * 10_000 + parts.month * 100 + parts.day;

const clampPartsToRange = (parts: DateParts, minIso: string, maxIso: string): DateParts => {
  const minParts = parseIsoDate(minIso);
  const maxParts = parseIsoDate(maxIso);

  const dayCap = daysInMonth(parts.year, parts.month);
  const normalized = { ...parts, day: Math.min(parts.day, dayCap) };

  const currentKey = toDateKey(normalized);
  const minKey = toDateKey(minParts);
  const maxKey = toDateKey(maxParts);

  if (currentKey < minKey) return minParts;
  if (currentKey > maxKey) return maxParts;
  return normalized;
};

const toIsoDate = (parts: DateParts): string => `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;

const computeDefaultDateRange = (minDate: string, maxDate: string): { start: string; end: string } => {
  const minYear = Number(minDate.slice(0, 4));
  const maxYear = Number(maxDate.slice(0, 4));

  for (let year = maxYear; year >= minYear; year -= 1) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    if (minDate <= yearStart && maxDate >= yearEnd) {
      return { start: yearStart, end: yearEnd };
    }
  }

  const firstYear = Number(minDate.slice(0, 4));
  const endOfFirstYear = `${firstYear}-12-31`;
  if (endOfFirstYear <= maxDate) {
    return { start: minDate, end: endOfFirstYear };
  }

  return { start: minDate, end: maxDate };
};

type DateScrollPickerProps = {
  value: string;
  hardMin: string;
  hardMax: string;
  softMin?: string;
  softMax?: string;
  onChange: (next: string) => void;
};

const DateScrollPicker = ({ value, hardMin, hardMax, softMin, softMax, onChange }: DateScrollPickerProps) => {
  const parts = useMemo(() => parseIsoDate(value), [value]);
  const minParts = useMemo(() => parseIsoDate(hardMin), [hardMin]);
  const maxParts = useMemo(() => parseIsoDate(hardMax), [hardMax]);

  const hardMinKey = useMemo(() => toDateKey(minParts), [minParts]);
  const hardMaxKey = useMemo(() => toDateKey(maxParts), [maxParts]);
  const softMinKey = useMemo(() => (softMin ? toDateKey(parseIsoDate(softMin)) : hardMinKey), [softMin, hardMinKey]);
  const softMaxKey = useMemo(() => (softMax ? toDateKey(parseIsoDate(softMax)) : hardMaxKey), [softMax, hardMaxKey]);

  const inSoftRange = (dateKey: number) => dateKey >= softMinKey && dateKey <= softMaxKey;
  const intersectsSoftRange = (startKey: number, endKey: number) => {
    return Math.max(startKey, softMinKey) <= Math.min(endKey, softMaxKey);
  };

  const yearOptions = useMemo(() => {
    const options: number[] = [];
    for (let year = minParts.year; year <= maxParts.year; year += 1) {
      options.push(year);
    }
    return options;
  }, [minParts.year, maxParts.year]);

  const monthMin = parts.year === minParts.year ? minParts.month : 1;
  const monthMax = parts.year === maxParts.year ? maxParts.month : 12;

  const monthOptions = useMemo(() => {
    const options: number[] = [];
    for (let month = monthMin; month <= monthMax; month += 1) {
      options.push(month);
    }
    return options;
  }, [monthMin, monthMax]);

  const absoluteDayMax = daysInMonth(parts.year, parts.month);
  const dayMin = parts.year === minParts.year && parts.month === minParts.month ? minParts.day : 1;
  const dayMax = parts.year === maxParts.year && parts.month === maxParts.month ? maxParts.day : absoluteDayMax;

  const dayOptions = useMemo(() => {
    const options: number[] = [];
    for (let day = dayMin; day <= dayMax; day += 1) {
      options.push(day);
    }
    return options;
  }, [dayMin, dayMax]);

  const update = (nextParts: DateParts) => {
    const hardBounded = clampPartsToRange(nextParts, hardMin, hardMax);
    const effectiveMin = softMin && softMin > hardMin ? softMin : hardMin;
    const effectiveMax = softMax && softMax < hardMax ? softMax : hardMax;
    const fullyBounded = clampPartsToRange(hardBounded, effectiveMin, effectiveMax);
    onChange(toIsoDate(fullyBounded));
  };

  return (
    <div className="date-scroll-picker" aria-label="Date selector">
      <select value={parts.month} onChange={(e) => update({ ...parts, month: Number(e.target.value) })}>
        {monthOptions.map((month) => (
          <option
            key={month}
            value={month}
            disabled={(() => {
              const monthStartKey = toDateKey({ year: parts.year, month, day: 1 });
              const monthEndKey = toDateKey({ year: parts.year, month, day: daysInMonth(parts.year, month) });
              const boundedStart = Math.max(monthStartKey, hardMinKey);
              const boundedEnd = Math.min(monthEndKey, hardMaxKey);
              return !intersectsSoftRange(boundedStart, boundedEnd);
            })()}
          >
            {MONTH_NAMES[month - 1]}
          </option>
        ))}
      </select>
      <select value={parts.day} onChange={(e) => update({ ...parts, day: Number(e.target.value) })}>
        {dayOptions.map((day) => (
          <option key={day} value={day} disabled={!inSoftRange(toDateKey({ year: parts.year, month: parts.month, day }))}>
            {day}
          </option>
        ))}
      </select>
      <select value={parts.year} onChange={(e) => update({ ...parts, year: Number(e.target.value) })}>
        {yearOptions.map((year) => (
          <option
            key={year}
            value={year}
            disabled={(() => {
              const yearStartKey = toDateKey({ year, month: 1, day: 1 });
              const yearEndKey = toDateKey({ year, month: 12, day: 31 });
              const boundedStart = Math.max(yearStartKey, hardMinKey);
              const boundedEnd = Math.min(yearEndKey, hardMaxKey);
              return !intersectsSoftRange(boundedStart, boundedEnd);
            })()}
          >
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

const App = () => {
  const timezoneOptions = useMemo(() => buildTimezoneOptions(), []);
  const [records, setRecords] = useState<StreamRecord[] | null>(null);
  const [status, setStatus] = useState('Select your Spotify data ZIP to continue.');
  const [fileName, setFileName] = useState('');

  const [startDate, setStartDate] = useState(isoToday());
  const [endDate, setEndDate] = useState(isoToday());
  const [topN, setTopN] = useState(5);
  const [frequencyWindow, setFrequencyWindow] = useState(FREQUENCY_WINDOWS[2].value);
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

  const dateBounds = useMemo(() => {
    if (!timeframe.length) {
      return { min: startDate, max: endDate };
    }

    let minDate = timeframe[0].localDateKey;
    let maxDate = timeframe[0].localDateKey;
    for (const row of timeframe) {
      if (row.localDateKey < minDate) minDate = row.localDateKey;
      if (row.localDateKey > maxDate) maxDate = row.localDateKey;
    }
    return { min: minDate, max: maxDate };
  }, [timeframe, startDate, endDate]);

  const clampDate = (value: string): string => {
    if (value < dateBounds.min) return dateBounds.min;
    if (value > dateBounds.max) return dateBounds.max;
    return value;
  };

  const frequencyWindowSpec = useMemo(() => {
    return FREQUENCY_WINDOWS.find((option) => option.value === frequencyWindow) ?? FREQUENCY_WINDOWS[2];
  }, [frequencyWindow]);

  const onPickZip = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Loading ZIP data...');
    try {
      const loaded = await loadSpotifyZip(file);
      const loadedTimeframe = buildTimeframe(loaded, timezone);

      let minDate = loadedTimeframe[0]?.localDateKey;
      let maxDate = loadedTimeframe[0]?.localDateKey;
      for (const row of loadedTimeframe) {
        if (minDate && row.localDateKey < minDate) minDate = row.localDateKey;
        if (maxDate && row.localDateKey > maxDate) maxDate = row.localDateKey;
      }

      if (minDate && maxDate) {
        const nextRange = computeDefaultDateRange(minDate, maxDate);
        setStartDate(nextRange.start);
        setEndDate(nextRange.end);
      }

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
    const start = startDate <= endDate ? startDate : endDate;
    const end = startDate <= endDate ? endDate : startDate;
    const depth = Math.max(1, Math.min(50, topN));
    const spec = buildChart(
      key,
      timeframe,
      start,
      end,
      depth,
      frequencyWindowSpec.days,
      frequencyWindowSpec.unitLabel,
      isMobileLayout,
      isNarrowMobileLayout,
    );
    setActiveChartKey(key);
    setActivePlot({ data: spec.data, layout: spec.layout });
  };

  const onChangeStartDate = (value: string) => {
    if (!value) return;
    const nextStart = clampDate(value);
    setStartDate(nextStart);
    setEndDate((prev) => {
      const boundedPrev = clampDate(prev);
      return boundedPrev < nextStart ? nextStart : boundedPrev;
    });
  };

  const onChangeEndDate = (value: string) => {
    if (!value) return;
    const nextEnd = clampDate(value);
    setEndDate(nextEnd);
    setStartDate((prev) => {
      const boundedPrev = clampDate(prev);
      return boundedPrev > nextEnd ? nextEnd : boundedPrev;
    });
  };

  useEffect(() => {
    if (!timeframe.length) return;

    const boundedStart = clampDate(startDate);
    const boundedEnd = clampDate(endDate);
    const normalizedStart = boundedStart <= boundedEnd ? boundedStart : boundedEnd;
    const normalizedEnd = boundedStart <= boundedEnd ? boundedEnd : boundedStart;

    if (normalizedStart !== startDate) setStartDate(normalizedStart);
    if (normalizedEnd !== endDate) setEndDate(normalizedEnd);
  }, [timeframe, dateBounds.min, dateBounds.max, startDate, endDate]);

  useEffect(() => {
    if (!activeChartKey) return;
    const start = startDate <= endDate ? startDate : endDate;
    const end = startDate <= endDate ? endDate : startDate;
    const depth = Math.max(1, Math.min(50, topN));
    const spec = buildChart(
      activeChartKey,
      timeframe,
      start,
      end,
      depth,
      frequencyWindowSpec.days,
      frequencyWindowSpec.unitLabel,
      isMobileLayout,
      isNarrowMobileLayout,
    );
    setActivePlot({ data: spec.data, layout: spec.layout });
  }, [
    activeChartKey,
    timeframe,
    startDate,
    endDate,
    topN,
    frequencyWindowSpec.days,
    frequencyWindowSpec.unitLabel,
    isMobileLayout,
    isNarrowMobileLayout,
  ]);

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
          <p>Choose date range and statistic depth</p>
          <div className="filters-grid">
            <label>Start Date</label>
            <DateScrollPicker
              value={startDate}
              hardMin={dateBounds.min}
              hardMax={dateBounds.max}
              softMax={endDate}
              onChange={onChangeStartDate}
            />
            <label>End Date</label>
            <DateScrollPicker
              value={endDate}
              hardMin={dateBounds.min}
              hardMax={dateBounds.max}
              softMin={startDate}
              onChange={onChangeEndDate}
            />
            <label>Statistic Depth</label>
            <input type="number" value={topN} min={1} max={50} onChange={(e) => setTopN(Number(e.target.value))} />
            <label>Frequency Window</label>
            <select value={frequencyWindow} onChange={(e) => setFrequencyWindow(e.target.value)}>
              {FREQUENCY_WINDOWS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
          <div className="helper">Frequency charts use a centered sliding window with the selected frequency window size.</div>
        </section>

        <section className="panel button-panel">
          <h2>Select Statistic</h2>
          <div className="button-grid">
            {CHART_KEYS.map((key) => (
              <button
                key={key}
                className={`rounded-button${key === 'insightsOverview' ? ' rounded-button-emphasis insights-button' : ''}`}
                onClick={() => renderChart(key)}
              >
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
