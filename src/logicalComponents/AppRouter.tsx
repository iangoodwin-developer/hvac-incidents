// Hash-based router to avoid pulling in a routing library for this interview demo.
// Using the URL hash keeps routing on the client without server configuration,
// which means we can explain navigation mechanics without adding extra dependencies.

import React, { useEffect, useState } from 'react';
import { useIncidentSocket } from './useIncidentSocket';
import { CreateIncidentPage } from './CreateIncidentPage';
import { IncidentsPage } from './IncidentsPage';
import { IncidentDetailPage } from './IncidentDetailPage';

// Parse the hash into a simple route object.
// This replaces a full router by doing the minimum work needed for three views.
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
  // This is enough because the hash fully describes which view to show.
  const [route, setRoute] = useState(getRouteFromHash());
  const { incidents, catalog, connectionStatus, sendIncident, updateIncident } = useIncidentSocket();

  useEffect(() => {
    // Update the route whenever the hash changes in the browser.
    // Hash changes do not reload the page, so this acts like a small client router.
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
