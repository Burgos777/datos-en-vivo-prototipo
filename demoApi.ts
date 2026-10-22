type DemoUser = {
  userId: string;
  username: string;
  rol: 'admin' | 'viewer';
  nombre: string;
};

const UNITS = ['Barranquilla', 'Bogota', 'Bucaramanga', 'Cali', 'Medellin', 'Pereira'];
const SERVICES = ['Soporte', 'Caja', 'Atencion general', 'Radicacion'];
const DEMO_TOKEN = 'demo-token-datos-en-vivo';

const users: Array<DemoUser & { id: string; activo: boolean; created_at: string; is_online: boolean }> = [
  { id: 'usr_admin', userId: 'usr_admin', username: 'admin', rol: 'admin', nombre: 'Administrador', activo: true, created_at: '2026-05-20T20:29:11Z', is_online: true },
  { id: 'usr_viewer', userId: 'usr_viewer', username: 'demo', rol: 'viewer', nombre: 'Usuario demostración', activo: true, created_at: '2026-06-23T14:09:10Z', is_online: false },
];

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const selectedValues = (value: string | null, all: string[]) => {
  if (!value) return all;
  const values = value.split(',').map(item => item.trim()).filter(Boolean);
  return values.length ? all.filter(item => values.includes(item)) : all;
};

const buildSeries = (units: string[], services: string[]) => {
  const rows: any[] = [];
  for (let minute = 8 * 60; minute <= 17 * 60; minute += 5) {
    const hour = Math.floor(minute / 60);
    const min = minute % 60;
    let atendidos = 0;
    let abandonos = 0;
    let waitWeighted = 0;
    let serviceWeighted = 0;
    let waitCount = 0;
    let serviceCount = 0;

    units.forEach((unit, unitIndex) => services.forEach((service, serviceIndex) => {
      const wave = Math.sin((minute + unitIndex * 19 + serviceIndex * 11) / 37);
      const volume = Math.max(1, Math.round(3 + unitIndex * 0.7 + serviceIndex * 0.8 + wave * 2));
      const abandons = Math.max(0, Math.round((unitIndex + serviceIndex) % 3 === 0 ? volume * 0.12 : volume * 0.06));
      const served = Math.max(0, volume - abandons);
      const wait = 240 + unitIndex * 35 + serviceIndex * 24 + Math.round(wave * 30);
      const serviceTime = 360 + serviceIndex * 42 + unitIndex * 18 + Math.round(wave * 24);
      atendidos += served;
      abandonos += abandons;
      waitWeighted += wait * volume;
      serviceWeighted += serviceTime * served;
      waitCount += volume;
      serviceCount += served;
    }));

    rows.push({
      Hora_Minuto: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      Atendidos: atendidos,
      Abandonos: abandonos,
      TurnosConEspera: waitCount,
      Segundos_Espera: Math.round(waitWeighted / Math.max(waitCount, 1)),
      Segundos_Servicio: Math.round(serviceWeighted / Math.max(serviceCount, 1)),
      Total_Turnos: atendidos + abandonos,
    });
  }
  return rows;
};

