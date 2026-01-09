// Separate page for creating a new incident without the list filters.
// This keeps the creation workflow focused and easy to demo.

import React, { useEffect, useState } from 'react';
import { Catalog, Incident } from '../types';
import { INCIDENT_STATE_OPTIONS, INCIDENT_STATES, IncidentState } from '../constants';
import { ConnectionStatus } from './useIncidentSocket';
import { PageHeader } from '../stylingComponents/PageHeader/PageHeader';

const createEmptyForm = () => ({
  incidentId: '',
  siteId: '',
  assetId: '',
  alarmId: '',
  priority: 1,
  occurrences: 1,
  stateId: INCIDENT_STATES.OPEN as IncidentState,
  escalationLevelId: '',
  skillId: ''
});

type IncidentFormState = ReturnType<typeof createEmptyForm>;

type CreateIncidentPageProps = {
  catalog: Catalog;
  connectionStatus: ConnectionStatus;
  sendIncident: (incident: Incident) => void;
};

export const CreateIncidentPage: React.FC<CreateIncidentPageProps> = ({ catalog, connectionStatus, sendIncident }) => {
  // Form state lives locally so inputs remain controlled.
  const [formState, setFormState] = useState<IncidentFormState>(createEmptyForm());

  useEffect(() => {
    // Pre-fill dropdowns with the first catalog entries once data is loaded.
    if (!catalog.escalationLevels.length && !catalog.skills.length && !catalog.sites.length && !catalog.assets.length && !catalog.alarms.length) {
      return;
    }

    setFormState(prev => ({
      ...prev,
      siteId: prev.siteId || catalog.sites[0]?.id || '',
      assetId: prev.assetId || catalog.assets[0]?.id || '',
      alarmId: prev.alarmId || catalog.alarms[0]?.alarmId || '',
      escalationLevelId: prev.escalationLevelId || catalog.escalationLevels[0]?.id || '',
      skillId: prev.skillId || catalog.skills[0]?.id || ''
    }));
  }, [catalog]);

  const handleFormChange = (field: keyof IncidentFormState, value: string) => {
    // Normalize numeric inputs so the incident payload is typed correctly.
    setFormState(prev => {
      if (field === 'priority' || field === 'occurrences') {
        return { ...prev, [field]: Number(value) };
      }
      return { ...prev, [field]: value };
    });
  };

  const submitIncident = (event: React.FormEvent<HTMLFormElement>) => {
    // Build a new incident payload and send it through the WebSocket.
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

    sendIncident(newIncident);

    // Reset only the fields that feel safe to clear for quick entry.
    setFormState(prev => ({
      ...prev,
      incidentId: '',
      priority: 1,
      occurrences: 1
    }));
  };

  return (
    <div className='create-page'>
      <PageHeader title='Create incident' statusLabel={`WebSocket: ${connectionStatus}`}>
        <nav className='create-page__nav'>
          <a href='#/'>Back to incidents</a>
        </nav>
      </PageHeader>

      <main className='create-page__content'>
        <form onSubmit={submitIncident} className='create-page__form'>
          <label className='create-page__field'>
            <span className='create-page__label'>Incident ID (optional)</span>
            <input
              type='text'
              value={formState.incidentId}
              onChange={event => handleFormChange('incidentId', event.target.value)}
            />
          </label>
          <label className='create-page__field'>
            <span className='create-page__label'>Site</span>
            <select value={formState.siteId} onChange={event => handleFormChange('siteId', event.target.value)}>
              {catalog.sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
          <label className='create-page__field'>
            <span className='create-page__label'>Asset</span>
            <select value={formState.assetId} onChange={event => handleFormChange('assetId', event.target.value)}>
              {catalog.assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className='create-page__field'>
            <span className='create-page__label'>Alarm</span>
            <select value={formState.alarmId} onChange={event => handleFormChange('alarmId', event.target.value)}>
              {catalog.alarms.map(alarm => (
                <option key={alarm.alarmId} value={alarm.alarmId}>
                  {alarm.code}
                </option>
              ))}
            </select>
          </label>
          <label className='create-page__field'>
            <span className='create-page__label'>Priority</span>
            <input
              type='number'
              min={1}
              max={5}
              value={formState.priority}
              onChange={event => handleFormChange('priority', event.target.value)}
            />
          </label>
          <label className='create-page__field'>
            <span className='create-page__label'>Occurrences</span>
            <input
              type='number'
              min={1}
              value={formState.occurrences}
              onChange={event => handleFormChange('occurrences', event.target.value)}
            />
          </label>
          <label className='create-page__field'>
            <span className='create-page__label'>State</span>
            <select value={formState.stateId} onChange={event => handleFormChange('stateId', event.target.value)}>
              {INCIDENT_STATE_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className='create-page__field'>
            <span className='create-page__label'>Escalation level</span>
            <select
              value={formState.escalationLevelId}
              onChange={event => handleFormChange('escalationLevelId', event.target.value)}
            >
              {catalog.escalationLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label className='create-page__field'>
            <span className='create-page__label'>Skill</span>
            <select value={formState.skillId} onChange={event => handleFormChange('skillId', event.target.value)}>
              {catalog.skills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </label>
          <button type='submit' className='create-page__button'>
            Send incident
          </button>
        </form>
      </main>
    </div>
  );
};
