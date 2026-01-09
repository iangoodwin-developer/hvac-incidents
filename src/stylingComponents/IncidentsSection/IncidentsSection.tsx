import React, { useMemo } from 'react';
import { Alarm, Asset, Incident, Site } from '../../types';

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

type IncidentsSectionProps = {
  title: string;
  incidents: Incident[];
  sites: Site[];
  assets: Asset[];
  alarms: Alarm[];
  onDropIncident: (incidentId: string) => void;
  onDragStart: (incidentId: string, event: React.DragEvent<HTMLTableRowElement>) => void;
};

export const IncidentsSection: React.FC<IncidentsSectionProps> = ({
  title,
  incidents,
  sites,
  assets,
  alarms,
  onDropIncident,
  onDragStart
}) => {
  const siteMap = useMemo(() => new Map(sites.map(site => [site.id, site])), [sites]);
  const assetMap = useMemo(() => new Map(assets.map(asset => [asset.id, asset])), [assets]);
  const alarmMap = useMemo(() => new Map(alarms.map(alarm => [alarm.alarmId, alarm])), [alarms]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const incidentId = event.dataTransfer.getData('text/plain');
    if (incidentId) {
      onDropIncident(incidentId);
    }
  };

  return (
    <section
      className='incidents-section'
      onDragOver={event => event.preventDefault()}
      onDrop={handleDrop}
    >
      <h2 className='incidents-section__title'>{title}</h2>
      {incidents.length === 0 ? (
        <p className='incidents-section__empty'>No incidents found.</p>
      ) : (
        <div
          className='incidents-section__table'
          onDragOver={event => event.preventDefault()}
          onDrop={handleDrop}
        >
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
                    <tr
                      key={incident.incidentId}
                      draggable
                      onDragStart={event => onDragStart(incident.incidentId, event)}
                      className='incidents-section__row'
                    >
                    <td>{incident.priority}</td>
                    <td>{site?.name ?? 'Unknown'}</td>
                    <td>{asset?.displayName ?? 'Unknown'}</td>
                    <td>
                      {alarm?.code ?? 'Unknown'}
                      <span className='incidents-section__muted'> {alarm?.description ?? ''}</span>
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
      <p className='incidents-section__hint'>Drag incidents into another list to change status.</p>
    </section>
  );
};
