// Centralized TypeScript types that are shared across the app.
// Keeping them in one place makes it easier to reason about the data
// contracts between the UI and the WebSocket server.

export type EscalationLevel = { id: string; name: string };
export type Skill = { id: string; name: string };
export type Site = { id: string; name: string };
export type Asset = { id: string; siteId: string; displayName: string; model: string; regionName: string };
export type Alarm = { alarmId: string; code: string; description: string; legacyId?: string };

// A single time-series data point for an incident.
// This is intentionally small so it can be streamed frequently.
export type IncidentReading = {
  timestamp: string;
  temperature: number;
  pressure: number;
};

export type Incident = {
  incidentId: string;
  siteId: string;
  assetId: string;
  alarmId: string;
  priority: number;
  occurrences: number;
  createdAt: string;
  updatedAt?: string;
  assignedTo?: string | null;
  stateId: string;
  escalationLevelId: string;
  lvl1SkillId?: string;
  lvl2SkillId?: string;
  readings?: IncidentReading[];
};

export type Catalog = {
  escalationLevels: EscalationLevel[];
  skills: Skill[];
  sites: Site[];
  assets: Asset[];
  alarms: Alarm[];
};
