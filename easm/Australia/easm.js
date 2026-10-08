(() => {
    const DATA_URL = 'easm/Australia/data.json';
    const LIVE_SOURCE = 'https://app.agniops.in/v1/search?domain=';
    const PAGE_SIZE = 60;
    const state = { data: null, organisations: [], selected: null, serviceLine: 'All service lines', visibleAssets: PAGE_SIZE, productionOnly: false };
    const elements = Object.fromEntries([
        'easm-status', 'updated-at', 'service-lines', 'organisation-count', 'organisation-list', 'organisation-search',
        'domain-form', 'domain-input', 'production-filter', 'root-domain-count', 'subdomain-count', 'subdomain-note',
        'overlap-count', 'source-count', 'source-note', 'asset-heading', 'asset-summary', 'selected-domain', 'asset-rows',
        'load-more', 'environment-chart'
    ].map(id => [id, document.getElementById(id)]));

    const domainPattern = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
    const cleanDomain = value => value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^\*\./, '');
    const formatNumber = value => new Intl.NumberFormat('en-AU').format(value || 0);
    const classifyEnvironment = hostname => {
        if (/(^|[.-])(dev|development|sandbox|lab)([.-]|$)/i.test(hostname)) return 'development';
        if (/(^|[.-])(stg|stage|staging|preprod|uat)([.-]|$)/i.test(hostname)) return 'staging';
        if (/(^|[.-])(test|tst|sit|nft|qa)(\d*?)([.-]|$)/i.test(hostname)) return 'test';
        return 'production';
    };

    function setStatus(message, tone = '') {
        elements['easm-status'].className = `easm-status${tone ? ` is-${tone}` : ''}`;
        elements['easm-status'].lastElementChild.textContent = message;
    }

    function normaliseLiveAssets(text, domain) {
        const names = [...new Set(text.split(/\r?\n/).map(cleanDomain).filter(name => domainPattern.test(name) && (name === domain || name.endsWith(`.${domain}`))))].sort();
        return names.map(hostname => ({ hostname, type: hostname === domain ? 'root' : 'subdomain', environment: classifyEnvironment(hostname), sources: ['AgniOps'] }));
    }

    function serviceIcon(name) {
        return ({
            'Banking & Finance': '▥',
            'Government & Critical Infrastructure': '▦',
            'Telecommunications': '⌁',
            'Healthcare': '+',
            'Energy & Resources': 'ϟ',
            'Superannuation': '◉',
            'Retail, Food & Grocery': '▤',
            'Data Storage & Processing': '▧',
            'Defence Industry': '⛉',
            'Energy': 'ϟ',
            'Higher Education & Research': '△',
            'Space Technology': '◌',
            'Transport': '⇆',
            'Water & Sewerage': '≋',
            'Insurance': '◇',
            'Financial Markets': '↗'
        })[name] || '◇';
    }

    function renderServiceLines() {
        const counts = new Map();
        state.organisations.forEach(org => counts.set(org.serviceLine, (counts.get(org.serviceLine) || 0) + 1));
        const entries = [['All service lines', state.organisations.length], ...counts.entries()];
        elements['service-lines'].replaceChildren(...entries.map(([name, count]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `service-line${state.serviceLine === name ? ' active' : ''}`;
            button.innerHTML = `<span class="service-icon" aria-hidden="true">${serviceIcon(name)}</span><span class="service-name"></span><span class="service-count count-badge"></span>`;
            button.querySelector('.service-name').textContent = name;
            button.querySelector('.service-count').textContent = `${count} org${count === 1 ? '' : 's'}`;
            button.addEventListener('click', () => { state.serviceLine = name; renderServiceLines(); renderOrganisations(); });
            return button;
        }));
    }

    function filteredOrganisations() {
        const query = elements['organisation-search'].value.trim().toLowerCase();
        return state.organisations.filter(org => (state.serviceLine === 'All service lines' || org.serviceLine === state.serviceLine) && (!query || `${org.name} ${org.domain}`.toLowerCase().includes(query)));
    }

    function renderOrganisations() {
        const organisations = filteredOrganisations();
        elements['organisation-count'].textContent = organisations.length;
        if (!organisations.length) {
            const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'No organisations match this filter.';
            elements['organisation-list'].replaceChildren(empty); return;
        }
        elements['organisation-list'].replaceChildren(...organisations.map(org => {
            const button = document.createElement('button');
            button.type = 'button'; button.className = `organisation-item${state.selected?.id === org.id ? ' active' : ''}`;
            button.innerHTML = '<span class="organisation-avatar"></span><span class="organisation-copy"><strong></strong><span></span></span><span class="organisation-arrow" aria-hidden="true">›</span>';
            button.querySelector('.organisation-avatar').textContent = org.shortName;
            button.querySelector('strong').textContent = org.name;
            button.querySelector('.organisation-copy span').textContent = `${org.domain} • ${formatNumber(org.stats?.subdomains)} assets`;
            button.addEventListener('click', () => selectOrganisation(org));
            return button;
        }));
    }

    function selectOrganisation(org) {
        state.selected = org; state.visibleAssets = PAGE_SIZE; elements['domain-input'].value = org.domain;
        renderOrganisations(); renderDetails();
    }

    function renderDetails() {
        const org = state.selected;
        if (!org) return;
        const allAssets = org.assets || [];
        const assets = state.productionOnly ? allAssets.filter(asset => asset.environment === 'production') : allAssets;
        elements['root-domain-count'].textContent = allAssets.some(asset => asset.type === 'root') ? '1' : '0';
        elements['subdomain-count'].textContent = formatNumber(org.stats?.subdomains ?? allAssets.filter(asset => asset.type !== 'root').length);
        elements['subdomain-note'].textContent = state.productionOnly ? `${formatNumber(assets.length)} production assets shown` : 'Unique public hostnames';
        elements['overlap-count'].textContent = formatNumber(org.stats?.overlap);
        elements['source-count'].textContent = `${org.stats?.successfulSources || 0}/2`;
        elements['source-note'].textContent = org.live
            ? 'Live AgniOps query'
            : org.stale && org.stats?.successfulSources === 2
                ? 'Includes preserved source data'
                : org.stale ? 'One source unavailable' : 'Daily static snapshot';
        elements['asset-heading'].textContent = `Domains & subdomains — ${org.name}`;
        elements['asset-summary'].textContent = `${formatNumber(assets.length)} assets in current view`;
        elements['selected-domain'].textContent = org.domain;

        const visible = assets.slice(0, state.visibleAssets);
        elements['asset-rows'].replaceChildren(...visible.map(asset => {
            const row = document.createElement('tr');
            const hostname = document.createElement('td'); hostname.textContent = asset.hostname; hostname.title = asset.hostname;
            const type = document.createElement('td'); type.innerHTML = `<span class="asset-pill ${asset.type}"></span>`; type.firstElementChild.textContent = asset.type;
            const environment = document.createElement('td'); environment.innerHTML = `<span class="asset-pill ${asset.environment}"></span>`; environment.firstElementChild.textContent = asset.environment;
            row.append(hostname, type, environment); return row;
        }));
        if (!visible.length) {
            const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 3; cell.className = 'empty-state'; cell.textContent = 'No assets match this filter.'; row.append(cell); elements['asset-rows'].append(row);
        }
        elements['load-more'].hidden = visible.length >= assets.length;
        renderChart(assets);
    }

    function renderChart(assets) {
        const labels = ['production', 'staging', 'development', 'test'];
        const counts = Object.fromEntries(labels.map(label => [label, assets.filter(asset => asset.environment === label).length]));
        const max = Math.max(...Object.values(counts), 1);
        elements['environment-chart'].replaceChildren(...labels.map(label => {
            const row = document.createElement('div'); row.className = 'chart-row';
            row.innerHTML = '<span></span><div class="chart-track"><div class="chart-fill"></div></div><strong></strong>';
            row.firstElementChild.textContent = label;
            row.querySelector('.chart-fill').style.width = `${(counts[label] / max) * 100}%`;
            row.lastElementChild.textContent = formatNumber(counts[label]); return row;
        }));
    }

    function loadEmbeddedSnapshot() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'easm/Australia/data.js';
            script.onload = () => resolve(window.__PSC_EASM_DATA__);
            script.onerror = () => reject(new Error('the generated file snapshot could not be loaded'));
            document.head.appendChild(script);
        });
    }

    async function inspectDomain(domain) {
        if (!domainPattern.test(domain)) { setStatus('Enter a valid root domain, for example example.com.', 'error'); return; }
        const configured = state.organisations.find(org => org.domain === domain);
        if (configured) { selectOrganisation(configured); setStatus(`Showing the daily two-source snapshot for ${domain}.`); return; }
        setStatus(`Querying AgniOps for ${domain}…`);
        try {
            const response = await fetch(`${LIVE_SOURCE}${encodeURIComponent(domain)}`, { headers: { Accept: 'text/plain' } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const assets = normaliseLiveAssets(await response.text(), domain);
            const org = {
                id: `live-${domain}`, name: domain, shortName: domain.slice(0, 3).toUpperCase(), domain, serviceLine: 'Live inspection', live: true, assets,
                stats: { subdomains: assets.filter(asset => asset.type !== 'root').length, overlap: 0, successfulSources: 1 }
            };
            state.organisations = [org, ...state.data.organisations]; state.serviceLine = 'All service lines'; renderServiceLines(); selectOrganisation(org);
            history.replaceState(null, '', `${location.pathname}?domain=${encodeURIComponent(domain)}`);
            setStatus(`Live AgniOps result for ${domain}. crt.name is added by the next configured daily build.`, 'warning');
        } catch (error) {
            setStatus(`Live lookup failed for ${domain}: ${error.message}. Add it to organisations.json for daily two-source collection.`, 'error');
        }
    }

    async function initialise() {
        try {
            if (location.protocol === 'file:') {
                state.data = await loadEmbeddedSnapshot();
            } else {
                try {
                    const response = await fetch(DATA_URL, { cache: 'no-cache' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    state.data = await response.json();
                } catch (error) {
                    console.warn(`Using embedded EASM snapshot: ${error.message}`);
                    state.data = await loadEmbeddedSnapshot();
                }
            }
            if (!state.data) throw new Error('no generated snapshot is available');
            state.organisations = state.data.organisations || [];
            const date = new Date(state.data.generatedAt);
            elements['updated-at'].textContent = `Updated ${new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' }).format(date)} AEDT/AEST`;
            renderServiceLines(); renderOrganisations();
            const requested = cleanDomain(new URLSearchParams(location.search).get('domain') || 'commbank.com.au');
            await inspectDomain(requested);
        } catch (error) {
            setStatus(`The daily EASM snapshot could not be loaded: ${error.message}`, 'error');
        }
    }

    elements['domain-form'].addEventListener('submit', event => { event.preventDefault(); inspectDomain(cleanDomain(elements['domain-input'].value)); });
    elements['organisation-search'].addEventListener('input', renderOrganisations);
    elements['production-filter'].addEventListener('change', event => { state.productionOnly = event.target.checked; state.visibleAssets = PAGE_SIZE; renderDetails(); });
    elements['load-more'].addEventListener('click', () => { state.visibleAssets += PAGE_SIZE; renderDetails(); });
    initialise();
})();