// ============================================
// SERVICES — category menu, tarot cards, methodology modal
// ============================================

// --- Icon library (matches reference card set) ---
const ICON = {
    web:    '<svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="13" rx="1.5"/><path d="M8 21h8M12 17v4"/><path d="M6.5 8.5l-1.5 2 1.5 2M10 8l-1.5 4.5"/></svg>',
    infra:  '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/></svg>',
    api:    '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M3 8h18"/><text x="7.5" y="13.6" font-size="4.4" font-family="monospace" fill="currentColor" stroke="none">API</text><path d="M8.5 20V17M8.5 17l-1.5 1.5M8.5 17l1.5 1.5M15.5 17v3M15.5 20l-1.5-1.5M15.5 20l1.5-1.5"/></svg>',
    client: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="14" height="10" rx="1.5"/><path d="M3 9h14"/><rect x="8" y="11" width="13" height="9" rx="1.5"/><path d="M8 14h13"/></svg>',
    mobile: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.5 18.5h3"/><rect x="10" y="6" width="9" height="6.5" rx="1"/><path d="M10 8.5h9"/></svg>',
    social: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><path d="M4.5 18v-1a3.5 3.5 0 0 1 3.5-3.5h2a3.5 3.5 0 0 1 3.5 3.5v1M13.5 14.2a3.5 3.5 0 0 1 2.5-1.2h0a3.5 3.5 0 0 1 3.5 3.5v1"/></svg>',
    scada:  '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="4.5" rx="4" ry="2"/><rect x="5" y="11" width="5" height="4" rx="0.6"/><rect x="14" y="11" width="5" height="4" rx="0.6"/><rect x="9.5" y="19" width="5" height="3.4" rx="0.6"/><path d="M12 6.5v3M7.5 15v2.5h4.5M16.5 15v2.5h-4.5M12 17.5v1.5"/></svg>',
    radio:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.4"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 15.5a5 5 0 0 0 0-7M6 6a8.5 8.5 0 0 0 0 12M18 18a8.5 8.5 0 0 0 0-12"/></svg>',
    hardware:'<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="1"/><rect x="10" y="10" width="4" height="4" rx="0.6"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/></svg>',
    wireless:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M8.8 8.8a4.5 4.5 0 0 0 0 6.4M15.2 15.2a4.5 4.5 0 0 0 0-6.4"/></svg>',
    database:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V6"/><path d="M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8"/></svg>',
    redteam:'<svg viewBox="0 0 24 24"><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="12" cy="6.5" r="2.2"/><circle cx="16.5" cy="7.5" r="2.2"/><path d="M3.5 17.5v-1a3 3 0 0 1 3-3h2M20.5 17.5v-1a3 3 0 0 0-3-3h-2M9 18v-1.5a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3V18"/></svg>',
    physical:'<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="2.4"/><path d="M12 8.5v7M9 11l-4 0M9 11l-2-2M9 11l-2 2M15 11l4 0M15 11l2-2M15 11l2 2M12 15.5l-2.5 5M12 15.5l2.5 5"/></svg>',
    adversarial:'<svg viewBox="0 0 24 24"><circle cx="8" cy="5.5" r="2.2"/><path d="M8 8v9M8 20v-3"/><path d="M8 8.5h8l-1.8 2.2L16 13H8"/></svg>',

    // Defensive service icons
    appsec:  '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="10" height="18" rx="2"/><path d="M8 18h4"/><circle cx="17" cy="8" r="4.4"/><path d="M15.1 8l1.4 1.4L19 6.9"/></svg>',
    soc:     '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="1.5"/><path d="M3 8h18"/><circle cx="12" cy="13" r="2.2"/><path d="M12 9.8v-1M12 17.2v-1M15.2 13h1M7.8 13h1M14.3 10.7l.7-.7M9 16l.7-.7M14.3 15.3l.7.7M9 10l.7.7"/></svg>',
    asset:   '<svg viewBox="0 0 24 24"><rect x="9" y="2.5" width="10" height="7" rx="1"/><path d="M9 5.3h10"/><path d="M2.5 13.5l3.5 1.9 3.6.3c.9 0 .9 1.3 0 1.4l-2.6.1"/><path d="M20 12.8l-6 2.5M2.5 13.5V18l6.8 1.9L21 15.4c.9-.4.2-1.9-.8-1.5l-3.4 1.1"/></svg>',
    archrev: '<svg viewBox="0 0 24 24"><rect x="11" y="3.5" width="9" height="4" rx="1"/><rect x="11" y="10" width="9" height="4" rx="1"/><rect x="11" y="16.5" width="9" height="4" rx="1"/><path d="M11 5.5H5v13h6M5 12h6"/><path d="M7 8L5 5.5 3 8M7 16l-2 2.5L3 16"/></svg>',
    dlp:     '<svg viewBox="0 0 24 24"><path d="M12 22s7-3.5 7-9V5l-7-2.5L5 5v8c0 5.5 7 9 7 9z"/><ellipse cx="12" cy="9" rx="3.4" ry="1.4"/><path d="M8.6 9v3.4c0 .8 1.5 1.4 3.4 1.4s3.4-.6 3.4-1.4V9"/></svg>',
    ransom:  '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="15" rx="1.5"/><path d="M3 8h18M6 6h.01M8.2 6h.01"/><path d="M12 10.4l3.6 6.2H8.4L12 10.4z"/><path d="M12 12.8v1.6M12 15.9v.02"/></svg>',
    threat:  '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 6.5V4h2.5M17.5 4H20v2.5M20 17.5V20h-2.5M6.5 20H4v-2.5"/></svg>',
    risk:    '<svg viewBox="0 0 24 24"><path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.7.6 1 1.1 1 2.4h5.6c0-1.3.3-1.8 1-2.4A6 6 0 0 0 12 3z"/><path d="M11 8.4L9.6 9.8l1.4 1.4M13 8.4l1.4 1.4-1.4 1.4"/></svg>',
    config:  '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="13" height="9" rx="1.5"/><path d="M4 6h13M7 4.7h.01M9 4.7h.01"/><rect x="9" y="9" width="11" height="7" rx="1.2"/><path d="M9 11.4h11"/><path d="M11.5 19.5h7" stroke-dasharray="2 2"/></svg>',
    sourcecode:'<svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M8 20.5h8M12 16.5v4"/><path d="M6 8h5M6 10.3h7M6 12.6h4"/></svg>',
    password:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="13" rx="1.5"/><path d="M3 9h18M6 7h.01M8.2 7h.01"/><circle cx="8" cy="13.5" r="1"/><circle cx="11" cy="13.5" r="1"/><circle cx="14" cy="13.5" r="1"/><path d="M16.5 13.5H18"/></svg>',
    policy:  '<svg viewBox="0 0 24 24"><path d="M8 5h6l3.5 3.5V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M14 5v3.5h3.5"/><path d="M10.2 12l-1.2 1.2 1.2 1.2M13.4 12l1.2 1.2-1.2 1.2"/><path d="M4.5 8v11.5A1.5 1.5 0 0 0 6 21h8"/></svg>',

    // Training service icons
    seredteam: '<svg viewBox="0 0 24 24"><circle cx="6" cy="5.5" r="2.2"/><path d="M3 18v-3.5A2.5 2.5 0 0 1 5.5 12h1A2.5 2.5 0 0 1 9 14.5V18"/><circle cx="18" cy="5.5" r="2.2"/><path d="M15 18v-3.5A2.5 2.5 0 0 1 17.5 12h1A2.5 2.5 0 0 1 21 14.5V18"/><path d="M9.5 10h5M12.7 8.5L14.5 10l-1.8 1.5"/></svg>',
    tooldev:   '<svg viewBox="0 0 24 24"><path d="M7 20.5h9v-1.2c0-3.6-.8-6.5-3.1-8.6l1.3-1.5c.4-.5.1-1.3-.6-1.4l-2-.4-1.4-1.9c-.4-.5-1.3-.3-1.4.4L8.5 7C6.8 8 5.7 9.8 5.7 11.8l1.9-1.2 1.3 1.6-2.5 2c-.7.5-.3 1.7.6 1.7h.5c.8 0 1.2.5 1.2 1.2v3.4"/><circle cx="10.5" cy="9.3" r="0.6" fill="currentColor" stroke="none"/></svg>',
    osintasm:  '<svg viewBox="0 0 24 24"><circle cx="7" cy="6.5" r="2.3"/><path d="M2.5 15.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"/><path d="M2.5 15.5h9l-1 2.5H3.5z"/><rect x="13.5" y="3.5" width="8" height="5.5" rx="1.3"/><path d="M15.5 9v2.2l2.2-2.2M16 5.6h3.5M16 7.2h2"/></svg>',
    mobsec:    '<svg viewBox="0 0 24 24"><rect x="3.5" y="3" width="9" height="18" rx="2"/><path d="M6.5 18h3"/><rect x="10.5" y="6" width="10" height="8" rx="1.2"/><path d="M10.5 8.6h10M13 7.3h.01M15 7.3h.01"/><path d="M13.5 11h4"/></svg>',
    blueteam:  '<svg viewBox="0 0 24 24"><circle cx="7" cy="4.8" r="2.2"/><path d="M7 7.2v6.3M4.7 20l2.3-6.5L9.3 20"/><path d="M13 4v10M13 4l6 1.6-6 1.7"/></svg>',

    // Category icons
    offensive:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
    defensive:'<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
    training: '<svg viewBox="0 0 24 24"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>'
};

