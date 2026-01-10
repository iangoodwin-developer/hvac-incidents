// Custom hook that owns the WebSocket connection and exposes
// a small API for the rest of the app to consume.

import { useEffect, useEffectEvent, useReducer, useRef, useState } from 'react';
import { Catalog, Incident } from '../../../shared/types';
import { PROTOCOL_VERSION, ServerMessageSchema } from '../../../shared/schema';

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
  message?: string;
  code?: string;
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
  const [readingIntervalMs, setReadingIntervalMs] = useState(2000);
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const lastUpdateRef = useRef(0);

  // useEffectEvent keeps the handler stable while reading fresh logic/state,
  // like a user-controlled throttle that changes over time.
  // The commented block in the effect shows the "plain useEffect closure" version.
  const handleMessage = useEffectEvent((event: MessageEvent) => {
    // Parse the message defensively so malformed payloads don't crash the app.
    let parsed: unknown;
    try {
      parsed = JSON.parse(event.data);
    } catch (error) {
      return;
    }

    // Shared schema validation keeps client/server contracts aligned at runtime.
    const parsedResult = ServerMessageSchema.safeParse(parsed);
    if (!parsedResult.success) {
      setLastError('Received an unexpected message shape from the server.');
      return;
    }
    const payload = parsedResult.data;

    if (payload.type === 'init') {
      // If the protocol version changes, surface it instead of failing silently.
      if (payload.protocolVersion && payload.protocolVersion !== PROTOCOL_VERSION) {
        setLastError(`Protocol mismatch: expected ${PROTOCOL_VERSION}, got ${payload.protocolVersion}.`);
      }
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
      const now = Date.now();
      if (now - lastUpdateRef.current < readingIntervalMs) {
        return;
      }
      lastUpdateRef.current = now;
      dispatch({ type: 'update', incident });
    }
  });

  useEffect(() => {
    // Establish a persistent WebSocket connection on mount.
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnectionStatus('connected');
      setLastError(null);
      // Send the current UI-selected interval so the server matches the client control.
      socket.send(JSON.stringify({ type: 'setReadingInterval', intervalMs: readingIntervalMs }));
    });

    socket.addEventListener('close', () => {
      setConnectionStatus('disconnected');
    });

    socket.addEventListener('message', handleMessage);
    // Old version (plain closure). Use this if you want the simpler, non-experimental pattern,
    // but note it would capture the initial readingIntervalMs unless you add it to dependencies.
    /*
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

    if (payload.type === 'error') {
      // Example error channel from the server so the UI can surface issues.
      setLastError(payload.message ?? 'Unexpected server error.');
      return;
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
        const now = Date.now();
        if (now - lastUpdateRef.current < readingIntervalMs) {
          return;
        }
        lastUpdateRef.current = now;
        dispatch({ type: 'update', incident });
      }
    });
    */

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'setReadingInterval', intervalMs: readingIntervalMs }));
    }
  }, [readingIntervalMs]);

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
    readingIntervalMs,
    setReadingIntervalMs,
    lastError,
    sendIncident,
    updateIncident,
  };
};
