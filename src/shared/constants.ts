// Shared constants that describe incident states and labels.
// Keeping this here avoids scattering magic strings across the UI.

export const INCIDENT_STATES = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export type IncidentState = (typeof INCIDENT_STATES)[keyof typeof INCIDENT_STATES];

export const INCIDENT_STATE_OPTIONS: { id: IncidentState; label: string }[] = [
  { id: INCIDENT_STATES.OPEN, label: 'Open' },
  { id: INCIDENT_STATES.CLOSED, label: 'Closed' },
];
