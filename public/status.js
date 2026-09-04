const $ = (id) => document.getElementById(id);
    const allowedStates = new Set(['operational', 'up', 'degraded', 'down', 'paused', 'maintenance', 'checking']);
    let refreshTimer;

    function text(value, fallback = '—') {
      return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
    }
    function stateInfo(raw) {
      const state = allowedStates.has(raw) ? raw : 'degraded';
      if (state === 'operational' || state === 'up') return { label: 'Operational', className: '' };
      if (state === 'down') return { label: 'Down', className: 'bad' };
      if (state === 'paused') return { label: 'Paused', className: 'warn' };
      return { label: state[0].toUpperCase() + state.slice(1), className: 'warn' };
    }
    function setOverall(status, updatedAt) {
      const info = stateInfo(status);
      $('overall-status').textContent = info.label;
      $('overall-dot').className = `dot ${info.className}`;
      $('updated').textContent = `Updated ${new Date(updatedAt || Date.now()).toLocaleTimeString()}`;
    }
    function makeOverview(data, services, live) {
      const operational = services.filter((s) => ['operational', 'up'].includes(s.status)).length;
      const degraded = services.filter((s) => !['operational', 'up'].includes(s.status)).length;
      const cards = [
        ['Services', services.length, live ? 'Better Stack monitors' : 'Safe fallback snapshot'],
        ['Operational', operational, 'Healthy right now'],
        ['Attention', degraded, degraded ? 'Needs a closer look' : 'No active alerts'],
        ['Provider', live ? 'Live' : 'Fallback', live ? 'Better Stack API' : 'Static snapshot']
      ];
      $('overview').replaceChildren(...cards.map(([label, value, hint]) => {
        const card = document.createElement('div'); card.className = 'metric';
        const l = document.createElement('div'); l.className = 'label'; l.textContent = label;
        const v = document.createElement('div'); v.className = 'value'; v.textContent = value;
        const h = document.createElement('div'); h.className = 'hint'; h.textContent = hint;
        card.append(l, v, h); return card;
      }));
    }
    function renderServices(services) {
      const root = $('services');
      if (!services.length) {
        const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No monitors were returned. Configure Better Stack monitors to see live service data here.';
        root.replaceChildren(empty); return;
      }
      root.replaceChildren(...services.slice(0, 20).map((service) => {
        const info = stateInfo(service.status);
        const card = document.createElement('article'); card.className = 'panel service';
        const top = document.createElement('div'); top.className = 'service-top';
        const copy = document.createElement('div');
        const name = document.createElement('div'); name.className = 'service-name'; name.textContent = text(service.name, 'Unnamed service');
        const description = document.createElement('div'); description.className = 'service-description'; description.textContent = text(service.description, 'Monitoring endpoint');
        copy.append(name, description);
        const state = document.createElement('div'); state.className = `service-state ${info.className}`;
        const dot = document.createElement('span'); dot.className = `dot ${info.className}`; const label = document.createElement('span'); label.textContent = info.label;
        state.append(dot, label); top.append(copy, state);

        const stats = document.createElement('div'); stats.className = 'service-stats';
        [['Uptime', text(service.uptimePercentage, '—')], ['Checked', text(service.lastChecked, 'Just now')]].forEach(([labelText, value]) => {
          const item = document.createElement('div'); item.className = 'service-stat';
          const label = document.createElement('span'); label.textContent = labelText; const strong = document.createElement('strong'); strong.textContent = value; item.append(label, strong); stats.append(item);
        });
        const history = document.createElement('div'); history.className = 'history'; history.setAttribute('aria-label', 'Recent service history');
        const bars = Array.isArray(service.historyBars) ? service.historyBars.slice(0, 60) : [];
        (bars.length ? bars : Array.from({ length: 30 }, () => ({ status: service.status === 'down' ? 'down' : 'up' }))).forEach((barData) => {
          const bar = document.createElement('span'); bar.className = `bar ${barData.status === 'down' ? 'down' : barData.status === 'none' ? 'none' : ''}`;
          const tip = [barData.date, barData.latency].filter(Boolean).join(': '); if (tip) bar.title = text(tip); history.append(bar);
        });
        card.append(top, stats, history); return card;
      }));
    }
    function renderIncidents(incidents) {
      const root = $('incidents');
      if (!Array.isArray(incidents) || incidents.length === 0) {
        const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'No active incidents reported.'; root.replaceChildren(empty); return;
      }
      root.replaceChildren(...incidents.slice(0, 20).map((incident) => {
        const row = document.createElement('div'); row.className = 'incident';
        const mark = document.createElement('span'); mark.className = 'mark';
        const copy = document.createElement('div'); const title = document.createElement('strong'); title.textContent = text(incident.title || incident.name, 'Service incident');
        const detail = document.createElement('span'); detail.textContent = text(incident.description || incident.cause || incident.started_at, 'Incident reported by monitoring provider'); copy.append(title, detail); row.append(mark, copy); return row;
      }));
    }
    async function fetchStatusData() {
      const button = $('refresh'); button.disabled = true; button.textContent = 'Refreshing…';
      try {
        let response = await fetch('/api/status', { cache: 'no-store', headers: { Accept: 'application/json' } });
        let live = response.ok;
        if (!live) response = await fetch('/status.json', { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Status data unavailable');
        const data = await response.json();
        const services = Array.isArray(data.services) ? data.services : [];
        setOverall(data.status, data.updatedAt); makeOverview(data, services, live); renderServices(services); renderIncidents(data.incidents);
        $('provider').className = live ? 'source-pill' : 'source-pill fallback';
        $('provider').textContent = live ? 'Live Better Stack' : 'Fallback snapshot';
        $('fetch-time').textContent = new Date().toLocaleTimeString();
        $('service-subtitle').textContent = live ? 'Live monitor data from Better Stack, refreshed automatically.' : 'The live API was unavailable; showing the repository fallback snapshot.';
      } catch {
        setOverall('degraded', Date.now()); $('service-subtitle').textContent = 'Status data could not be loaded.'; renderServices([]); renderIncidents([]);
      } finally { button.disabled = false; button.textContent = 'Refresh data'; }
    }
    $('refresh').addEventListener('click', fetchStatusData);
    fetchStatusData();
    refreshTimer = window.setInterval(fetchStatusData, 60000);
