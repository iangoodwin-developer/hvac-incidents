import React, { useEffect, useState } from 'react';
import { useIncidentSocket } from './useIncidentSocket';
import { CreateIncidentPage } from './CreateIncidentPage';
import { IncidentsPage } from './IncidentsPage';

const getViewFromHash = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('/create')) {
    return 'create';
  }
  return 'list';
};

export const AppRouter: React.FC = () => {
  const [view, setView] = useState<'list' | 'create'>(getViewFromHash());
  const { incidents, catalog, connectionStatus, sendIncident, updateIncident } = useIncidentSocket();

  useEffect(() => {
    const handleHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (view === 'create') {
    return (
      <CreateIncidentPage
        catalog={catalog}
        connectionStatus={connectionStatus}
        sendIncident={sendIncident}
      />
    );
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
