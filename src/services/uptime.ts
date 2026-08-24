export interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'paused' | 'maintenance' | 'checking';
  uptimePercentage?: number;
  lastChecked?: string;
  url?: string;
  monitorType?: string;
}

export interface BetterStackResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      pronounceable_name: string;
      url: string;
      status: string;
      paused: boolean;
      maintenance: boolean;
      last_check_at: string;
      monitor_type: string;
      check_frequency: number;
    };
  }>;
}

type StatusPayload = {
  services?: Array<{
    id?: string;
    name?: string;
    status?: string;
    uptimePercentage?: string | number;
    lastChecked?: string;
    description?: string;
  }>;
};

/**
 * Fetches sanitized monitoring data from the same-origin server proxy.
 * The Better Stack bearer token is intentionally never accepted or sent by browser code.
 */
export async function fetchBetterStackMonitors(_apiKey?: string): Promise<ServiceStatus[]> {
  try {
    const response = await fetch('/api/status', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Status API HTTP Error: ${response.status}`);

    const payload = await response.json() as StatusPayload;
    if (!Array.isArray(payload.services)) throw new Error('Invalid status response structure');

    return payload.services.slice(0, 20).map((item, index) => {
      const allowedStatuses: ServiceStatus['status'][] = ['operational', 'degraded', 'down', 'paused', 'maintenance', 'checking'];
      const status = allowedStatuses.includes(item.status as ServiceStatus['status'])
        ? item.status as ServiceStatus['status']
        : 'degraded';
      const uptimePercentage = Number(item.uptimePercentage);
      return {
        id: typeof item.id === 'string' ? item.id.slice(0, 128) : String(index + 1),
        name: typeof item.name === 'string' ? item.name.slice(0, 160) : `Monitor #${index + 1}`,
        status,
        uptimePercentage: Number.isFinite(uptimePercentage) ? Math.max(0, Math.min(100, uptimePercentage)) : undefined,
        lastChecked: typeof item.lastChecked === 'string' ? item.lastChecked.slice(0, 80) : 'Just now',
        monitorType: 'http'
      };
    });
  } catch {
    console.warn('Status API request failed; reporting monitoring unavailable')
    return [
      { id: 'monitoring-unavailable', name: 'Monitoring unavailable', status: 'degraded', lastChecked: 'Unavailable', monitorType: 'http' }
    ];
  }
}

export async function getSystemHealth(apiKey?: string): Promise<{
  overallStatus: 'operational' | 'degraded' | 'down';
  monitors: ServiceStatus[];
  lastUpdated: string;
}> {
  const monitors = await fetchBetterStackMonitors(apiKey);
  const hasDown = monitors.some(m => m.status === 'down');
  const hasDegraded = monitors.some(m => m.status === 'degraded');
  const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'operational';
  return { overallStatus, monitors, lastUpdated: new Date().toLocaleTimeString() };
}
