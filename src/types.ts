export type EscalationLevel = { id: string; name: string };
export type Skill = { id: string; name: string };
export type Site = { id: string; name: string };
export type Asset = { id: string; siteId: string; displayName: string; model: string; regionName: string };
export type Alarm = { alarmId: string; code: string; description: string; legacyId?: string };

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
};

export type Catalog = {
  escalationLevels: EscalationLevel[];
  skills: Skill[];
  sites: Site[];
  assets: Asset[];
  alarms: Alarm[];
};
