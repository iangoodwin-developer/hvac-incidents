export const INCIDENT_STATES = {
  OPEN: 'OPEN',
  OBSERVED: 'OBSERVED',
  CLOSED: 'CLOSED'
} as const;

export type IncidentState = typeof INCIDENT_STATES[keyof typeof INCIDENT_STATES];

export const INCIDENT_STATE_OPTIONS: { id: IncidentState; label: string }[] = [
  { id: INCIDENT_STATES.OPEN, label: 'Open' },
  { id: INCIDENT_STATES.OBSERVED, label: 'Observed' },
  { id: INCIDENT_STATES.CLOSED, label: 'Closed' }
];
