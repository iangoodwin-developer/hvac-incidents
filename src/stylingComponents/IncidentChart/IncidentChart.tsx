// Presentational chart component for a single incident's readings.
// Uses simple div bars to avoid external charting dependencies.

import React, { useMemo } from 'react';
import { IncidentReading } from '../../types';

type IncidentChartProps = {
  readings: IncidentReading[];
};

// Calculate the latest value trend so we can color and label the UI.
const getTrend = (readings: IncidentReading[]) => {
  const last = readings[readings.length - 1];
  const previous = readings[readings.length - 2];

  if (!last) {
    return { label: 'N/A', symbol: '-', status: 'steady' as const };
  }
  if (!previous) {
    return { label: `${last.temperature.toFixed(1)} F`, symbol: '-', status: 'steady' as const };
  }

  const delta = last.temperature - previous.temperature;
  if (delta > 0.2) {
    return { label: `${last.temperature.toFixed(1)} F`, symbol: '^', status: 'rising' as const };
  }
  if (delta < -0.2) {
    return { label: `${last.temperature.toFixed(1)} F`, symbol: 'v', status: 'falling' as const };
  }

  return { label: `${last.temperature.toFixed(1)} F`, symbol: '-', status: 'steady' as const };
};

export const IncidentChart: React.FC<IncidentChartProps> = ({ readings }) => {
  // Compute trend state once per render.
  const trend = getTrend(readings);

  const bars = useMemo(() => {
    // Normalize bar heights so the visual scale adjusts to the data range.
    if (readings.length === 0) {
      return [];
    }
    const temperatures = readings.map(item => item.temperature);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const range = Math.max(max - min, 1);

    return readings.map(item => ({
      id: item.timestamp,
      height: ((item.temperature - min) / range) * 100
    }));
  }, [readings]);

  return (
    <section className='incident-chart'>
      <header className='incident-chart__header'>
        <h3 className='incident-chart__title'>Live temperature</h3>
        <div className='incident-chart__value'>
          <span className={`incident-chart__value-number incident-chart__value-number--${trend.status}`}>
            {trend.label}
          </span>
          <span className='incident-chart__value-arrow'>{trend.symbol}</span>
        </div>
      </header>
      {bars.length === 0 ? (
        <p className='incident-chart__empty'>No readings yet.</p>
      ) : (
        <div className='incident-chart__bars'>
          {bars.map(bar => (
            <div key={bar.id} className='incident-chart__bar' style={{ height: `${bar.height}%` }} />
          ))}
        </div>
      )}
      <p className='incident-chart__caption'>Updates stream in real time via WebSocket.</p>
    </section>
  );
};
