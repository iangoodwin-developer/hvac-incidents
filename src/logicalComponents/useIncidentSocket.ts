import { useEffect, useRef, useState } from 'react';
import { Catalog, Incident } from '../types';

export type ConnectionStatus = 'connected' | 'disconnected';

const emptyCatalog: Catalog = {
  escalationLevels: [],
  skills: [],
  sites: [],
  assets: [],
  alarms: []
};

type ServerPayload = {
  type?: string;
  incidents?: Incident[];
  incident?: Incident;
  catalog?: Catalog;
};

export const useIncidentSocket = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);

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

      if (payload.type === 'incidentUpdated' && payload.incident) {
        const updated = payload.incident;
        setIncidents(prev => prev.map(item => (item.incidentId === updated.incidentId ? updated : item)));
      }
    });

    return () => {
      socket.close();
    };
  }, []);

  const sendIncident = (incident: Incident) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'addIncident', incident }));
    }
  };

  const updateIncident = (incident: Incident) => {
    setIncidents(prev => {
      const exists = prev.some(item => item.incidentId === incident.incidentId);
      if (!exists) {
        return [incident, ...prev];
      }
      return prev.map(item => (item.incidentId === incident.incidentId ? incident : item));
    });
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'updateIncident', incident }));
    }
  };

  return {
    incidents,
    catalog,
    connectionStatus,
    sendIncident,
    updateIncident
  };
};
