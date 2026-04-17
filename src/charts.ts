import {
  ChartKey,
  ChartSpec,
  TimeframeRecord,
} from './types';
import { THEME } from './theme';
import {
  cumulativeArtists,
  cumulativeSongs,
  filterByYear,
  listeningByHour,
  listeningByWeekday,
  skipRateByYear,
  topAlbumsByCount,
  topAlbumsByTime,
  topArtistsByCount,
  topArtistsByTime,
  topSongsByCount,
  topSongsByTime,
} from './analytics';

const msToHours = (ms: number): number => ms / 3_600_000;
const PLOT_TITLE_FONT_SIZE = 18;
const SUBPLOT_LABEL_FONT_SIZE = 13;
const UNIFORM_MARGIN = { t: 64, r: 24, b: 64, l: 40 };
const NO_X_LABEL_MARGIN = { ...UNIFORM_MARGIN, b: 40 };

const baseLayout = (title: string) => ({
  title: {
    text: title,
    x: 0.5,
    xanchor: 'center',
    font: { color: THEME.ui.plotTitle, size: PLOT_TITLE_FONT_SIZE },
  },
  paper_bgcolor: THEME.ui.plotFigBg,
  plot_bgcolor: THEME.ui.plotAxesBg,
  font: { color: THEME.ui.plotTick },
  margin: UNIFORM_MARGIN,
  xaxis: { gridcolor: THEME.ui.plotGrid, zeroline: false, automargin: true },
  yaxis: { gridcolor: THEME.ui.plotGrid, zeroline: false, automargin: true },
  legend: {
    bgcolor: THEME.ui.legendFace,
    bordercolor: THEME.ui.legendEdge,
    borderwidth: 1,
    font: { color: THEME.ui.plotTitle },
  },
  autosize: true,
});

const reverseLabelSeries = (rows: Array<{ label: string; value: number }>) => ({
  y: [...rows].reverse().map((r) => r.label),
  x: [...rows].reverse().map((r) => r.value),
});

const narrowBarLabelStyle = (textColor: string) => ({
  textposition: 'inside' as const,
  insidetextanchor: 'start' as const,
  texttemplate: '%{text}',
  textfont: { color: textColor, size: 11 },
  constraintext: 'none' as const,
  cliponaxis: false,
});

