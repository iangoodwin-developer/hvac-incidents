import React, { useMemo, useState } from 'react';
import './App.scss';
import {
  getLocalAlarm,
  getLocalAsset,
  getLocalIncidentsByType,
  getLocalSite,
  localEscalationLevels,
  localSkills,
  LocalIncident
} from './localData';

type IncidentsSectionProps = {
  title: string;
  incidents: LocalIncident[];
};

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

const IncidentsSection: React.FC<IncidentsSectionProps> = ({ title, incidents }) => {
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
                const site = getLocalSite(incident.siteId);
                const asset = getLocalAsset(incident.assetId);
                const alarm = getLocalAlarm(incident.alarmId);

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

export function App() {
  const [selectedEscalation, setSelectedEscalation] = useState<string>(localEscalationLevels[0]?.id ?? '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const filteredNew = useMemo(
    () => getLocalIncidentsByType('new', selectedEscalation, selectedSkills),
    [selectedEscalation, selectedSkills]
  );
  const filteredActive = useMemo(
    () => getLocalIncidentsByType('active', selectedEscalation, selectedSkills),
    [selectedEscalation, selectedSkills]
  );
  const filteredObserved = useMemo(
    () => getLocalIncidentsByType('observed', selectedEscalation, selectedSkills),
    [selectedEscalation, selectedSkills]
  );
  const filteredCompleted = useMemo(
    () => getLocalIncidentsByType('completed', selectedEscalation, selectedSkills),
    [selectedEscalation, selectedSkills]
  );

  const handleSkillsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions).map(option => option.value);
    setSelectedSkills(values);
  };

  return (
    <div className='app'>
      <header className='page-header'>
        <div>
          <h1>Incidents</h1>
          <p className='subtitle'>Basic incident overview with local sample data.</p>
        </div>
        <div className='filters'>
          <label>
            Escalation level
            <select value={selectedEscalation} onChange={event => setSelectedEscalation(event.target.value)}>
              {localEscalationLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Skills
            <select multiple value={selectedSkills} onChange={handleSkillsChange}>
              {localSkills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
            <span className='hint'>Hold Ctrl/Cmd to select multiple.</span>
          </label>
        </div>
      </header>

      <main>
        <IncidentsSection title='New incidents' incidents={filteredNew} />
        <IncidentsSection title='Active incidents' incidents={filteredActive} />
        <IncidentsSection title='Observed incidents' incidents={filteredObserved} />
        <IncidentsSection title='Completed incidents' incidents={filteredCompleted} />
      </main>
    </div>
  );
}
