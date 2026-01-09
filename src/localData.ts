export type LocalEscalationLevel = { id: string; name: string };
export type LocalSkill = { id: string; name: string };
export type LocalSite = { id: string; name: string };
export type LocalAsset = { id: string; siteId: string; displayName: string; model: string; regionName: string };
export type LocalAlarm = { alarmId: string; code: string; description: string; legacyId?: string };
export type LocalIncident = {
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

export const incidentStateIds = {
  OPEN: 'OPEN',
  OBSERVED: 'OBSERVED',
  CLOSED: 'CLOSED'
} as const;

export const localEscalationLevels: LocalEscalationLevel[] = [
  { id: 'esc-1', name: 'Level 1' },
  { id: 'esc-2', name: 'Level 2' }
];

export const localSkills: LocalSkill[] = [
  { id: 'skill-elec', name: 'Electrical' },
  { id: 'skill-mech', name: 'Cooling' },
  { id: 'skill-scada', name: 'Controls' },
  { id: 'skill-ops', name: 'Facilities' }
];

export const localSites: LocalSite[] = [
  { id: 'site-1', name: 'North Campus Plant' },
  { id: 'site-2', name: 'Harbor District Facility' }
];

export const localAssets: LocalAsset[] = [
  { id: 'asset-1', siteId: 'site-1', displayName: 'Chiller CH-11', model: 'Trane RTAC 250', regionName: 'Mechanical Room 3' },
  { id: 'asset-2', siteId: 'site-1', displayName: 'AHU AH-19', model: 'Carrier 39HQ', regionName: 'Roof Zone 2' },
  { id: 'asset-3', siteId: 'site-2', displayName: 'Boiler BL-03', model: 'Cleaver-Brooks CB-500', regionName: 'Basement Plant 5' },
  { id: 'asset-4', siteId: 'site-2', displayName: 'Cooling Tower CT-21', model: 'BAC FXV', regionName: 'South Yard 1' }
];

export const localAlarms: LocalAlarm[] = [
  { alarmId: 'alarm-100', code: 'HV-100', description: 'High condenser pressure', legacyId: '100' },
  { alarmId: 'alarm-220', code: 'HV-220', description: 'Supply air temp deviation', legacyId: '220' },
  { alarmId: 'alarm-310', code: 'HV-310', description: 'Boiler flame failure', legacyId: '310' },
  { alarmId: 'alarm-420', code: 'HV-420', description: 'BAS comms loss', legacyId: '420' }
];

export const localIncidents: LocalIncident[] = [
  {
    incidentId: 'inc-1001',
    siteId: 'site-1',
    assetId: 'asset-1',
    alarmId: 'alarm-100',
    priority: 1,
    occurrences: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    stateId: incidentStateIds.OPEN,
    escalationLevelId: 'esc-1',
    lvl1SkillId: 'skill-elec'
  },
  {
    incidentId: 'inc-1002',
    siteId: 'site-2',
    assetId: 'asset-3',
    alarmId: 'alarm-310',
    priority: 2,
    occurrences: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    assignedTo: 'user-2',
    stateId: incidentStateIds.OPEN,
    escalationLevelId: 'esc-1',
    lvl1SkillId: 'skill-mech'
  },
  {
    incidentId: 'inc-1003',
    siteId: 'site-2',
    assetId: 'asset-4',
    alarmId: 'alarm-420',
    priority: 3,
    occurrences: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    assignedTo: 'user-1',
    stateId: incidentStateIds.OBSERVED,
    escalationLevelId: 'esc-2',
    lvl2SkillId: 'skill-scada'
  },
  {
    incidentId: 'inc-1004',
    siteId: 'site-1',
    assetId: 'asset-2',
    alarmId: 'alarm-220',
    priority: 1,
    occurrences: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    assignedTo: 'user-1',
    stateId: incidentStateIds.CLOSED,
    escalationLevelId: 'esc-2',
    lvl2SkillId: 'skill-ops'
  }
];

export function getLocalIncidentsByType(
  type: 'new' | 'active' | 'observed' | 'completed',
  escalationLevelId?: string,
  skillsIds?: string[]
): LocalIncident[] {
  const matchesFilter = (incident: LocalIncident) => {
    if (escalationLevelId && incident.escalationLevelId !== escalationLevelId) {
      return false;
    }
    if (skillsIds?.length) {
      const matchesSkill = skillsIds.includes(incident.lvl1SkillId ?? '') || skillsIds.includes(incident.lvl2SkillId ?? '');
      if (!matchesSkill) {
        return false;
      }
    }
    return true;
  };

  return localIncidents.filter(incident => {
    if (!matchesFilter(incident)) {
      return false;
    }
    if (type === 'new') {
      return incident.stateId === incidentStateIds.OPEN && !incident.assignedTo;
    }
    if (type === 'active') {
      return incident.stateId === incidentStateIds.OPEN && !!incident.assignedTo;
    }
    if (type === 'observed') {
      return incident.stateId === incidentStateIds.OBSERVED;
    }
    return incident.stateId === incidentStateIds.CLOSED;
  });
}

export function getLocalAlarm(alarmId: string): LocalAlarm | undefined {
  return localAlarms.find(alarm => alarm.alarmId === alarmId);
}

export function getLocalAsset(assetId: string): LocalAsset | undefined {
  return localAssets.find(asset => asset.id === assetId);
}

export function getLocalSite(siteId: string): LocalSite | undefined {
  return localSites.find(site => site.id === siteId);
}