// --- Service catalogue ---
const CATEGORIES = [
    {
        id: 'offensive',
        icon: ICON.offensive,
        title: 'Offensive Security',
        blurb: 'We emulate real adversaries against your applications, networks, and people — finding attack paths before criminals do.',
        services: [
            {
                id: 'web', icon: ICON.web, name: 'Web Application Penetration Testing',
                overview: 'A manual, adversary-driven assessment of your web applications — uncovering injection, authentication, session, access-control, and business-logic flaws that automated scanners miss.',
                phases: [
                    ['Scoping & threat modelling', 'Define targets, roles, and abuse cases; map the application\'s trust boundaries and data flows.'],
                    ['Reconnaissance & mapping', 'Spider the app, enumerate endpoints, parameters, and technologies to build a complete attack surface.'],
                    ['Authentication & session testing', 'Attack login, MFA, password reset, JWT/session handling, and privilege boundaries.'],
                    ['Input & injection testing', 'Probe for SQLi, XSS, SSRF, SSTI, XXE, deserialization, and file-handling flaws.'],
                    ['Business-logic & access control', 'Test IDOR, horizontal/vertical privilege escalation, and workflow bypasses by hand.'],
                    ['Reporting & retest', 'Deliver ranked findings with proof-of-concept, then verify fixes in a free retest.']
                ],
                frameworks: ['OWASP WSTG', 'OWASP Top 10', 'OWASP ASVS', 'PTES', 'NIST SP 800-115'],
                deliverables: ['Risk-ranked findings with CVSS scoring', 'Reproducible proof-of-concept for each issue', 'Developer-focused remediation guidance', 'Executive summary + free remediation retest']
            },
            {
                id: 'infra', icon: ICON.infra, name: 'Infrastructure Penetration Testing',
                overview: 'Internal and external testing of servers, hosts, and network devices — modelling how an attacker gains a foothold, escalates privilege, and moves laterally through your estate.',
                phases: [
                    ['Scoping & rules of engagement', 'Agree external/internal scope, IP ranges, and safety constraints.'],
                    ['Enumeration & scanning', 'Discover live hosts, open ports, services, and versions across the estate.'],
                    ['Vulnerability analysis', 'Correlate findings, validate manually, and eliminate false positives.'],
                    ['Exploitation', 'Safely exploit validated weaknesses to prove real-world impact.'],
                    ['Privilege escalation & lateral movement', 'Pivot, harvest credentials, and demonstrate reach toward crown-jewel assets.'],
                    ['Reporting & retest', 'Document the kill chain and provide prioritized hardening steps.']
                ],
                frameworks: ['PTES', 'NIST SP 800-115', 'OSSTMM', 'MITRE ATT&CK', 'CIS Benchmarks'],
                deliverables: ['Full attack-path / kill-chain narrative', 'Host-by-host vulnerability register', 'Prioritized hardening roadmap', 'Executive risk briefing']
            },
            {
                id: 'api', icon: ICON.api, name: 'API & Web Services Penetration Testing',
                overview: 'Focused testing of REST, GraphQL, and SOAP APIs — where broken object-level authorization and weak validation are the leading cause of modern breaches.',
                phases: [
                    ['Specification review', 'Analyse OpenAPI/Swagger/GraphQL schemas to map every operation and object.'],
                    ['Authentication & authorization', 'Test tokens, scopes, and keys for BOLA/BFLA and broken auth.'],
                    ['Input & data validation', 'Fuzz parameters for injection, mass assignment, and excessive data exposure.'],
                    ['Rate limiting & resource abuse', 'Probe for throttling gaps, batching abuse, and denial-of-wallet.'],
                    ['Business-logic abuse', 'Chain endpoints to bypass intended workflows.'],
                    ['Reporting & retest', 'Deliver endpoint-level findings with sample requests and fixes.']
                ],
                frameworks: ['OWASP API Security Top 10', 'OWASP WSTG', 'PTES', 'NIST SP 800-115'],
                deliverables: ['Per-endpoint findings with raw request/response', 'BOLA/BFLA authorization matrix', 'Remediation guidance for developers', 'Free retest of fixes']
            },
            {
                id: 'client', icon: ICON.client, name: 'Thick & Thin Client Testing',
                overview: 'Assessment of desktop and client-server applications — reverse-engineering binaries, intercepting traffic, and inspecting local storage for exposed secrets and logic flaws.',
                phases: [
                    ['Architecture review', 'Map the two/three-tier design and client-server trust boundaries.'],
                    ['Binary & static analysis', 'Decompile and inspect the client for hardcoded secrets and weak crypto.'],
                    ['Traffic interception', 'Proxy and manipulate client-server communications, defeating pinning where present.'],
                    ['Local storage & memory', 'Examine files, registry, and memory for sensitive data at rest.'],
                    ['Privilege & DLL testing', 'Test for insecure permissions, DLL hijacking, and injection.'],
                    ['Reporting & retest', 'Provide findings with reproduction steps and remediation.']
                ],
                frameworks: ['OWASP WSTG', 'OWASP ASVS', 'PTES', 'CWE'],
                deliverables: ['Client-side and server-side findings', 'Extracted secrets / weak-crypto evidence', 'Remediation guidance', 'Free retest']
            },
            {
                id: 'mobile', icon: ICON.mobile, name: 'Mobile Application Penetration Testing',
                overview: 'iOS and Android testing across static, dynamic, and network layers — aligned to the OWASP Mobile standard to cover storage, crypto, platform, and code quality.',
                phases: [
                    ['Static analysis', 'Reverse-engineer the package for secrets, weak crypto, and insecure config.'],
                    ['Local data storage', 'Inspect keychains, databases, caches, and logs for sensitive data.'],
                    ['Dynamic / runtime testing', 'Hook the running app to bypass jailbreak/root and pinning detection.'],
                    ['Network communication', 'Intercept and tamper with API traffic and validate TLS handling.'],
                    ['Platform & IPC', 'Test deep links, exported components, and inter-process interfaces.'],
                    ['Reporting & retest', 'Deliver MASVS-mapped findings with remediation.']
                ],
                frameworks: ['OWASP MASVS', 'OWASP MASTG', 'OWASP Mobile Top 10', 'PTES'],
                deliverables: ['MASVS-mapped findings (iOS + Android)', 'Insecure-storage and traffic evidence', 'Developer remediation guidance', 'Free retest']
            },
            {
                id: 'social', icon: ICON.social, name: 'Social Engineering Assessment',
                overview: 'Controlled phishing, vishing, and pretexting campaigns that measure how your people respond to real-world manipulation — turning awareness into a metric.',
                phases: [
                    ['OSINT & target profiling', 'Build a realistic picture of the organization from public sources.'],
                    ['Pretext design', 'Craft believable scenarios and lures approved within rules of engagement.'],
                    ['Campaign delivery', 'Execute phishing / vishing / smishing and capture engagement metrics.'],
                    ['Payload & access simulation', 'Safely demonstrate what a click or credential could enable.'],
                    ['Analysis', 'Measure click, submit, and report rates against benchmarks.'],
                    ['Debrief & awareness', 'Report results and recommend targeted training.']
                ],
                frameworks: ['PTES (Social Engineering)', 'OSINT Framework', 'MITRE ATT&CK (Initial Access)', 'NIST SP 800-115'],
                deliverables: ['Click / submit / report metrics', 'Pretext and campaign timeline', 'Human-risk heat map', 'Awareness training recommendations']
            },
            {
                id: 'scada', icon: ICON.scada, name: 'OT & SCADA Penetration Testing',
                overview: 'Safety-first assessment of industrial control systems — using passive techniques and carefully staged testing to evaluate ICS/SCADA resilience without disrupting operations.',
                phases: [
                    ['Passive reconnaissance', 'Map the OT network and protocols with non-intrusive monitoring first.'],
                    ['Architecture & segmentation review', 'Assess the IT/OT boundary, DMZ, and Purdue-model zoning.'],
                    ['Protocol analysis', 'Examine Modbus, DNP3, S7, and OPC traffic for weaknesses.'],
                    ['Controlled testing', 'Validate findings on non-production or maintenance windows only.'],
                    ['Threat modelling', 'Map plausible attacks against ICS ATT&CK techniques.'],
                    ['Reporting & remediation', 'Deliver risk-ranked findings suited to OT constraints.']
                ],
                frameworks: ['ISA/IEC 62443', 'NIST SP 800-82', 'MITRE ATT&CK for ICS', 'Purdue Model'],
                deliverables: ['IT/OT segmentation assessment', 'ICS ATT&CK-mapped threat model', 'Safety-conscious remediation plan', 'Executive risk briefing']
            },
            {
                id: 'radio', icon: ICON.radio, name: 'Radio Hacking',
                overview: 'RF and software-defined-radio assessment of proprietary and standard wireless protocols — capturing, decoding, and replaying signals to expose insecure radio communications.',
                phases: [
                    ['Spectrum survey', 'Identify active frequencies and modulation with SDR sweeps.'],
                    ['Signal capture', 'Record target transmissions for offline analysis.'],
                    ['Demodulation & decoding', 'Reverse the protocol and extract the underlying data.'],
                    ['Replay & manipulation', 'Test for replay, spoofing, and command injection.'],
                    ['Crypto assessment', 'Evaluate rolling codes, encryption, and authentication.'],
                    ['Reporting', 'Document exposures with capture evidence and fixes.']
                ],
                frameworks: ['PTES', 'NIST SP 800-115', 'SDR methodology', 'CWE'],
                deliverables: ['Decoded protocol analysis', 'Replay / spoofing proof-of-concept', 'Signal capture evidence', 'Remediation guidance']
            },
            {
                id: 'hardware', icon: ICON.hardware, name: 'Hardware Hacking',
                overview: 'Physical device and embedded-systems testing — extracting firmware via debug interfaces, analysing it for secrets, and probing the hardware attack surface of IoT and embedded products.',
                phases: [
                    ['Teardown & recon', 'Identify chips, debug ports (UART/JTAG/SWD), and interfaces.'],
                    ['Interface access', 'Connect to debug and serial interfaces to reach the system.'],
                    ['Firmware extraction', 'Dump firmware from flash for offline analysis.'],
                    ['Firmware analysis', 'Hunt for hardcoded keys, backdoors, and weak crypto.'],
                    ['Fault & side-channel', 'Assess glitching and side-channel resistance where in scope.'],
                    ['Reporting', 'Deliver findings with hardware evidence and mitigations.']
                ],
                frameworks: ['OWASP IoT Top 10', 'OWASP ISVS', 'OWASP FSTM', 'PTES'],
                deliverables: ['Extracted firmware analysis', 'Hardware attack-surface map', 'Secret / backdoor evidence', 'Design-level remediation guidance']
            },
            {
                id: 'wireless', icon: ICON.wireless, name: 'Wireless Penetration Testing',
                overview: 'Assessment of Wi-Fi and other wireless networks — testing encryption, authentication, segmentation, and rogue-access-point resilience across your physical footprint.',
                phases: [
                    ['Wireless survey', 'Map SSIDs, signal reach, and authentication types on site.'],
                    ['Encryption & auth testing', 'Attack WPA2/WPA3, PSK, and enterprise (802.1X) configurations.'],
                    ['Rogue AP & evil twin', 'Test client behaviour against rogue and evil-twin access points.'],
                    ['Segmentation testing', 'Verify guest / corporate / OT wireless isolation.'],
                    ['Client attacks', 'Assess credential capture and karma-style attacks.'],
                    ['Reporting', 'Provide findings with signal maps and remediation.']
                ],
                frameworks: ['PTES', 'NIST SP 800-115', 'OWASP', 'IEEE 802.11'],
                deliverables: ['Wireless coverage & risk map', 'Encryption / segmentation findings', 'Rogue-AP resilience assessment', 'Remediation guidance']
            },
            {
                id: 'database', icon: ICON.database, name: 'Database Penetration Testing',
                overview: 'Configuration, access-control, and privilege testing of your database estate — ensuring sensitive data stores are hardened against direct and application-borne attack.',
                phases: [
                    ['Discovery & inventory', 'Enumerate database instances, versions, and exposure.'],
                    ['Configuration review', 'Benchmark hardening against CIS baselines.'],
                    ['Authentication & privilege', 'Test accounts, roles, and least-privilege enforcement.'],
                    ['Injection & access testing', 'Probe direct and application-layer injection paths.'],
                    ['Encryption & auditing', 'Assess data-at-rest encryption and logging coverage.'],
                    ['Reporting', 'Deliver hardening findings and remediation.']
                ],
                frameworks: ['CIS Benchmarks', 'OWASP', 'PTES', 'NIST SP 800-115'],
                deliverables: ['Configuration / hardening gap analysis', 'Privilege and access findings', 'Encryption & audit assessment', 'Remediation roadmap']
            },
            {
                id: 'redteam', icon: ICON.redteam, name: 'Red Team Exercise',
                overview: 'A full-scope, objective-driven adversary emulation — testing your people, process, and technology together, and measuring your blue team\'s ability to detect and respond.',
                phases: [
                    ['Objective setting', 'Agree crown-jewel goals and rules of engagement with stakeholders.'],
                    ['Reconnaissance', 'Build target intelligence across digital and human surfaces.'],
                    ['Initial access', 'Gain a foothold via phishing, exposure, or physical means.'],
                    ['Establish & expand', 'Set up C2, escalate, and move laterally toward objectives.'],
                    ['Actions on objective', 'Demonstrate impact against agreed crown-jewel targets.'],
                    ['Purple-team debrief', 'Replay the operation with defenders to improve detection.']
                ],
                frameworks: ['MITRE ATT&CK', 'TIBER-EU', 'CBEST', 'PTES', 'Cyber Kill Chain'],
                deliverables: ['End-to-end attack narrative', 'ATT&CK-mapped TTP breakdown', 'Detection & response gap analysis', 'Purple-team improvement plan']
            },
            {
                id: 'physical', icon: ICON.physical, name: 'Physical Security Assessment',
                overview: 'Real-world testing of facility defences — badge cloning, tailgating, lock bypass, and access-control evasion that measure whether digital security can be walked around.',
                phases: [
                    ['OSINT & site survey', 'Study the facility, entry points, and routines from open sources and observation.'],
                    ['Access control review', 'Assess badges, readers, turnstiles, and visitor process.'],
                    ['Covert entry attempts', 'Test tailgating, lock bypass, and badge cloning within scope.'],
                    ['Internal objectives', 'Attempt access to server rooms, desks, and sensitive areas.'],
                    ['Detection assessment', 'Evaluate guard, camera, and alarm response.'],
                    ['Reporting', 'Deliver findings with photographic evidence and fixes.']
                ],
                frameworks: ['PTES (Physical)', 'ASIS guidelines', 'NIST SP 800-115', 'MITRE ATT&CK (Physical)'],
                deliverables: ['Covert-entry narrative with evidence', 'Access-control weakness register', 'Detection & response assessment', 'Physical hardening recommendations']
            },
            {
                id: 'adversarial', icon: ICON.adversarial, name: 'Adversarial Simulation',
                overview: 'Threat-intelligence-led emulation of a specific adversary — replaying a known actor\'s TTPs to validate whether your detections fire against the threats you actually face.',
                phases: [
                    ['Threat selection', 'Choose a relevant adversary from intelligence on your sector.'],
                    ['TTP mapping', 'Break the actor down into concrete ATT&CK techniques.'],
                    ['Scenario build', 'Recreate tooling and tradecraft in a controlled emulation plan.'],
                    ['Execution', 'Run the techniques against your live environment safely.'],
                    ['Detection validation', 'Measure which techniques were detected, logged, or missed.'],
                    ['Purple-team tuning', 'Work with defenders to close detection gaps.']
                ],
                frameworks: ['MITRE ATT&CK', 'MITRE Engenuity', 'Atomic Red Team', 'Cyber Kill Chain'],
                deliverables: ['Adversary-emulation plan', 'Technique-by-technique detection scorecard', 'Logging & alerting gap analysis', 'Detection-engineering recommendations']
            }
        ]
    },
    {
        id: 'defensive',
        icon: ICON.defensive,
        title: 'Defensive Security',
        blurb: 'Detection and response capabilities that assume compromise — hunting active threats, responding to incidents, and hardening your architecture.',
        services: [
            {
                id: 'appsec', icon: ICON.appsec, name: 'Application Security Program',
                overview: 'We build or mature an end-to-end application security program — embedding security into every stage of the SDLC so vulnerabilities are prevented, not patched in production.',
                phases: [
                    ['Maturity assessment', 'Benchmark current AppSec practices against SAMM/BSIMM to find gaps.'],
                    ['Program design', 'Define governance, roles, gates, and tooling across the SDLC.'],
                    ['Shift-left integration', 'Embed SAST, DAST, SCA, and threat modelling into CI/CD pipelines.'],
                    ['Enablement', 'Train developers and champions to own security in their code.'],
                    ['Measure & mature', 'Track KPIs and iterate the program over time.']
                ],
                frameworks: ['OWASP SAMM', 'BSIMM', 'NIST SSDF', 'OWASP ASVS'],
                deliverables: ['AppSec maturity assessment', 'Target-state program blueprint', 'SDLC / CI-CD integration plan', 'Metrics and maturity roadmap']
            },
            {
                id: 'soc', icon: ICON.soc, name: 'Security Operation Center',
                overview: 'We design, build, or assess your SOC — turning raw telemetry into 24/7 detection and response with the people, process, and technology to match your threat profile.',
                phases: [
                    ['Current-state review', 'Assess existing monitoring, staffing, and processes against a SOC maturity model.'],
                    ['Use-case & data design', 'Define detection use cases and onboard the right log sources.'],
                    ['Detection engineering', 'Build and tune ATT&CK-mapped rules to cut false positives.'],
                    ['Playbook development', 'Create triage and escalation runbooks for analysts.'],
                    ['Operate & optimize', 'Run continuous tuning and coverage reviews.']
                ],
                frameworks: ['MITRE ATT&CK', 'NIST CSF', 'SOC-CMM', 'Sigma'],
                deliverables: ['SOC maturity assessment', 'Detection use-case catalogue', 'Analyst triage playbooks', 'Coverage gap roadmap']
            },
            {
                id: 'asset', icon: ICON.asset, name: 'Asset Identification',
                overview: 'You can\'t protect what you can\'t see. We discover and inventory every hardware, software, cloud, and data asset — establishing the authoritative baseline all other controls depend on.',
                phases: [
                    ['Discovery', 'Actively and passively enumerate hosts, services, cloud, and shadow IT.'],
                    ['Classification', 'Categorize assets by type, owner, and business criticality.'],
                    ['Data mapping', 'Locate sensitive data stores and their flows.'],
                    ['Gap analysis', 'Identify unmanaged, unpatched, and end-of-life assets.'],
                    ['Inventory handover', 'Deliver a living inventory and governance process.']
                ],
                frameworks: ['CIS Controls 1 & 2', 'NIST CSF (Identify)', 'ISO 27001 A.8', 'NIST SP 800-53'],
                deliverables: ['Authoritative asset inventory', 'Data-store & flow map', 'Shadow-IT / EOL asset register', 'Asset governance process']
            },
            {
                id: 'archrev', icon: ICON.archrev, name: 'Architecture Review',
                overview: 'A design-level review of your environment against zero-trust and defence-in-depth principles — finding structural weaknesses in the blueprint before attackers exploit them.',
                phases: [
                    ['Architecture discovery', 'Document systems, data flows, and trust boundaries.'],
                    ['Control assessment', 'Evaluate segmentation, identity, and layered defences.'],
                    ['Gap analysis', 'Compare against zero-trust and best-practice baselines.'],
                    ['Threat modelling', 'Model attack paths against the design.'],
                    ['Roadmap', 'Prioritize architectural improvements.']
                ],
                frameworks: ['NIST SP 800-207 (Zero Trust)', 'SABSA', 'NIST CSF', 'CIS Controls'],
                deliverables: ['Architecture risk assessment', 'Zero-trust gap analysis', 'Design-level threat model', 'Prioritized improvement roadmap']
            },
            {
                id: 'dlp', icon: ICON.dlp, name: 'Data Leakage Prevention',
                overview: 'We assess and strengthen your defences against data exfiltration — classifying sensitive data, mapping its flows, and designing DLP controls that stop leaks without slowing the business.',
                phases: [
                    ['Data discovery & classification', 'Locate and label sensitive data across endpoints, cloud, and email.'],
                    ['Flow mapping', 'Trace how data moves and where it can escape.'],
                    ['Control assessment', 'Evaluate existing DLP, encryption, and egress controls.'],
                    ['Policy design', 'Define enforceable DLP policies and response actions.'],
                    ['Tuning & rollout', 'Pilot, tune for false positives, and operationalize.']
                ],
                frameworks: ['NIST CSF (Protect)', 'CIS Control 3', 'ISO 27001', 'Cloud Security Alliance CCM'],
                deliverables: ['Sensitive-data classification map', 'Exfiltration path analysis', 'DLP policy set', 'Rollout and tuning plan']
            },
            {
                id: 'ransom', icon: ICON.ransom, name: 'Ransomware Protection',
                overview: 'A focused readiness assessment against the full ransomware kill chain — from initial access to encryption — testing your ability to prevent, detect, contain, and recover.',
                phases: [
                    ['Attack-surface review', 'Assess exposure to common ransomware entry vectors.'],
                    ['Control evaluation', 'Test hardening, segmentation, EDR, and email defences.'],
                    ['Backup & recovery review', 'Validate immutable backups and restore capability.'],
                    ['Detection assessment', 'Check detection coverage against ransomware TTPs.'],
                    ['Resilience roadmap', 'Prioritize gaps across prevent / detect / recover.']
                ],
                frameworks: ['NIST CSF', 'CISA #StopRansomware', 'MITRE ATT&CK', 'NIST SP 1800-25/26'],
                deliverables: ['Ransomware readiness scorecard', 'Backup & recovery validation', 'Detection coverage assessment', 'Resilience improvement roadmap']
            },
            {
                id: 'threat', icon: ICON.threat, name: 'Threat Assessment',
                overview: 'A structured threat-modelling exercise that identifies who would attack you, how, and against which assets — turning abstract risk into concrete, prioritized attack scenarios.',
                phases: [
                    ['Asset & scope definition', 'Identify crown-jewel assets and system boundaries.'],
                    ['Threat actor profiling', 'Determine relevant adversaries and their motivations.'],
                    ['Attack modelling', 'Enumerate threats using STRIDE and ATT&CK techniques.'],
                    ['Impact & likelihood rating', 'Score each scenario by business impact.'],
                    ['Mitigation mapping', 'Recommend controls against the highest-priority threats.']
                ],
                frameworks: ['STRIDE', 'MITRE ATT&CK', 'PASTA', 'NIST SP 800-30'],
                deliverables: ['Threat model & actor profiles', 'Prioritized attack scenarios', 'Impact / likelihood matrix', 'Control recommendations']
            },
            {
                id: 'risk', icon: ICON.risk, name: 'Risk Analysis',
                overview: 'A quantitative and qualitative risk assessment that translates technical exposure into business terms — giving leadership a defensible basis for security investment decisions.',
                phases: [
                    ['Scoping & context', 'Establish risk appetite, assets, and assessment boundaries.'],
                    ['Threat & vulnerability analysis', 'Identify credible threats and exploitable weaknesses.'],
                    ['Risk evaluation', 'Score likelihood and impact for each risk.'],
                    ['Treatment options', 'Recommend accept / mitigate / transfer / avoid decisions.'],
                    ['Risk register', 'Deliver a living register and reporting cadence.']
                ],
                frameworks: ['NIST SP 800-30', 'ISO 27005', 'FAIR', 'NIST CSF'],
                deliverables: ['Prioritized risk register', 'Quantified risk ratings', 'Treatment recommendations', 'Board-ready risk report']
            },
            {
                id: 'config', icon: ICON.config, name: 'Configuration Review',
                overview: 'A benchmark-driven review of system, cloud, and device configurations — catching the insecure defaults and drift that automated attackers exploit first.',
                phases: [
                    ['Scope & baseline selection', 'Choose applicable CIS / STIG baselines per platform.'],
                    ['Configuration capture', 'Collect settings from systems, cloud, and network devices.'],
                    ['Benchmark comparison', 'Measure current state against hardening standards.'],
                    ['Gap prioritization', 'Rank misconfigurations by exploitability and impact.'],
                    ['Remediation guidance', 'Provide step-by-step hardening instructions.']
                ],
                frameworks: ['CIS Benchmarks', 'DISA STIGs', 'NIST SP 800-70', 'Cloud provider baselines'],
                deliverables: ['Configuration gap analysis', 'Per-platform hardening findings', 'Prioritized remediation steps', 'Reusable hardening baselines']
            },
            {
                id: 'sourcecode', icon: ICON.sourcecode, name: 'Source Code Review',
                overview: 'A hybrid manual and tool-assisted review of your source code — tracing data flows to find injection, auth, crypto, and logic flaws that black-box testing cannot reach.',
                phases: [
                    ['Scoping & threat context', 'Identify sensitive components and trust boundaries.'],
                    ['Automated analysis', 'Run SAST/SCA to surface candidate issues at scale.'],
                    ['Manual deep-dive', 'Trace data flows through auth, input handling, and crypto by hand.'],
                    ['Validation', 'Confirm exploitability and eliminate false positives.'],
                    ['Reporting & retest', 'Deliver findings with fixed-code examples.']
                ],
                frameworks: ['OWASP Code Review Guide', 'OWASP ASVS', 'SANS/CWE Top 25', 'NIST SSDF'],
                deliverables: ['Line-referenced findings', 'Data-flow / taint analysis', 'Secure-code remediation examples', 'Free retest of fixes']
            },
            {
                id: 'password', icon: ICON.password, name: 'Password Audit',
                overview: 'A controlled audit of your organization\'s credential strength — safely cracking password hashes to expose weak, reused, and breached passwords before attackers do.',
                phases: [
                    ['Scope & authorization', 'Agree targets and secure handling of credential material.'],
                    ['Hash extraction', 'Safely obtain password hashes from directory services.'],
                    ['Offline cracking', 'Run dictionary, rule, and brute-force analysis offline.'],
                    ['Analysis', 'Measure weak, reused, breached, and non-expiring passwords.'],
                    ['Reporting', 'Report metrics and policy recommendations — never plaintext.']
                ],
                frameworks: ['NIST SP 800-63B', 'CIS Control 5', 'MITRE ATT&CK (Credential Access)', 'OWASP ASVS'],
                deliverables: ['Password strength metrics', 'Weak / reused / breached analysis', 'Policy & MFA recommendations', 'Executive summary']
            },
            {
                id: 'policy', icon: ICON.policy, name: 'Security Policy Review',
                overview: 'A review of your security policies, standards, and procedures against leading frameworks — closing the gap between what your documents say and what good practice requires.',
                phases: [
                    ['Document inventory', 'Collect existing policies, standards, and procedures.'],
                    ['Framework mapping', 'Map documents against ISO 27001 / NIST CSF controls.'],
                    ['Gap analysis', 'Identify missing, outdated, or conflicting policies.'],
                    ['Benchmarking', 'Compare against industry best practice.'],
                    ['Recommendations', 'Provide revised templates and a governance plan.']
                ],
                frameworks: ['ISO 27001 / 27002', 'NIST CSF', 'CIS Controls', 'COBIT'],
                deliverables: ['Policy gap analysis', 'Framework coverage map', 'Updated policy templates', 'Governance improvement plan']
            }
        ]
    },
    {
        id: 'training',
        icon: ICON.training,
        title: 'Training & Education',
        blurb: 'Hands-on, specialist courses built from real engagements and delivered by researchers who present at Black Hat and DEF CON — your team learns by doing.',
        services: [
            {
                id: 'se-redteam', icon: ICON.seredteam, name: 'Social Engineering for Red Team Engagements',
                overview: 'An advanced course teaching the human-manipulation tradecraft used in authorized red team operations — from OSINT-driven pretext design to live phishing, vishing, and physical pretexting, all within strict rules of engagement.',
                phases: [
                    ['Psychology foundations', 'Study influence principles and how real attackers weaponize them.'],
                    ['Target reconnaissance', 'Use OSINT to build pretexts and identify human attack paths.'],
                    ['Pretext & campaign design', 'Craft believable scenarios, lures, and infrastructure safely.'],
                    ['Live delivery labs', 'Practise phishing, vishing, and pretexting in a controlled range.'],
                    ['Rules of engagement & ethics', 'Operate legally, safely, and within authorization at all times.']
                ],
                frameworks: ['PTES (Social Engineering)', 'MITRE ATT&CK (Initial Access)', 'OSINT Framework', 'Cialdini Principles of Influence'],
                deliverables: ['Course materials & pretext playbooks', 'Controlled phishing / vishing labs', 'Rules-of-engagement templates', 'Certificate of completion']
            },
            {
                id: 'tool-dev', icon: ICON.tooldev, name: 'Offensive Tool Development for Covert Operations',
                overview: 'A deep-technical course on engineering custom offensive tooling for authorized red team and adversary-emulation work — building implants and tradecraft that safely test how well modern defences detect novel threats.',
                phases: [
                    ['Development foundations', 'Set up a safe lab and learn low-level languages and OPSEC.'],
                    ['Custom payload engineering', 'Build modular implants and loaders from first principles.'],
                    ['C2 & communications', 'Design command-and-control channels and covert comms.'],
                    ['Detection & evasion theory', 'Understand EDR/AV internals to build and then defeat detections.'],
                    ['Purple-team validation', 'Test tooling against defences and feed results back to blue teams.']
                ],
                frameworks: ['MITRE ATT&CK', 'Adversary Emulation (MITRE Engenuity)', 'Malware Dev / OPSEC principles', 'Authorized-use ethics'],
                deliverables: ['Lab environment & source templates', 'Custom-tooling reference implementations', 'Detection-engineering notes for blue teams', 'Certificate of completion']
            },
            {
                id: 'osint-asm', icon: ICON.osintasm, name: 'OSINT for Attack Surface Management',
                overview: 'A practical course teaching teams to see their organization the way an attacker does — using open-source intelligence to continuously discover, monitor, and reduce the external attack surface.',
                phases: [
                    ['OSINT foundations', 'Master sources, tooling, and collection operational security.'],
                    ['Asset & footprint discovery', 'Enumerate domains, IPs, cloud, and exposed services.'],
                    ['Exposure & leak monitoring', 'Hunt for credential leaks, shadow IT, and data exposure.'],
                    ['Continuous ASM', 'Stand up repeatable monitoring and alerting workflows.'],
                    ['Reporting & reduction', 'Prioritize and drive down real external risk.']
                ],
                frameworks: ['OSINT Framework', 'MITRE ATT&CK (Reconnaissance)', 'NIST CSF (Identify)', 'Diamond Model'],
                deliverables: ['OSINT & ASM toolkit', 'Attack-surface discovery labs', 'Continuous-monitoring playbooks', 'Certificate of completion']
            },
            {
                id: 'mobile-sec', icon: ICON.mobsec, name: 'Mobile Application Security Testing',
                overview: 'A hands-on course covering the full iOS and Android testing workflow — static, dynamic, and network analysis — aligned to the OWASP mobile standard so engineers can assess apps end to end.',
                phases: [
                    ['Mobile fundamentals', 'Platform security models, tooling, and lab setup.'],
                    ['Static analysis', 'Reverse-engineer packages for secrets and weak crypto.'],
                    ['Dynamic & runtime testing', 'Hook running apps and bypass root/jailbreak and pinning.'],
                    ['Network & API testing', 'Intercept and tamper with mobile back-end traffic.'],
                    ['Assessment', 'Prove skills against a scored vulnerable-app range.']
                ],
                frameworks: ['OWASP MASVS', 'OWASP MASTG', 'OWASP Mobile Top 10', 'PTES'],
                deliverables: ['iOS & Android lab access', 'Static + dynamic testing exercises', 'MASVS-aligned checklists', 'Certificate of completion']
            },
            {
                id: 'blueteam-cti', icon: ICON.blueteam, name: 'Blueteam Tactics — Reactive to Proactive CTI',
                overview: 'A course that matures defenders from reactive alert-chasing to proactive, intelligence-led defence — operationalizing cyber threat intelligence to anticipate and hunt the threats you actually face.',
                phases: [
                    ['Intelligence fundamentals', 'The intelligence cycle, sources, and CTI maturity.'],
                    ['Threat modelling', 'Map relevant adversaries and TTPs to your environment.'],
                    ['Detection engineering', 'Turn intelligence into ATT&CK-mapped detections.'],
                    ['Proactive threat hunting', 'Run hypothesis-driven hunts from intelligence leads.'],
                    ['Operationalizing CTI', 'Embed intelligence into SOC and response workflows.']
                ],
                frameworks: ['MITRE ATT&CK', 'Diamond Model', 'F3EAD', 'Pyramid of Pain'],
                deliverables: ['CTI courseware & templates', 'Threat-hunting labs', 'Detection-engineering exercises', 'Certificate of completion']
            }
        ]
    }
];