const buildRankings = (units: string[], services: string[]) => {
  const unitRows = units.map((unit, index) => ({
    Oficina: unit,
    AvgEspera: 340 + index * 38,
    AvgServicio: 410 + index * 28,
    TotalVolumen: 240 - index * 19,
    TotalAbandonos: 22 - index * 2,
    PorcentajeEnObjetivo: Math.max(62, 89 - index * 4),
    WaitingTimeStandard: 420,
    WaitingTimeWarning: 480,
    WaitingTimeCritical: 720,
    ServiceTimeWarning: 480,
    ServiceTimeCritical: 720,
  }));
  const serviceRows = services.map((service, index) => ({
    Servicio: service,
    AvgEspera: 325 + index * 44,
    AvgServicio: 390 + index * 36,
    TotalVolumen: 310 - index * 31,
    TotalAbandonos: 19 - index * 2,
    PorcentajeEnObjetivo: Math.max(60, 91 - index * 5),
    WaitingTimeStandard: 420,
    WaitingTimeWarning: 480,
    WaitingTimeCritical: 720,
    ServiceTimeWarning: 480,
    ServiceTimeCritical: 720,
  }));
  const by = (key: string) => (a: any, b: any) => Number(b[key] || 0) - Number(a[key] || 0);
  return {
    Top_Unidades_Espera: [...unitRows].sort(by('AvgEspera')),
    Top_Unidades_Servicio: [...unitRows].sort(by('AvgServicio')),
    Top_Unidades_Volumen: [...unitRows].sort(by('TotalVolumen')),
    Top_Unidades_Abandonos: [...unitRows].sort(by('TotalAbandonos')),
    Top_Servicios_Espera: [...serviceRows].sort(by('AvgEspera')),
    Top_Servicios_Servicio: [...serviceRows].sort(by('AvgServicio')),
    Top_Servicios_Volumen: [...serviceRows].sort(by('TotalVolumen')),
    Top_Servicios_Abandonos: [...serviceRows].sort(by('TotalAbandonos')),
    Total_Oficinas: unitRows.length,
    Total_Servicios: serviceRows.length,
    Oficinas_Espera_Critical: unitRows.filter(row => row.AvgEspera >= row.WaitingTimeCritical).length,
    Oficinas_Espera_Warning: unitRows.filter(row => row.AvgEspera >= row.WaitingTimeWarning && row.AvgEspera < row.WaitingTimeCritical).length,
    Oficinas_Servicio_Critical: unitRows.filter(row => row.AvgServicio >= row.ServiceTimeCritical).length,
    Oficinas_Servicio_Warning: unitRows.filter(row => row.AvgServicio >= row.ServiceTimeWarning && row.AvgServicio < row.ServiceTimeCritical).length,
    Servicios_Espera_Critical: serviceRows.filter(row => row.AvgEspera >= row.WaitingTimeCritical).length,
    Servicios_Espera_Warning: serviceRows.filter(row => row.AvgEspera >= row.WaitingTimeWarning && row.AvgEspera < row.WaitingTimeCritical).length,
    Servicios_Servicio_Critical: serviceRows.filter(row => row.AvgServicio >= row.ServiceTimeCritical).length,
    Servicios_Servicio_Warning: serviceRows.filter(row => row.AvgServicio >= row.ServiceTimeWarning && row.AvgServicio < row.ServiceTimeCritical).length,
  };
};

const buildGlobals = (units: string[], services: string[]) => {
  const data = buildSeries(units, services);
  const total = data.reduce((sum, row) => sum + row.Total_Turnos, 0);
  const served = data.reduce((sum, row) => sum + row.Atendidos, 0);
  const abandoned = data.reduce((sum, row) => sum + row.Abandonos, 0);
  const avgWait = data.reduce((sum, row) => sum + row.Segundos_Espera * row.TurnosConEspera, 0) / Math.max(data.reduce((sum, row) => sum + row.TurnosConEspera, 0), 1);
  const avgService = data.reduce((sum, row) => sum + row.Segundos_Servicio * row.Atendidos, 0) / Math.max(served, 1);
  const rankings = buildRankings(units, services);
  const waitingByUnit = units.map((unit, index) => ({
    UnitName: unit,
    CurrentlyWaiting: 4 + index,
    MaxWaitingTime: clock(380 + index * 35),
    MaxServiceTime: clock(420 + index * 28),
    AgentsSignedIn: 18 + index,
    AgentsInService: 9 + (index % 4),
    AgentsIdle: 5 + (index % 3),
    AgentsInBackOffice: 2,
    AgentsInReception: 2,
  }));
  return {
    Global_TotalTurnos: total,
    Global_Atendidos: served,
    Global_Abandonados: abandoned,
    Global_AvgEsperaSeg: Math.round(avgWait),
    Global_AvgAtencionSeg: Math.round(avgService),
    Global_AvgWaitingTimeWarning: 480,
    Global_AvgWaitingTimeCritical: 720,
    Global_AvgServiceTimeWarning: 480,
    Global_AvgServiceTimeCritical: 720,
    Global_PorcentajeEsperaEnObjetivo: 78.5,
    CurrentlyWaiting: waitingByUnit.reduce((sum, row) => sum + row.CurrentlyWaiting, 0),
    CurrentlyInService: waitingByUnit.reduce((sum, row) => sum + row.AgentsInService, 0),
    MaxWaitingTime: '00:12:30',
    MaxServiceTime: '00:10:26',
    AgentsSignedIn: waitingByUnit.reduce((sum, row) => sum + row.AgentsSignedIn, 0),
    AgentsIdle: waitingByUnit.reduce((sum, row) => sum + row.AgentsIdle, 0),
    AgentsInBackOffice: waitingByUnit.reduce((sum, row) => sum + row.AgentsInBackOffice, 0),
    AgentsInService: waitingByUnit.reduce((sum, row) => sum + row.AgentsInService, 0),
    AgentsInReception: waitingByUnit.reduce((sum, row) => sum + row.AgentsInReception, 0),
    WaitingByUnit: waitingByUnit,
    ...rankings,
  };
};

