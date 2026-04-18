/// <reference lib="webworker" />

import { buildChart } from './charts';
import { ChartKey, TimeframeRecord } from './types';

type BuildChartWorkerRequest = {
  id: number;
  type: 'build-chart';
  key: ChartKey;
  timeframe: TimeframeRecord[];
  startDate: string;
  endDate: string;
  topN: number;
  frequencyWindowDays: number;
  frequencyWindowLabel: string;
  isMobileLayout: boolean;
  isNarrowMobileLayout: boolean;
};

type BuildChartWorkerSuccess = {
  id: number;
  type: 'build-chart-result';
  data: any[];
  layout: any;
};

type BuildChartWorkerError = {
  id: number;
  type: 'build-chart-error';
  error: string;
};

self.onmessage = (event: MessageEvent<BuildChartWorkerRequest>) => {
  const message = event.data;
  if (message.type !== 'build-chart') return;

  try {
    const spec = buildChart(
      message.key,
      message.timeframe,
      message.startDate,
      message.endDate,
      message.topN,
      message.frequencyWindowDays,
      message.frequencyWindowLabel,
      message.isMobileLayout,
      message.isNarrowMobileLayout,
    );

    const response: BuildChartWorkerSuccess = {
      id: message.id,
      type: 'build-chart-result',
      data: spec.data,
      layout: spec.layout,
    };
    self.postMessage(response);
  } catch (error) {
    const response: BuildChartWorkerError = {
      id: message.id,
      type: 'build-chart-error',
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
