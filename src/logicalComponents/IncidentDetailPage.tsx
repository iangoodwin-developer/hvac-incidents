// Logical page that displays a single incident in detail.
// Includes a simple chart and live current value indicators.

import React, { useMemo } from 'react';
import { Catalog, Incident } from '../types';
import { PageHeader } from '../stylingComponents/PageHeader/PageHeader';
import { IncidentChart } from '../stylingComponents/IncidentChart/IncidentChart';
import { ConnectionBanner } from '../stylingComponents/ConnectionBanner/ConnectionBanner';
import { StatusPill } from '../stylingComponents/StatusPill/StatusPill';
import { ConnectionStatus } from './useIncidentSocket';

// Utility helpers keep the rendering section focused on layout.
const getAssetName = (catalog: Catalog, incident: Incident) => {
  const asset = catalog.assets.find(item => item.id === incident.assetId);
  return asset?.displayName ?? 'Unknown asset';
};

const getSiteName = (catalog: Catalog, incident: Incident) => {
  const site = catalog.sites.find(item => item.id === incident.siteId);
  return site?.name ?? 'Unknown site';
};

const getAlarmName = (catalog: Catalog, incident: Incident) => {
  const alarm = catalog.alarms.find(item => item.alarmId === incident.alarmId);
  return alarm?.code ?? 'Unknown alarm';
};

type IncidentDetailPageProps = {
  incident?: Incident;
  catalog: Catalog;
  connectionStatus: ConnectionStatus;
};

export const IncidentDetailPage: React.FC<IncidentDetailPageProps> = ({ incident, catalog, connectionStatus }) => {
  // Precompute labels so JSX stays clean and readable.
  const detail = useMemo(() => {
    if (!incident) {
      return null;
    }

    return {
      site: getSiteName(catalog, incident),
      asset: getAssetName(catalog, incident),
      alarm: getAlarmName(catalog, incident)
    };
  }, [catalog, incident]);

  return (
    <div className='incident-detail'>
      <PageHeader title='Incident detail' statusLabel={`WebSocket: ${connectionStatus}`}>
        <nav className='incident-detail__nav'>
          <a href='#/'>Back to incidents</a>
        </nav>
      </PageHeader>

      <ConnectionBanner status={connectionStatus} />

      {!incident || !detail ? (
        <p className='incident-detail__empty'>Incident not found.</p>
      ) : (
        <main className='incident-detail__content'>
          <section className='incident-detail__card'>
            <h2 className='incident-detail__title'>Summary</h2>
            <div className='incident-detail__grid'>
              <div className='incident-detail__item'>
                <span className='incident-detail__label'>Incident ID</span>
                <span className='incident-detail__value'>{incident.incidentId}</span>
              </div>
              <div className='incident-detail__item'>
                <span className='incident-detail__label'>Site</span>
                <span className='incident-detail__value'>{detail.site}</span>
              </div>
              <div className='incident-detail__item'>
                <span className='incident-detail__label'>Asset</span>
                <span className='incident-detail__value'>{detail.asset}</span>
              </div>
              <div className='incident-detail__item'>
                <span className='incident-detail__label'>Alarm</span>
                <span className='incident-detail__value'>{detail.alarm}</span>
              </div>
              <div className='incident-detail__item'>
                <span className='incident-detail__label'>Priority</span>
                <span className='incident-detail__value'>{incident.priority}</span>
              </div>
              <div className='incident-detail__item'>
                <span className='incident-detail__label'>Occurrences</span>
                <span className='incident-detail__value'>{incident.occurrences}</span>
              </div>
              <div className='incident-detail__item'>
                <span className='incident-detail__label'>Status</span>
                <span className='incident-detail__value'>
                  <StatusPill status={incident.stateId} />
                </span>
              </div>
            </div>
          </section>

          <IncidentChart readings={incident.readings ?? []} />
        </main>
      )}
    </div>
  );
};
