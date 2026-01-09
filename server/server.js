const { WebSocketServer } = require('ws');

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 8080;

const escalationLevels = [
  { id: 'esc-1', name: 'Level 1' },
  { id: 'esc-2', name: 'Level 2' }
];

const skills = [
  { id: 'skill-elec', name: 'Electrical' },
  { id: 'skill-mech', name: 'Cooling' },
  { id: 'skill-scada', name: 'Controls' },
  { id: 'skill-ops', name: 'Facilities' }
];

const sites = [
  { id: 'site-1', name: 'North Campus Plant' },
  { id: 'site-2', name: 'Harbor District Facility' }
];

const assets = [
  { id: 'asset-1', siteId: 'site-1', displayName: 'Chiller CH-11', model: 'Trane RTAC 250', regionName: 'Mechanical Room 3' },
  { id: 'asset-2', siteId: 'site-1', displayName: 'AHU AH-19', model: 'Carrier 39HQ', regionName: 'Roof Zone 2' },
  { id: 'asset-3', siteId: 'site-2', displayName: 'Boiler BL-03', model: 'Cleaver-Brooks CB-500', regionName: 'Basement Plant 5' },
  { id: 'asset-4', siteId: 'site-2', displayName: 'Cooling Tower CT-21', model: 'BAC FXV', regionName: 'South Yard 1' }
];

const alarms = [
  { alarmId: 'alarm-100', code: 'HV-100', description: 'High condenser pressure', legacyId: '100' },
  { alarmId: 'alarm-220', code: 'HV-220', description: 'Supply air temp deviation', legacyId: '220' },
  { alarmId: 'alarm-310', code: 'HV-310', description: 'Boiler flame failure', legacyId: '310' },
  { alarmId: 'alarm-420', code: 'HV-420', description: 'BAS comms loss', legacyId: '420' }
];

const incidents = [
  {
    incidentId: 'inc-1001',
    siteId: 'site-1',
    assetId: 'asset-1',
    alarmId: 'alarm-100',
    priority: 1,
    occurrences: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    stateId: 'OPEN',
    escalationLevelId: 'esc-1',
    lvl1SkillId: 'skill-elec'
  },
  {
    incidentId: 'inc-1002',
    siteId: 'site-2',
    assetId: 'asset-3',
    alarmId: 'alarm-310',
    priority: 2,
    occurrences: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    assignedTo: 'user-2',
    stateId: 'OPEN',
    escalationLevelId: 'esc-1',
    lvl1SkillId: 'skill-mech'
  },
  {
    incidentId: 'inc-1003',
    siteId: 'site-2',
    assetId: 'asset-4',
    alarmId: 'alarm-420',
    priority: 3,
    occurrences: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    assignedTo: 'user-1',
    stateId: 'OBSERVED',
    escalationLevelId: 'esc-2',
    lvl2SkillId: 'skill-scada'
  },
  {
    incidentId: 'inc-1004',
    siteId: 'site-1',
    assetId: 'asset-2',
    alarmId: 'alarm-220',
    priority: 1,
    occurrences: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    assignedTo: 'user-1',
    stateId: 'CLOSED',
    escalationLevelId: 'esc-2',
    lvl2SkillId: 'skill-ops'
  }
];

const wss = new WebSocketServer({ port: PORT });

const broadcast = message => {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
};

wss.on('connection', socket => {
  socket.send(
    JSON.stringify({
      type: 'init',
      incidents,
      catalog: {
        escalationLevels,
        skills,
        sites,
        assets,
        alarms
      }
    })
  );

  socket.on('message', data => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      return;
    }

    if (message?.type === 'addIncident' && message.incident) {
      const incident = message.incident;
      incidents.unshift(incident);
      broadcast({ type: 'incidentAdded', incident });
    }
  });
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);
