// Integration-style test that validates hash routing without touching WebSocket logic.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppRouter } from '../AppRouter';

jest.mock('../useIncidentSocket', () => ({
  useIncidentSocket: () => ({
    incidents: [
      {
        incidentId: 'inc-1',
        siteId: 'site-1',
        assetId: 'asset-1',
        alarmId: 'alarm-1',
        priority: 1,
        occurrences: 1,
        createdAt: new Date().toISOString(),
        stateId: 'OPEN',
        escalationLevelId: 'esc-1'
      }
    ],
    catalog: {
      escalationLevels: [{ id: 'esc-1', name: 'Level 1' }],
      incidentTypes: [{ id: 'type-a', name: 'Electrical' }],
      sites: [{ id: 'site-1', name: 'Test Site' }],
      assets: [{ id: 'asset-1', siteId: 'site-1', displayName: 'Asset 1', model: 'Model', regionName: 'Region' }],
      alarms: [{ alarmId: 'alarm-1', code: 'AL-1', description: 'Alarm' }]
    },
    connectionStatus: 'connected',
    sendIncident: jest.fn(),
    updateIncident: jest.fn()
  })
}));

describe('AppRouter', () => {
  it('renders the incident detail view when the hash matches a detail route', () => {
    // Set the hash before rendering to simulate direct navigation.
    window.location.hash = '#/incident/inc-1';

    render(<AppRouter />);

    expect(screen.getByText('Incident detail')).toBeInTheDocument();
    expect(screen.getByText('inc-1')).toBeInTheDocument();
  });
});
