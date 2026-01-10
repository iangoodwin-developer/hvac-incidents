// Custom hook that owns the WebSocket connection and exposes
// a small API for the rest of the app to consume.

import { useEffect, useReducer, useRef, useState } from 'react';
import { Catalog, Incident } from '../../../shared/types';

export type ConnectionStatus = 'connected' | 'disconnected';

const emptyCatalog: Catalog = {
  escalationLevels: [],
  incidentTypes: [],
  sites: [],
  assets: [],
  alarms: [],
};

type ServerPayload = {
  type?: string;
  incidents?: Incident[];
  incident?: Incident;
  catalog?: Catalog;
};

type IncidentAction =
  | { type: 'init'; incidents: Incident[] }
  | { type: 'add'; incident: Incident }
  | { type: 'update'; incident: Incident };

// Reducer keeps the incident list transitions explicit and testable.
const incidentsReducer = (state: Incident[], action: IncidentAction) => {
  if (action.type === 'init') {
    return action.incidents;
  }

  if (action.type === 'add') {
    return [action.incident, ...state];
  }

  const exists = state.some((item) => item.incidentId === action.incident.incidentId);
  if (!exists) {
    return [action.incident, ...state];
  }
  return state.map((item) =>
    item.incidentId === action.incident.incidentId ? action.incident : item
  );
};

export const useIncidentSocket = () => {
  // Store incidents and catalog as reactive state so UI updates automatically.
  const [incidents, dispatch] = useReducer(incidentsReducer, []);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Establish a persistent WebSocket connection on mount.
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnectionStatus('connected');
    });

    socket.addEventListener('close', () => {
      setConnectionStatus('disconnected');
    });

    socket.addEventListener('message', (event) => {
      // Parse the message defensively so malformed payloads don't crash the app.
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
        // Initial payload carries the full catalog and current incident list.
        if (payload.incidents) {
          dispatch({ type: 'init', incidents: payload.incidents });
        }
        if (payload.catalog) {
          // Merge with defaults to avoid undefined fields while server restarts.
          setCatalog({
            ...emptyCatalog,
            ...payload.catalog,
          });
        }
      }

      if (payload.type === 'incidentAdded') {
        // Prepend the latest incident so the UI shows newest items first.
        const incident = payload.incident;
        if (!incident) {
          return;
        }
        dispatch({ type: 'add', incident });
      }

      if (payload.type === 'incidentUpdated') {
        // Merge updates into the existing list to keep row identity stable.
        const incident = payload.incident;
        if (!incident) {
          return;
        }
        dispatch({ type: 'update', incident });
      }
    });

    return () => {
      socket.close();
    };
  }, []);

  // Send a brand-new incident to the server.
  const sendIncident = (incident: Incident) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'addIncident', incident }));
    }
  };

  // Send a partial update (e.g., drag-and-drop state change) to the server.
  const updateIncident = (incident: Incident) => {
    dispatch({ type: 'update', incident });

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'updateIncident', incident }));
    }
  };

  return {
    incidents,
    catalog,
    connectionStatus,
    sendIncident,
    updateIncident,
  };
};
