import { DateTime } from 'luxon';
import { TimezoneOption } from './types';
import { THEME } from './theme';

const formatOffset = (offsetMinutes: number): string => {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (abs % 60).toString().padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
};

export const buildTimezoneOptions = (): TimezoneOption[] => {
  const localOffset = DateTime.now().offset;
  const localOption: TimezoneOption = {
    label: `${THEME.timezone.localLabel} (${formatOffset(localOffset)})`,
    value: THEME.timezone.localValue,
  };

  const base: TimezoneOption[] = [localOption, { label: 'UTC (UTC+00:00)', value: 'UTC' }];

  let names: string[] = ['UTC'];
  try {
    if ((Intl as any).supportedValuesOf) {
      names = (Intl as any).supportedValuesOf('timeZone') as string[];
    }
  } catch {
    names = ['UTC'];
  }

  const rows = names
    .filter((name) => name !== 'UTC')
    .map((name) => {
      const zoned = DateTime.now().setZone(name);
      const offset = Number.isFinite(zoned.offset) ? zoned.offset : 0;
      return {
        sortOffset: offset,
        name,
        label: `${formatOffset(offset)} - ${name}`,
      };
    })
    .sort((a, b) => (a.sortOffset === b.sortOffset ? a.name.localeCompare(b.name) : a.sortOffset - b.sortOffset));

  return [...base, ...rows.map((row) => ({ label: row.label, value: row.name }))];
};
