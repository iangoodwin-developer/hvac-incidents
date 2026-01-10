// Main incidents list page with filters and drag-and-drop movement.

import React, { useEffect, useMemo, useState } from 'react';
import { INCIDENT_STATES } from '../../../shared/constants';
import { Catalog, Incident } from '../../../shared/types';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { IncidentsSection } from '../components/IncidentsSection/IncidentsSection';
import { ConnectionBanner } from '../../../shared/components/ConnectionBanner/ConnectionBanner';
import { ConnectionStatus } from '../hooks/useIncidentSocket';
import { getIncidentsByType } from '../logic/incidentFilters';

type IncidentsPageProps = {
  incidents: Incident[];
  catalog: Catalog;
  connectionStatus: ConnectionStatus;
  updateIncident: (incident: Incident) => void;
  lastError: string | null;
};

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  incidents,
  catalog,
  connectionStatus,
  updateIncident,
  lastError,
}) => {
  // Keep track of the currently selected filters in local state.
  const [selectedEscalation, setSelectedEscalation] = useState<string>('');
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>([]);
  // When connected but catalog is still empty, show a simple loading state.
  const isLoading = connectionStatus === 'connected' && catalog.escalationLevels.length === 0;

  useEffect(() => {
    // Default the escalation filter to the first known level.
    if (!selectedEscalation && catalog.escalationLevels[0]) {
      setSelectedEscalation(catalog.escalationLevels[0].id);
    }
  }, [catalog.escalationLevels, selectedEscalation]);

  // Precompute each list to keep rendering fast and predictable.
  const filteredNew = useMemo(
    () => getIncidentsByType(incidents, 'new', selectedEscalation, selectedIncidentTypes),
    [incidents, selectedEscalation, selectedIncidentTypes]
  );
  const filteredActive = useMemo(
    () => getIncidentsByType(incidents, 'active', selectedEscalation, selectedIncidentTypes),
    [incidents, selectedEscalation, selectedIncidentTypes]
  );
  const filteredCompleted = useMemo(
    () => getIncidentsByType(incidents, 'completed', selectedEscalation, selectedIncidentTypes),
    [incidents, selectedEscalation, selectedIncidentTypes]
  );

  const handleIncidentTypeToggle = (typeId: string) => {
    // Toggle incident types via checkboxes for easier selection.
    setSelectedIncidentTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const handleDrop = (target: 'new' | 'active' | 'completed', incidentId: string) => {
    // Update state locally and send the change over WebSocket.
    // The "active" column is modeled as OPEN + assignedTo.
    const incident = incidents.find((item) => item.incidentId === incidentId);
    if (!incident) {
      return;
    }

    const updated: Incident = {
      ...incident,
      stateId: target === 'completed' ? INCIDENT_STATES.CLOSED : INCIDENT_STATES.OPEN,
      assignedTo: target === 'new' ? null : (incident.assignedTo ?? 'user-1'),
    };

    updateIncident(updated);
  };

  const handleMove = (incidentId: string, target: 'new' | 'active' | 'completed') => {
    // Buttons reuse the same handler as drag-and-drop for consistency.
    handleDrop(target, incidentId);
  };

  const handleDragStart = (incidentId: string, event: React.DragEvent<HTMLTableRowElement>) => {
    // Store the incident id in the drag payload so the target list can read it.
    event.dataTransfer.setData('text/plain', incidentId);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="incidents-page">
      <PageHeader
        title="Incidents"
        subtitle="Basic incident overview with live updates."
        statusLabel={`WebSocket: ${connectionStatus}`}
      >
        <div className="incidents-page__filters">
          <label className="incidents-page__field">
            <span className="incidents-page__label">Escalation level</span>
            <select
              value={selectedEscalation}
              onChange={(event) => setSelectedEscalation(event.target.value)}
            >
              {(catalog.escalationLevels ?? []).map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <div className="incidents-page__field">
            <span className="incidents-page__label">Incident types</span>
            <div className="incidents-page__checkboxes">
              {(catalog.incidentTypes ?? []).map((type) => (
                <label key={type.id} className="incidents-page__checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIncidentTypes.includes(type.id)}
                    onChange={() => handleIncidentTypeToggle(type.id)}
                  />
                  <span>{type.name}</span>
                </label>
              ))}
            </div>
          </div>
          <nav className="incidents-page__nav">
            <a href="#/create">Create incident</a>
          </nav>
        </div>
      </PageHeader>

      <ConnectionBanner status={connectionStatus} />
      {lastError ? (
        <div className="app-error" role="alert">
          {lastError}
        </div>
      ) : null}

      {isLoading ? (
        <p className="incidents-page__loading">Loading incidents...</p>
      ) : (
        <main className="incidents-page__content">
          <IncidentsSection
            title="New incidents"
            incidents={filteredNew}
            sites={catalog.sites}
            assets={catalog.assets}
            alarms={catalog.alarms}
            onDropIncident={(id) => handleDrop('new', id)}
            onDragStart={handleDragStart}
            onMoveIncident={handleMove}
            actions={[
              { label: 'Move to Active', target: 'active' },
              { label: 'Move to Completed', target: 'completed' },
            ]}
          />
          <IncidentsSection
            title="Active incidents"
            incidents={filteredActive}
            sites={catalog.sites}
            assets={catalog.assets}
            alarms={catalog.alarms}
            onDropIncident={(id) => handleDrop('active', id)}
            onDragStart={handleDragStart}
            onMoveIncident={handleMove}
            actions={[
              { label: 'Move to New', target: 'new' },
              { label: 'Move to Completed', target: 'completed' },
            ]}
          />
          <IncidentsSection
            title="Completed incidents"
            incidents={filteredCompleted}
            sites={catalog.sites}
            assets={catalog.assets}
            alarms={catalog.alarms}
            onDropIncident={(id) => handleDrop('completed', id)}
            onDragStart={handleDragStart}
            onMoveIncident={handleMove}
            actions={[{ label: 'Reopen', target: 'active' }]}
          />
        </main>
      )}
    </div>
  );
};
