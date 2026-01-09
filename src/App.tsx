import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.scss';
import { INCIDENT_STATE_OPTIONS, INCIDENT_STATES, IncidentState } from './constants';
import { Alarm, Asset, Catalog, EscalationLevel, Incident, Site, Skill } from './types';

type IncidentsSectionProps = {
  title: string;
  incidents: Incident[];
};

type IncidentFormState = {
  incidentId: string;
  siteId: string;
  assetId: string;
  alarmId: string;
  priority: number;
  occurrences: number;
  stateId: IncidentState;
  escalationLevelId: string;
  skillId: string;
};

type IncidentFilterType = 'new' | 'active' | 'observed' | 'completed';

type ServerPayload = {
  type?: string;
  incidents?: Incident[];
  incident?: Incident;
  catalog?: Catalog;
};

const emptyCatalog: Catalog = {
  escalationLevels: [],
  skills: [],
  sites: [],
  assets: [],
  alarms: []
};

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

const getIncidentsByType = (
  incidents: Incident[],
  type: IncidentFilterType,
  escalationLevelId?: string,
  skillsIds?: string[]
) => {
  const matchesFilter = (incident: Incident) => {
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

  return incidents.filter(incident => {
    if (!matchesFilter(incident)) {
      return false;
    }
    if (type === 'new') {
      return incident.stateId === INCIDENT_STATES.OPEN && !incident.assignedTo;
    }
    if (type === 'active') {
      return incident.stateId === INCIDENT_STATES.OPEN && !!incident.assignedTo;
    }
    if (type === 'observed') {
      return incident.stateId === INCIDENT_STATES.OBSERVED;
    }
    return incident.stateId === INCIDENT_STATES.CLOSED;
  });
};

const IncidentsSection: React.FC<
  IncidentsSectionProps & {
    sites: Site[];
    assets: Asset[];
    alarms: Alarm[];
  }
> = ({ title, incidents, sites, assets, alarms }) => {
  const siteMap = useMemo(() => new Map(sites.map(site => [site.id, site])), [sites]);
  const assetMap = useMemo(() => new Map(assets.map(asset => [asset.id, asset])), [assets]);
  const alarmMap = useMemo(() => new Map(alarms.map(alarm => [alarm.alarmId, alarm])), [alarms]);

  return (
    <section className='incidents-section'>
      <h2>{title}</h2>
      {incidents.length === 0 ? (
        <p className='empty-state'>No incidents found.</p>
      ) : (
        <div className='table-wrapper'>
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Site</th>
                <th>Asset</th>
                <th>Alarm</th>
                <th>Occurrences</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(incident => {
                const site = siteMap.get(incident.siteId);
                const asset = assetMap.get(incident.assetId);
                const alarm = alarmMap.get(incident.alarmId);

                return (
                  <tr key={incident.incidentId}>
                    <td>{incident.priority}</td>
                    <td>{site?.name ?? 'Unknown'}</td>
                    <td>{asset?.displayName ?? 'Unknown'}</td>
                    <td>
                      {alarm?.code ?? 'Unknown'}
                      <span className='muted'> {alarm?.description ?? ''}</span>
                    </td>
                    <td>{incident.occurrences}</td>
                    <td>{incident.stateId}</td>
                    <td>{formatTimestamp(incident.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const getViewFromHash = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('/create')) {
    return 'create';
  }
  return 'list';
};

export function App() {
  const [view, setView] = useState<'list' | 'create'>(getViewFromHash());
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [selectedEscalation, setSelectedEscalation] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const [formState, setFormState] = useState<IncidentFormState>({
    incidentId: '',
    siteId: '',
    assetId: '',
    alarmId: '',
    priority: 1,
    occurrences: 1,
    stateId: INCIDENT_STATES.OPEN,
    escalationLevelId: '',
    skillId: ''
  });

  useEffect(() => {
    const handleHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnectionStatus('connected');
    });

    socket.addEventListener('close', () => {
      setConnectionStatus('disconnected');
    });

    socket.addEventListener('message', event => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch (error) {
        return;
      }

      const payload = parsed as ServerPayload | undefined;
      if (!payload || !payload.type) {
        return;
      }

      if (payload.type === 'init') {
        if (payload.incidents) {
          setIncidents(payload.incidents);
        }
        if (payload.catalog) {
          setCatalog(payload.catalog);
        }
      }

      if (payload.type === 'incidentAdded') {
        const incident = payload.incident;
        if (!incident) {
          return;
        }
        setIncidents(prev => [incident, ...prev]);
      }
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!selectedEscalation && catalog.escalationLevels[0]) {
      setSelectedEscalation(catalog.escalationLevels[0].id);
    }
  }, [catalog.escalationLevels, selectedEscalation]);

  useEffect(() => {
    if (!catalog.escalationLevels.length && !catalog.skills.length && !catalog.sites.length && !catalog.assets.length && !catalog.alarms.length) {
      return;
    }

    setFormState(prev => {
      const next = {
        ...prev,
        siteId: prev.siteId || catalog.sites[0]?.id || '',
        assetId: prev.assetId || catalog.assets[0]?.id || '',
        alarmId: prev.alarmId || catalog.alarms[0]?.alarmId || '',
        escalationLevelId: prev.escalationLevelId || catalog.escalationLevels[0]?.id || '',
        skillId: prev.skillId || catalog.skills[0]?.id || ''
      };

      const unchanged =
        next.siteId === prev.siteId &&
        next.assetId === prev.assetId &&
        next.alarmId === prev.alarmId &&
        next.escalationLevelId === prev.escalationLevelId &&
        next.skillId === prev.skillId;

      return unchanged ? prev : next;
    });
  }, [catalog]);

  const filteredNew = useMemo(
    () => getIncidentsByType(incidents, 'new', selectedEscalation, selectedSkills),
    [incidents, selectedEscalation, selectedSkills]
  );
  const filteredActive = useMemo(
    () => getIncidentsByType(incidents, 'active', selectedEscalation, selectedSkills),
    [incidents, selectedEscalation, selectedSkills]
  );
  const filteredObserved = useMemo(
    () => getIncidentsByType(incidents, 'observed', selectedEscalation, selectedSkills),
    [incidents, selectedEscalation, selectedSkills]
  );
  const filteredCompleted = useMemo(
    () => getIncidentsByType(incidents, 'completed', selectedEscalation, selectedSkills),
    [incidents, selectedEscalation, selectedSkills]
  );

  const handleSkillsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions).map(option => option.value);
    setSelectedSkills(values);
  };

  const handleFormChange = (field: keyof IncidentFormState, value: string) => {
    setFormState(prev => {
      if (field === 'priority' || field === 'occurrences') {
        return { ...prev, [field]: Number(value) };
      }
      return { ...prev, [field]: value };
    });
  };

  const submitIncident = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const incidentId = formState.incidentId.trim() || `inc-${Date.now()}`;
    const newIncident: Incident = {
      incidentId,
      siteId: formState.siteId,
      assetId: formState.assetId,
      alarmId: formState.alarmId,
      priority: formState.priority,
      occurrences: formState.occurrences,
      createdAt: new Date().toISOString(),
      stateId: formState.stateId,
      escalationLevelId: formState.escalationLevelId,
      lvl1SkillId: formState.skillId
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'addIncident', incident: newIncident }));
    }

    setFormState(prev => ({
      ...prev,
      incidentId: '',
      priority: 1,
      occurrences: 1
    }));
  };

  return (
    <div className='app'>
      <header className='page-header'>
        <div>
          <h1>Incidents</h1>
          <p className='subtitle'>Basic incident overview with live updates.</p>
          <p className='status'>WebSocket: {connectionStatus}</p>
        </div>
        <div className='filters'>
          <label>
            Escalation level
            <select value={selectedEscalation} onChange={event => setSelectedEscalation(event.target.value)}>
              {catalog.escalationLevels.map((level: EscalationLevel) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Skills
            <select multiple value={selectedSkills} onChange={handleSkillsChange}>
              {catalog.skills.map((skill: Skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
            <span className='hint'>Hold Ctrl/Cmd to select multiple.</span>
          </label>
          <div className='nav-links'>
            <a href='#/'>Incidents list</a>
            <a href='#/create'>Create incident</a>
          </div>
        </div>
      </header>

      <main>
        {view === 'create' ? (
          <section className='create-section'>
            <h2>Create incident</h2>
            <form onSubmit={submitIncident} className='incident-form'>
              <label>
                Incident ID (optional)
                <input
                  type='text'
                  value={formState.incidentId}
                  onChange={event => handleFormChange('incidentId', event.target.value)}
                />
              </label>
              <label>
                Site
                <select value={formState.siteId} onChange={event => handleFormChange('siteId', event.target.value)}>
                  {catalog.sites.map((site: Site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Asset
                <select value={formState.assetId} onChange={event => handleFormChange('assetId', event.target.value)}>
                  {catalog.assets.map((asset: Asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Alarm
                <select value={formState.alarmId} onChange={event => handleFormChange('alarmId', event.target.value)}>
                  {catalog.alarms.map((alarm: Alarm) => (
                    <option key={alarm.alarmId} value={alarm.alarmId}>
                      {alarm.code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <input
                  type='number'
                  min={1}
                  max={5}
                  value={formState.priority}
                  onChange={event => handleFormChange('priority', event.target.value)}
                />
              </label>
              <label>
                Occurrences
                <input
                  type='number'
                  min={1}
                  value={formState.occurrences}
                  onChange={event => handleFormChange('occurrences', event.target.value)}
                />
              </label>
              <label>
                State
                <select value={formState.stateId} onChange={event => handleFormChange('stateId', event.target.value)}>
                  {INCIDENT_STATE_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Escalation level
                <select
                  value={formState.escalationLevelId}
                  onChange={event => handleFormChange('escalationLevelId', event.target.value)}
                >
                  {catalog.escalationLevels.map((level: EscalationLevel) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Skill
                <select value={formState.skillId} onChange={event => handleFormChange('skillId', event.target.value)}>
                  {catalog.skills.map((skill: Skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type='submit'>Send incident</button>
            </form>
          </section>
        ) : (
          <>
            <IncidentsSection
              title='New incidents'
              incidents={filteredNew}
              sites={catalog.sites}
              assets={catalog.assets}
              alarms={catalog.alarms}
            />
            <IncidentsSection
              title='Active incidents'
              incidents={filteredActive}
              sites={catalog.sites}
              assets={catalog.assets}
              alarms={catalog.alarms}
            />
            <IncidentsSection
              title='Observed incidents'
              incidents={filteredObserved}
              sites={catalog.sites}
              assets={catalog.assets}
              alarms={catalog.alarms}
            />
            <IncidentsSection
              title='Completed incidents'
              incidents={filteredCompleted}
              sites={catalog.sites}
              assets={catalog.assets}
              alarms={catalog.alarms}
            />
          </>
        )}
      </main>
    </div>
  );
}