const demoUsers = () => users.map(({ id, userId, username, rol, nombre, activo, created_at, is_online }) => ({ id, userId, username, rol, nombre, activo, created_at, is_online }));

export async function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(requestUrl, window.location.origin);
  const method = (init?.method || 'GET').toUpperCase();
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  const token = localStorage.getItem('auth_token');

  if (url.pathname === '/api/auth/login' && method === 'POST') {
    const user = users.find(item => item.username === body.username && body.password === 'admin123' && item.activo);
    if (!user) return response({ error: 'Usuario o contraseña incorrectos' }, 401);
    return response({ token: DEMO_TOKEN, user: { userId: user.userId, username: user.username, rol: user.rol, nombre: user.nombre } });
  }
  if (url.pathname === '/api/auth/verify') {
    if (token !== DEMO_TOKEN) return response({ error: 'SESSION_INVALIDATED' }, 401);
    const user = users.find(item => item.userId === 'usr_admin')!;
    return response({ user: { userId: user.userId, username: user.username, rol: user.rol, nombre: user.nombre } });
  }
  if (url.pathname === '/api/auth/logout') return response({ success: true });
  if (token !== DEMO_TOKEN) return response({ error: 'SESSION_INVALIDATED' }, 401);

  if (url.pathname === '/api/live-data/options') return response({ units: UNITS, services: SERVICES });
  if (url.pathname === '/api/live-data') {
    const units = selectedValues(url.searchParams.get('unit'), UNITS);
    const services = selectedValues(url.searchParams.get('service'), SERVICES);
    const data = buildSeries(units, services);
    return response({ data, globals: buildGlobals(units, services) });
  }
  if (url.pathname === '/api/admin/users' && method === 'GET') return response(demoUsers());
  if (url.pathname === '/api/admin/users' && method === 'POST') {
    const newUser = { id: `usr_${Date.now()}`, userId: `usr_${Date.now()}`, username: body.username, rol: body.rol || 'viewer', nombre: body.nombre || body.username, activo: true, created_at: new Date().toISOString(), is_online: false };
    users.push(newUser);
    return response({ success: true, id: newUser.id });
  }
  if (url.pathname.startsWith('/api/admin/users/') && method === 'PUT') return response({ success: true });
  if (url.pathname.startsWith('/api/admin/users/') && method === 'DELETE') return response({ success: true });
  if (url.pathname === '/api/agents-by-unit') return response(['Ana Torres', 'Carlos Rojas', 'Laura Gómez'].map((name, index) => ({ UserId: `agent-${index}`, FullName: name, FunctionName: 'Asesor', AgentState: index === 0 ? 'InService' : 'Idle' })));
  if (url.pathname === '/api/all-agents') return response(['Ana Torres', 'Carlos Rojas', 'Laura Gómez'].map((name, index) => ({ FullName: name, FunctionName: 'Asesor', AgentState: index === 0 ? 'InService' : 'Idle', UnitName: UNITS[index] })));
  if (url.pathname === '/api/waiting-tickets') return response([{ ProcessId: 'T-1001', ServiceName: 'Soporte', WaitingTimeWarning: 480, WaitingTimeCritical: 720, StartDate: new Date().toISOString(), SecondsWaiting: 380 }]);
  if (url.pathname === '/api/service-tickets') return response([{ ProcessId: 'T-2001', ServiceName: 'Caja', ServiceTimeWarning: 480, ServiceTimeCritical: 720, StartDate: new Date().toISOString(), SecondsServing: 420 }]);

  return response({ error: 'Ruta no disponible en modo demostración' }, 404);
}

export function installDemoApi() {
  const originalFetch = window.fetch.bind(window);
  const useDemo = import.meta.env.VITE_DEMO_MODE !== 'false';
  if (!useDemo) return;
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (new URL(requestUrl, window.location.origin).pathname.startsWith('/api/')) return demoFetch(input, init);
    return originalFetch(input, init);
  };
}