export const buildChart = (
  key: ChartKey,
  timeframe: TimeframeRecord[],
  yearStart: number,
  yearEnd: number,
  topN: number,
  isMobileLayout = false,
  isNarrowMobileLayout = false,
): ChartSpec => {
  const records = filterByYear(timeframe, yearStart, yearEnd);
  const shouldOverlayCategoryLabels = isMobileLayout;

  if (key === 'topSongsTime') {
    const rows = topSongsByTime(records, topN);
    const series = reverseLabelSeries(rows);
    const xHours = series.x.map(msToHours);
    return {
      title: `Top ${topN} songs by listen time (${yearStart}-${yearEnd})`,
      data: [{
        type: 'bar',
        orientation: 'h',
        x: xHours,
        y: series.y,
        marker: { color: THEME.charts.songsTime },
        hovertemplate: '%{y}<br>%{x:.2f} h<extra></extra>',
        ...(shouldOverlayCategoryLabels
          ? { text: series.y, ...narrowBarLabelStyle(THEME.ui.buttonText) }
          : {}),
      }],
      layout: {
        ...baseLayout(`Top ${topN} songs by listen time (${yearStart}-${yearEnd})`),
        margin: UNIFORM_MARGIN,
        xaxis: { title: 'Listening Time (hours)', tickformat: '.2f', automargin: true, gridcolor: THEME.ui.plotGrid },
        yaxis: shouldOverlayCategoryLabels ? { showticklabels: false, automargin: true, gridcolor: THEME.ui.plotGrid } : { gridcolor: THEME.ui.plotGrid, zeroline: false, automargin: true },
      },
    };
  }

  if (key === 'topSongsCount') {
    const rows = topSongsByCount(records, topN);
    const series = reverseLabelSeries(rows);
    return {
      title: `Top ${topN} songs by listen count (${yearStart}-${yearEnd})`,
      data: [{
        type: 'bar',
        orientation: 'h',
        x: series.x,
        y: series.y,
        marker: { color: THEME.charts.songsCount },
        hovertemplate: '%{y}<br>%{x} listens<extra></extra>',
        ...(shouldOverlayCategoryLabels
          ? { text: series.y, ...narrowBarLabelStyle(THEME.ui.buttonText) }
          : {}),
      }],
      layout: {
        ...baseLayout(`Top ${topN} songs by listen count (${yearStart}-${yearEnd})`),
        margin: NO_X_LABEL_MARGIN,
        yaxis: shouldOverlayCategoryLabels ? { showticklabels: false, automargin: true, gridcolor: THEME.ui.plotGrid } : { gridcolor: THEME.ui.plotGrid, zeroline: false, automargin: true },
      },
    };
  }

  if (key === 'topArtistsTime') {
    const rows = topArtistsByTime(records, topN);
    const series = reverseLabelSeries(rows);
    const xHours = series.x.map(msToHours);
    return {
      title: `Top ${topN} artists by listen time (${yearStart}-${yearEnd})`,
      data: [{
        type: 'bar',
        orientation: 'h',
        x: xHours,
        y: series.y,
        marker: { color: THEME.charts.artistsTime },
        hovertemplate: '%{y}<br>%{x:.2f} h<extra></extra>',
        ...(shouldOverlayCategoryLabels
          ? { text: series.y, ...narrowBarLabelStyle(THEME.ui.buttonText) }
          : {}),
      }],
      layout: {
        ...baseLayout(`Top ${topN} artists by listen time (${yearStart}-${yearEnd})`),
        margin: UNIFORM_MARGIN,
        xaxis: { title: 'Listening Time (hours)', tickformat: '.2f', automargin: true, gridcolor: THEME.ui.plotGrid },
        yaxis: shouldOverlayCategoryLabels ? { showticklabels: false, automargin: true, gridcolor: THEME.ui.plotGrid } : { gridcolor: THEME.ui.plotGrid, zeroline: false, automargin: true },
      },
    };
  }

  if (key === 'topArtistsCount') {
    const rows = topArtistsByCount(records, topN);
    const series = reverseLabelSeries(rows);
    return {
      title: `Top ${topN} artists by listen count (${yearStart}-${yearEnd})`,
      data: [{
        type: 'bar',
        orientation: 'h',
        x: series.x,
        y: series.y,
        marker: { color: THEME.charts.artistsCount },
        hovertemplate: '%{y}<br>%{x} listens<extra></extra>',
        ...(shouldOverlayCategoryLabels
          ? { text: series.y, ...narrowBarLabelStyle(THEME.ui.plotTitle) }
          : {}),
      }],
      layout: {
        ...baseLayout(`Top ${topN} artists by listen count (${yearStart}-${yearEnd})`),
        margin: NO_X_LABEL_MARGIN,
        yaxis: shouldOverlayCategoryLabels ? { showticklabels: false, automargin: true, gridcolor: THEME.ui.plotGrid } : { gridcolor: THEME.ui.plotGrid, zeroline: false, automargin: true },
      },
    };
  }

  if (key === 'topAlbumsTime') {
    const rows = topAlbumsByTime(records, topN);
    const series = reverseLabelSeries(rows);
    const xHours = series.x.map(msToHours);
    return {
      title: `Top ${topN} albums by time (${yearStart}-${yearEnd})`,
      data: [{
        type: 'bar',
        orientation: 'h',
        x: xHours,
        y: series.y,
        marker: { color: THEME.charts.albumsTime },
        hovertemplate: '%{y}<br>%{x:.2f} h<extra></extra>',
        ...(shouldOverlayCategoryLabels
          ? { text: series.y, ...narrowBarLabelStyle(THEME.ui.buttonText) }
          : {}),
      }],
      layout: {
        ...baseLayout(`Top ${topN} albums by time (${yearStart}-${yearEnd})`),
        margin: UNIFORM_MARGIN,
        xaxis: { title: 'Listening Time (hours)', tickformat: '.2f', automargin: true, gridcolor: THEME.ui.plotGrid },
        yaxis: shouldOverlayCategoryLabels ? { showticklabels: false, automargin: true, gridcolor: THEME.ui.plotGrid } : { gridcolor: THEME.ui.plotGrid, zeroline: false, automargin: true },
      },
    };
  }

  if (key === 'topAlbumsCount') {
    const rows = topAlbumsByCount(records, topN);
    const series = reverseLabelSeries(rows);
    return {
      title: `Top ${topN} albums by listen count (${yearStart}-${yearEnd})`,
      data: [{
        type: 'bar',
        orientation: 'h',
        x: series.x,
        y: series.y,
        marker: { color: THEME.charts.albumsCount },
        hovertemplate: '%{y}<br>%{x} listens<extra></extra>',
        ...(shouldOverlayCategoryLabels
          ? { text: series.y, ...narrowBarLabelStyle(THEME.ui.plotTitle) }
          : {}),
      }],
      layout: {
        ...baseLayout(`Top ${topN} albums by listen count (${yearStart}-${yearEnd})`),
        margin: NO_X_LABEL_MARGIN,
        yaxis: shouldOverlayCategoryLabels ? { showticklabels: false, automargin: true, gridcolor: THEME.ui.plotGrid } : { gridcolor: THEME.ui.plotGrid, zeroline: false, automargin: true },
      },
    };
  }

  if (key === 'listeningByHour') {
    const rows = listeningByHour(records);
    const hoursPlayed = rows.map((r) => msToHours(r.value));
    return {
      title: `Listening time by hour of day (${yearStart}-${yearEnd})`,
      data: [{ type: 'bar', x: rows.map((r) => r.hour), y: hoursPlayed, marker: { color: THEME.charts.hour }, hovertemplate: 'Hour %{x}<br>%{y:.2f} h<extra></extra>' }],
      layout: {
        ...baseLayout(`Listening time by hour of day (${yearStart}-${yearEnd})`),
        margin: NO_X_LABEL_MARGIN,
        yaxis: { tickformat: '.2f', ticksuffix: ' h', automargin: true, gridcolor: THEME.ui.plotGrid },
        xaxis: { dtick: 2 },
      },
    };
  }

  if (key === 'listeningByWeekday') {
    const rows = listeningByWeekday(records);
    const hoursPlayed = rows.map((r) => msToHours(r.value));
    return {
      title: `Listening time by weekday (${yearStart}-${yearEnd})`,
      data: [{ type: 'bar', x: rows.map((r) => r.day), y: hoursPlayed, marker: { color: THEME.charts.weekday }, hovertemplate: '%{x}<br>%{y:.2f} h<extra></extra>' }],
      layout: {
        ...baseLayout(`Listening time by weekday (${yearStart}-${yearEnd})`),
        margin: NO_X_LABEL_MARGIN,
        yaxis: { tickformat: '.2f', ticksuffix: ' h', automargin: true, gridcolor: THEME.ui.plotGrid },
      },
    };
  }

  if (key === 'skipRateByYear') {
    const rows = skipRateByYear(records);
    return {
      title: `Skip rate by year (${yearStart}-${yearEnd})`,
      data: [{ type: 'scatter', mode: 'lines+markers', x: rows.map((r) => r.year), y: rows.map((r) => r.value), line: { color: THEME.charts.skip, width: 3 }, hovertemplate: 'Year %{x}<br>%{y:.2f}%<extra></extra>' }],
      layout: {
        ...baseLayout(`Skip rate by year (${yearStart}-${yearEnd})`),
        margin: NO_X_LABEL_MARGIN,
        yaxis: {
          range: [0, Math.max(100, ...rows.map((r) => r.value * 1.1))],
          ticksuffix: '%',
          automargin: true,
          gridcolor: THEME.ui.plotGrid,
        },
      },
    };
  }

  if (key === 'songsCumulative') {
    const rows = cumulativeSongs(records, topN);
    return {
      title: `Top ${topN} songs cumulative listen time (${yearStart}-${yearEnd})`,
      data: rows.map((row, idx) => ({
        type: 'scatter',
        mode: 'lines',
        x: row.points.map((p) => p.x),
        y: row.points.map((p) => msToHours(p.y)),
        name: row.label,
        line: { color: THEME.charts.series[idx % THEME.charts.series.length], width: 2 },
        hovertemplate: '%{fullData.name}<br>%{x}<br>%{y:.2f} h<extra></extra>',
      })),
      layout: {
        ...baseLayout(`Top ${topN} songs cumulative listen time (${yearStart}-${yearEnd})`),
        margin: NO_X_LABEL_MARGIN,
        legend: isMobileLayout
          ? {
              orientation: 'h',
              x: 0,
              xanchor: 'left',
              y: -0.34,
              yanchor: 'top',
              bgcolor: THEME.ui.legendFace,
              bordercolor: THEME.ui.legendEdge,
              borderwidth: 1,
              font: { color: THEME.ui.plotTitle, size: 11 },
            }
          : {
              bgcolor: THEME.ui.legendFace,
              bordercolor: THEME.ui.legendEdge,
              borderwidth: 1,
              font: { color: THEME.ui.plotTitle },
            },
        yaxis: { tickformat: '.2f', ticksuffix: ' h', automargin: true, gridcolor: THEME.ui.plotGrid },
      },
    };
  }

  if (key === 'artistsCumulative') {
    const rows = cumulativeArtists(records, topN);
    return {
      title: `Top ${topN} artists cumulative listen time (${yearStart}-${yearEnd})`,
      data: rows.map((row, idx) => ({
        type: 'scatter',
        mode: 'lines',
        x: row.points.map((p) => p.x),
        y: row.points.map((p) => msToHours(p.y)),
        name: row.label,
        line: { color: THEME.charts.series[idx % THEME.charts.series.length], width: 2 },
        hovertemplate: '%{fullData.name}<br>%{x}<br>%{y:.2f} h<extra></extra>',
      })),
      layout: {
        ...baseLayout(`Top ${topN} artists cumulative listen time (${yearStart}-${yearEnd})`),
        margin: NO_X_LABEL_MARGIN,
        legend: isMobileLayout
          ? {
              orientation: 'h',
              x: 0,
              xanchor: 'left',
              y: -0.34,
              yanchor: 'top',
              bgcolor: THEME.ui.legendFace,
              bordercolor: THEME.ui.legendEdge,
              borderwidth: 1,
              font: { color: THEME.ui.plotTitle, size: 11 },
            }
          : {
              bgcolor: THEME.ui.legendFace,
              bordercolor: THEME.ui.legendEdge,
              borderwidth: 1,
              font: { color: THEME.ui.plotTitle },
            },
        yaxis: { tickformat: '.2f', ticksuffix: ' h', automargin: true, gridcolor: THEME.ui.plotGrid },
      },
    };
  }

  const songs = topSongsByTime(records, topN).map((r) => ({ ...r, value: msToHours(r.value) }));
  const artists = topArtistsByTime(records, topN);
  const artistsHours = artists.map((r) => ({ ...r, value: msToHours(r.value) }));
  const hours = listeningByHour(records).map((r) => ({ ...r, value: msToHours(r.value) }));
  const skip = skipRateByYear(records);

  if (isMobileLayout) {
    const mobileSubplotTitleOffset = 0.006;
    const mobileSubplotTitleFontSize = isNarrowMobileLayout ? 11 : SUBPLOT_LABEL_FONT_SIZE;
    const minInterPlotGap = isNarrowMobileLayout ? 0.085 : 0.08;
    const rowHeight = isNarrowMobileLayout ? 0.145 : 0.15;
    const bottomPad = 0.05;

    const y4Start = bottomPad;
    const y3Start = y4Start + rowHeight + minInterPlotGap;
    const y2Start = y3Start + rowHeight + minInterPlotGap;
    const y1Start = y2Start + rowHeight + minInterPlotGap;

    const mobileDomains = {
      y1: [y1Start, y1Start + rowHeight],
      y2: [y2Start, y2Start + rowHeight],
      y3: [y3Start, y3Start + rowHeight],
      y4: [y4Start, y4Start + rowHeight],
    };

    return {
      title: `Listening Insights Overview (${yearStart}-${yearEnd})`,
      data: [
        {
          type: 'bar',
          orientation: 'h',
          x: [...songs].reverse().map((r) => r.value),
          y: [...songs].reverse().map((r) => r.label),
          marker: { color: THEME.charts.songsTime },
          xaxis: 'x',
          yaxis: 'y',
          text: [...songs].reverse().map((r) => r.label),
          ...narrowBarLabelStyle(THEME.ui.buttonText),
          hovertemplate: '%{y}<br>%{x:.2f} h<extra></extra>',
          showlegend: false,
        },
        {
          type: 'bar',
          orientation: 'h',
          x: [...artistsHours].reverse().map((r) => r.value),
          y: [...artistsHours].reverse().map((r) => r.label),
          marker: { color: THEME.charts.artistsCount },
          xaxis: 'x2',
          yaxis: 'y2',
          text: [...artistsHours].reverse().map((r) => r.label),
          ...narrowBarLabelStyle(THEME.ui.plotTitle),
          hovertemplate: '%{y}<br>%{x:.2f} h<extra></extra>',
          showlegend: false,
        },
        {
          type: 'bar',
          x: hours.map((r) => r.hour),
          y: hours.map((r) => r.value),
          marker: { color: THEME.charts.hour },
          xaxis: 'x3',
          yaxis: 'y3',
          hovertemplate: 'Hour %{x}<br>%{y:.2f} h<extra></extra>',
          showlegend: false,
        },
        {
          type: 'scatter',
          mode: 'lines+markers',
          x: skip.map((r) => r.year),
          y: skip.map((r) => r.value),
          line: { color: THEME.charts.skip, width: 3 },
          xaxis: 'x4',
          yaxis: 'y4',
          hovertemplate: 'Year %{x}<br>%{y:.2f}%<extra></extra>',
          showlegend: false,
        },
      ],
      layout: {
        ...baseLayout(`Listening Insights Overview (${yearStart}-${yearEnd})`),
        title: {
          text: `Listening Insights Overview (${yearStart}-${yearEnd})`,
          x: 0.5,
          xanchor: 'center',
          font: { color: THEME.ui.plotTitle, size: PLOT_TITLE_FONT_SIZE },
          pad: { b: 6 },
        },
        margin: UNIFORM_MARGIN,
        grid: { rows: 4, columns: 1, pattern: 'independent', roworder: 'top to bottom' },
        xaxis: { title: { text: 'Hours', standoff: 2, font: { size: 10, color: THEME.ui.plotTick } }, tickformat: '.2f', tickfont: { size: 9 }, automargin: true, gridcolor: THEME.ui.plotGrid },
        xaxis2: { title: { text: 'Hours', standoff: 2, font: { size: 10, color: THEME.ui.plotTick } }, tickformat: '.2f', tickfont: { size: 9 }, automargin: true, gridcolor: THEME.ui.plotGrid },
        xaxis3: { title: { text: 'Hour of Day', standoff: 2, font: { size: 10, color: THEME.ui.plotTick } }, dtick: 2, tickfont: { size: 9 }, automargin: true, gridcolor: THEME.ui.plotGrid },
        xaxis4: { title: { text: 'Year', standoff: 2, font: { size: 10, color: THEME.ui.plotTick } }, tickfont: { size: 9 }, automargin: true, gridcolor: THEME.ui.plotGrid },
        yaxis: { showticklabels: false, automargin: true, gridcolor: THEME.ui.plotGrid, domain: mobileDomains.y1 },
        yaxis2: { showticklabels: false, automargin: true, gridcolor: THEME.ui.plotGrid, domain: mobileDomains.y2 },
        yaxis3: { tickformat: '.2f', automargin: true, gridcolor: THEME.ui.plotGrid, domain: mobileDomains.y3 },
        yaxis4: { ticksuffix: '%', automargin: true, gridcolor: THEME.ui.plotGrid, domain: mobileDomains.y4 },
        annotations: [
          { text: `Top ${topN} Songs by Time`, x: 0.5, y: mobileDomains.y1[1] + mobileSubplotTitleOffset, xref: 'paper', yref: 'paper', yanchor: 'bottom', showarrow: false, font: { color: THEME.ui.plotTitle, size: mobileSubplotTitleFontSize } },
          { text: `Top ${topN} Artists by Time`, x: 0.5, y: mobileDomains.y2[1] + mobileSubplotTitleOffset, xref: 'paper', yref: 'paper', yanchor: 'bottom', showarrow: false, font: { color: THEME.ui.plotTitle, size: mobileSubplotTitleFontSize } },
          { text: 'Listening by Hour', x: 0.5, y: mobileDomains.y3[1] + mobileSubplotTitleOffset, xref: 'paper', yref: 'paper', yanchor: 'bottom', showarrow: false, font: { color: THEME.ui.plotTitle, size: mobileSubplotTitleFontSize } },
          { text: 'Skip Rate by Year', x: 0.5, y: mobileDomains.y4[1] + mobileSubplotTitleOffset, xref: 'paper', yref: 'paper', yanchor: 'bottom', showarrow: false, font: { color: THEME.ui.plotTitle, size: mobileSubplotTitleFontSize } },
        ],
      },
    };
  }

  return {
    title: `Listening Insights Overview (${yearStart}-${yearEnd})`,
    data: [
      {
        type: 'bar',
        orientation: 'h',
        x: [...songs].reverse().map((r) => r.value),
        y: [...songs].reverse().map((r) => r.label),
        marker: { color: THEME.charts.songsTime },
        xaxis: 'x',
        yaxis: 'y',
        name: 'Top Songs',
        hovertemplate: '%{y}<br>%{x:.2f} h<extra></extra>',
        showlegend: false,
      },
      {
        type: 'bar',
        orientation: 'h',
        x: [...artistsHours].reverse().map((r) => r.value),
        y: [...artistsHours].reverse().map((r) => r.label),
        marker: { color: THEME.charts.artistsCount },
        xaxis: 'x2',
        yaxis: 'y2',
        name: 'Top Artists',
        hovertemplate: '%{y}<br>%{x:.2f} h<extra></extra>',
        showlegend: false,
      },
      {
        type: 'bar',
        x: hours.map((r) => r.hour),
        y: hours.map((r) => r.value),
        marker: { color: THEME.charts.hour },
        xaxis: 'x3',
        yaxis: 'y3',
        hovertemplate: 'Hour %{x}<br>%{y:.2f} h<extra></extra>',
        showlegend: false,
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        x: skip.map((r) => r.year),
        y: skip.map((r) => r.value),
        line: { color: THEME.charts.skip, width: 3 },
        xaxis: 'x4',
        yaxis: 'y4',
        hovertemplate: 'Year %{x}<br>%{y:.2f}%<extra></extra>',
        showlegend: false,
      },
    ],
    layout: {
      ...baseLayout(`Listening Insights Overview (${yearStart}-${yearEnd})`),
      margin: UNIFORM_MARGIN,
      grid: { rows: 2, columns: 2, pattern: 'independent' },
      xaxis: {
        title: { text: 'Hours', standoff: 4, font: { size: 12, color: THEME.ui.plotTick } },
        tickformat: '.2f',
        automargin: true,
        gridcolor: THEME.ui.plotGrid,
      },
      xaxis2: {
        title: { text: 'Hours', standoff: 4, font: { size: 12, color: THEME.ui.plotTick } },
        tickformat: '.2f',
        automargin: true,
        gridcolor: THEME.ui.plotGrid,
      },
      yaxis: { automargin: true, gridcolor: THEME.ui.plotGrid, domain: [0.62, 1.0] },
      yaxis2: { automargin: true, gridcolor: THEME.ui.plotGrid, domain: [0.62, 1.0] },
      yaxis3: { title: 'Hours', tickformat: '.2f', automargin: true, gridcolor: THEME.ui.plotGrid, domain: [0.0, 0.34] },
      yaxis4: { title: 'Skip Rate (%)', ticksuffix: '%', automargin: true, gridcolor: THEME.ui.plotGrid, domain: [0.0, 0.34] },
      annotations: [
        {
          text: `Top ${topN} Songs by Time`,
          x: 0.5,
          y: 1.2,
          xref: 'x domain',
          yref: 'y domain',
          showarrow: false,
          font: { color: THEME.ui.plotTitle, size: SUBPLOT_LABEL_FONT_SIZE },
        },
        {
          text: `Top ${topN} Artists by Time`,
          x: 0.5,
          y: 1.2,
          xref: 'x2 domain',
          yref: 'y2 domain',
          showarrow: false,
          font: { color: THEME.ui.plotTitle, size: SUBPLOT_LABEL_FONT_SIZE },
        },
        {
          text: 'Listening by Hour',
          x: 0.5,
          y: 1.2,
          xref: 'x3 domain',
          yref: 'y3 domain',
          showarrow: false,
          font: { color: THEME.ui.plotTitle, size: SUBPLOT_LABEL_FONT_SIZE },
        },
        {
          text: 'Skip Rate by Year',
          x: 0.5,
          y: 1.2,
          xref: 'x4 domain',
          yref: 'y4 domain',
          showarrow: false,
          font: { color: THEME.ui.plotTitle, size: SUBPLOT_LABEL_FONT_SIZE },
        },
      ],
    },
  };
};

export const labelForChart = (key: ChartKey): string => {
  const labels: Record<ChartKey, string> = {
    topSongsTime: 'Top Songs by Time',
    topSongsCount: 'Top Songs by Count',
    topArtistsTime: 'Top Artists by Time',
    topArtistsCount: 'Top Artists by Count',
    topAlbumsTime: 'Top Albums by Time',
    topAlbumsCount: 'Top Albums by Count',
    songsCumulative: 'Songs Cumulative',
    artistsCumulative: 'Artists Cumulative',
    listeningByHour: 'Listening by Hour',
    listeningByWeekday: 'Listening by Weekday',
    skipRateByYear: 'Skip Rate by Year',
    insightsOverview: 'Insights Overview',
  };
  return labels[key];
};
