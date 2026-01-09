// Main incidents list page with filters and drag-and-drop movement.

import React, { useEffect, useMemo, useState } from 'react';
import { INCIDENT_STATES } from '../constants';
import { Catalog, Incident } from '../types';
import { PageHeader } from '../stylingComponents/PageHeader/PageHeader';
import { IncidentsSection } from '../stylingComponents/IncidentsSection/IncidentsSection';
import { ConnectionStatus } from './useIncidentSocket';

// Filter incidents based on status bucket plus user-selected filters.
const getIncidentsByType = (
  incidents: Incident[],
  type: 'new' | 'active' | 'completed',
  escalationLevelId?: string,
  skillsIds?: string[]
) => {
  // First layer of filtering: global filter controls.
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

  // Second layer: map incident to the correct list by status.
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
    return incident.stateId === INCIDENT_STATES.CLOSED;
  });
};

type IncidentsPageProps = {
  incidents: Incident[];
  catalog: Catalog;
  connectionStatus: ConnectionStatus;
  updateIncident: (incident: Incident) => void;
};

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ incidents, catalog, connectionStatus, updateIncident }) => {
  // Keep track of the currently selected filters in local state.
  const [selectedEscalation, setSelectedEscalation] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    // Default the escalation filter to the first known level.
    if (!selectedEscalation && catalog.escalationLevels[0]) {
      setSelectedEscalation(catalog.escalationLevels[0].id);
    }
  }, [catalog.escalationLevels, selectedEscalation]);

  // Precompute each list to keep rendering fast and predictable.
  const filteredNew = useMemo(
    () => getIncidentsByType(incidents, 'new', selectedEscalation, selectedSkills),
    [incidents, selectedEscalation, selectedSkills]
  );
  const filteredActive = useMemo(
    () => getIncidentsByType(incidents, 'active', selectedEscalation, selectedSkills),
    [incidents, selectedEscalation, selectedSkills]
  );
  const filteredCompleted = useMemo(
    () => getIncidentsByType(incidents, 'completed', selectedEscalation, selectedSkills),
    [incidents, selectedEscalation, selectedSkills]
  );

  const handleSkillsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Multi-select returns a list of options, so we map them into ids.
    const values = Array.from(event.target.selectedOptions).map(option => option.value);
    setSelectedSkills(values);
  };

  const handleDrop = (target: 'new' | 'active' | 'completed', incidentId: string) => {
    // Update state locally and send the change over WebSocket.
    // The "active" column is modeled as OPEN + assignedTo.
    const incident = incidents.find(item => item.incidentId === incidentId);
    if (!incident) {
      return;
    }

    const updated: Incident = {
      ...incident,
      stateId: target === 'completed' ? INCIDENT_STATES.CLOSED : INCIDENT_STATES.OPEN,
      assignedTo: target === 'new' ? null : incident.assignedTo ?? 'user-1'
    };

    updateIncident(updated);
  };

  const handleDragStart = (incidentId: string, event: React.DragEvent<HTMLTableRowElement>) => {
    // Store the incident id in the drag payload so the target list can read it.
    event.dataTransfer.setData('text/plain', incidentId);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className='incidents-page'>
      <PageHeader
        title='Incidents'
        subtitle='Basic incident overview with live updates.'
        statusLabel={`WebSocket: ${connectionStatus}`}
      >
        <div className='incidents-page__filters'>
          <label className='incidents-page__field'>
            <span className='incidents-page__label'>Escalation level</span>
            <select value={selectedEscalation} onChange={event => setSelectedEscalation(event.target.value)}>
              {catalog.escalationLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label className='incidents-page__field'>
            <span className='incidents-page__label'>Skills</span>
            <select multiple value={selectedSkills} onChange={handleSkillsChange}>
              {catalog.skills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
            <span className='incidents-page__hint'>Hold Ctrl/Cmd to select multiple.</span>
          </label>
          <nav className='incidents-page__nav'>
            <a href='#/create'>Create incident</a>
          </nav>
        </div>
      </PageHeader>

      <main className='incidents-page__content'>
        <IncidentsSection
          title='New incidents'
          incidents={filteredNew}
          sites={catalog.sites}
          assets={catalog.assets}
          alarms={catalog.alarms}
          onDropIncident={id => handleDrop('new', id)}
          onDragStart={handleDragStart}
        />
        <IncidentsSection
          title='Active incidents'
          incidents={filteredActive}
          sites={catalog.sites}
          assets={catalog.assets}
          alarms={catalog.alarms}
          onDropIncident={id => handleDrop('active', id)}
          onDragStart={handleDragStart}
        />
        <IncidentsSection
          title='Completed incidents'
          incidents={filteredCompleted}
          sites={catalog.sites}
          assets={catalog.assets}
          alarms={catalog.alarms}
          onDropIncident={id => handleDrop('completed', id)}
          onDragStart={handleDragStart}
        />
      </main>
    </div>
  );
};
