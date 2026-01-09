// Simple hash-based router so we avoid pulling in a routing library.
// This keeps the project lightweight while still supporting multiple pages.

import React, { useEffect, useState } from 'react';
import { useIncidentSocket } from './useIncidentSocket';
import { CreateIncidentPage } from './CreateIncidentPage';
import { IncidentsPage } from './IncidentsPage';
import { IncidentDetailPage } from './IncidentDetailPage';

// Parse the hash into a simple route object.
const getRouteFromHash = () => {
  const hash = window.location.hash.replace('#', '');

  if (hash.startsWith('/create')) {
    return { view: 'create' as const };
  }

  if (hash.startsWith('/incident/')) {
    const incidentId = hash.replace('/incident/', '').trim();
    return { view: 'detail' as const, incidentId };
  }

  return { view: 'list' as const };
};

export const AppRouter: React.FC = () => {
  // The router keeps only the current route fragment in state.
  const [route, setRoute] = useState(getRouteFromHash());
  const { incidents, catalog, connectionStatus, sendIncident, updateIncident } = useIncidentSocket();

  useEffect(() => {
    // Update the route whenever the hash changes in the browser.
    const handleHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route.view === 'create') {
    return (
      <CreateIncidentPage
        catalog={catalog}
        connectionStatus={connectionStatus}
        sendIncident={sendIncident}
      />
    );
  }

  if (route.view === 'detail') {
    const incident = incidents.find(item => item.incidentId === route.incidentId);
    return <IncidentDetailPage incident={incident} catalog={catalog} connectionStatus={connectionStatus} />;
  }

  return (
    <IncidentsPage
      incidents={incidents}
      catalog={catalog}
      connectionStatus={connectionStatus}
      updateIncident={updateIncident}
    />
  );
};