// --- Render ---
const catMenu = document.getElementById('cat-menu');
const svcPanel = document.getElementById('svc-panel');

if (catMenu && svcPanel) {
    const lookup = {};

    // Build category menu
    CATEGORIES.forEach((cat, i) => {
        cat.services.forEach(s => { lookup[cat.id + ':' + s.id] = { cat, s }; });

        const btn = document.createElement('button');
        btn.className = 'cat-card' + (i === 0 ? ' active' : '');
        btn.dataset.cat = cat.id;
        btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        btn.innerHTML = `
            <span class="cat-index">0${i + 1} / SERVICE LINE</span>
            <div class="card-icon">${cat.icon}</div>
            <h3>${cat.title}</h3>
            <p>${cat.blurb}</p>
            <span class="cat-count">${cat.services.length} capabilities &rarr;</span>`;
        btn.addEventListener('click', () => selectCategory(cat.id));
        catMenu.appendChild(btn);
    });

    function selectCategory(id) {
        document.querySelectorAll('.cat-card').forEach(c => {
            const on = c.dataset.cat === id;
            c.classList.toggle('active', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        const cat = CATEGORIES.find(c => c.id === id);
        svcPanel.innerHTML = `
            <div class="svc-panel-head">
                <h2>${cat.title}</h2>
                <span class="svc-panel-tag">// ${cat.services.length} capabilities — select for methodology</span>
            </div>
            <div class="svc-grid"></div>`;
        const grid = svcPanel.querySelector('.svc-grid');
        cat.services.forEach((s, i) => {
            const card = document.createElement('button');
            card.className = 'svc-card';
            card.style.animation = `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 45, 400)}ms both`;
            card.innerHTML = `
                <div class="svc-icon">${s.icon}</div>
                <h4>${s.name}</h4>
                <div class="svc-accent"></div>`;
            card.addEventListener('click', () => openModal(cat.id, s.id));
            grid.appendChild(card);
        });
    }

    // --- Modal ---
    const backdrop = document.getElementById('svc-modal');
    const modalBody = document.getElementById('svc-modal-body');
    let lastFocus = null;

    function openModal(catId, svcId) {
        const { s } = lookup[catId + ':' + svcId];
        lastFocus = document.activeElement;
        modalBody.innerHTML = `
            <button class="modal-close" id="modal-close" aria-label="Close">&times;</button>
            <div class="modal-icon">${s.icon}</div>
            <span class="modal-eyebrow">Methodology / How we conduct it</span>
            <h2>${s.name}</h2>
            <p class="modal-overview">${s.overview}</p>

            <h3>Engagement phases</h3>
            <ol class="phase-list">
                ${s.phases.map(p => `<li><strong>${p[0]}</strong><span>${p[1]}</span></li>`).join('')}
            </ol>

            <h3>Frameworks &amp; standards</h3>
            <div class="chip-row">
                ${s.frameworks.map(f => `<span class="chip">${f}</span>`).join('')}
            </div>

            <h3>What you receive</h3>
            <ul class="deliver-list">
                ${s.deliverables.map(d => `<li>${d}</li>`).join('')}
            </ul>

            <div class="modal-cta">
                <span>Ready to scope this engagement?</span>
                <a href="contact.html" class="btn btn-primary">Request this assessment
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
            </div>`;
        backdrop.classList.add('open');
        document.body.classList.add('modal-open');
        backdrop.setAttribute('aria-hidden', 'false');
        const closeBtn = document.getElementById('modal-close');
        closeBtn.focus();
        closeBtn.addEventListener('click', closeModal);
    }

    function closeModal() {
        backdrop.classList.remove('open');
        document.body.classList.remove('modal-open');
        backdrop.setAttribute('aria-hidden', 'true');
        if (lastFocus) lastFocus.focus();
    }

    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && backdrop.classList.contains('open')) closeModal();
    });

    // Init — respect #hash (offensive/defensive/training)
    const hash = location.hash.replace('#', '');
    const initial = CATEGORIES.find(c => c.id === hash) ? hash : 'offensive';
    selectCategory(initial);
}
