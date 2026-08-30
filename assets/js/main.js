// ============================================
// PREEMPTIVE CS — Core interactions + fancy layer
// ============================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Mobile menu ----------
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ---------- Navbar border + scroll progress ----------
const navbar = document.querySelector('.navbar');
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

const onScroll = () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Film grain ----------
const grain = document.createElement('div');
grain.className = 'grain-overlay';
document.body.appendChild(grain);

// ---------- Cursor glow (desktop only) ----------
if (finePointer && !prefersReducedMotion) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.opacity = '0';
    document.body.appendChild(glow);

    let gx = -600, gy = -600, tx = gx, ty = gy;

    window.addEventListener('mousemove', e => {
        tx = e.clientX;
        ty = e.clientY;
        glow.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });

    (function animateGlow() {
        gx += (tx - gx) * 0.08;
        gy += (ty - gy) * 0.08;
        glow.style.left = gx + 'px';
        glow.style.top = gy + 'px';
        requestAnimationFrame(animateGlow);
    })();
}

// ---------- Targeting reticle cursor (desktop only) ----------
if (finePointer && !prefersReducedMotion) {
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.style.opacity = '0';
    dot.style.opacity = '0';
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    let rx = -100, ry = -100, dx = rx, dy = ry;

    window.addEventListener('mousemove', e => {
        dx = e.clientX;
        dy = e.clientY;
        dot.style.left = dx + 'px';
        dot.style.top = dy + 'px';
        ring.style.opacity = '1';
        dot.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        ring.style.opacity = '0';
        dot.style.opacity = '0';
    });

    (function animateRing() {
        rx += (dx - rx) * 0.18;
        ry += (dy - ry) * 0.18;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animateRing);
    })();

    document.querySelectorAll('a, button, .capability, .card').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
}

// ---------- Text decrypt / scramble effect ----------
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#0101';

function scrambleIn(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
        if (node.textContent.trim()) nodes.push({ node, original: node.textContent });
    }
    if (!nodes.length) return;

    const duration = 1100;
    const start = performance.now();

    function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        nodes.forEach(({ node, original }) => {
            const revealCount = Math.floor(original.length * t);
            let out = original.slice(0, revealCount);
            for (let i = revealCount; i < original.length; i++) {
                out += original[i] === ' ' ? ' '
                    : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
            node.textContent = out;
        });
        if (t < 1) requestAnimationFrame(frame);
        else nodes.forEach(({ node, original }) => { node.textContent = original; });
    }
    requestAnimationFrame(frame);
}

if (!prefersReducedMotion) {
    const decryptTarget = document.querySelector('.hero-title') || document.querySelector('.page-header h1');
    if (decryptTarget) setTimeout(() => scrambleIn(decryptTarget), 250);
}

// ---------- Matrix rain in hero ----------
const heroBg = document.querySelector('.hero-bg');
if (heroBg && !prefersReducedMotion) {
    ['b1', 'b2', 'b3'].forEach(cls => {
        const blob = document.createElement('div');
        blob.className = 'aurora-blob ' + cls;
        heroBg.appendChild(blob);
    });

    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    heroBg.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const GLYPHS = '01<>/{}[]#$%&*+=?アイウエオカキクケコ';
    let columns = [];

    function sizeCanvas() {
        canvas.width = heroBg.offsetWidth;
        canvas.height = heroBg.offsetHeight;
        const count = Math.floor(canvas.width / 26);
        columns = Array.from({ length: count }, () => Math.random() * -60);
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas, { passive: true });

    setInterval(() => {
        ctx.fillStyle = 'rgba(3, 8, 6, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '13px "JetBrains Mono", monospace';
        columns.forEach((y, i) => {
            const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            ctx.fillStyle = Math.random() > 0.96 ? '#A6F3C5' : '#2FE383';
            ctx.fillText(char, i * 26, y * 18);
            columns[i] = y * 18 > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
        });
    }, 66);
}

// ---------- Spotlight cards ----------
if (finePointer) {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }, { passive: true });
    });
}

// ---------- Active nav link ----------
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-menu a').forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === currentPage) link.classList.add('active');
});

// ---------- Scroll reveal ----------
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

document.querySelectorAll('[data-stagger]').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
        child.classList.add('reveal');
        child.style.transitionDelay = `${Math.min(i * 70, 420)}ms`;
        revealObserver.observe(child);
    });
});

// ---------- Count-up numbers ----------
// Animates elements like "$4.35M", "500+", "1,000+", "99%". Skips "24/7".
function animateCount(el) {
    const original = el.textContent.trim();
    const match = original.match(/^([^0-9]*)([\d,]+(?:\.\d+)?)([^0-9]*)$/);
    if (!match) return; // e.g. "24/7" — leave as is

    const prefix = match[1];
    const suffix = match[3];
    const target = parseFloat(match[2].replace(/,/g, ''));
    const decimals = (match[2].split('.')[1] || '').length;
    const hasComma = match[2].includes(',');
    const duration = 1400;
    const start = performance.now();

    function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        let val = (target * eased).toFixed(decimals);
        if (hasComma) val = Number(val).toLocaleString('en-US', { minimumFractionDigits: decimals });
        el.textContent = prefix + val + suffix;
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = original;
    }
    requestAnimationFrame(frame);
}

const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (!prefersReducedMotion) animateCount(entry.target);
            countObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.num, .stat-value').forEach(el => countObserver.observe(el));

// ---------- Terminal — character-by-character typing ----------
const terminalBody = document.getElementById('terminal-body');
if (terminalBody) {
    const lines = [
        { type: 'cmd', text: './preemptive --scan target.corp' },
        { type: 'out', cls: 't-dim',  text: '[*] Initializing reconnaissance module...' },
        { type: 'out', cls: 't-dim',  text: '[*] Enumerating attack surface... 214 endpoints found' },
        { type: 'out', cls: 't-ok',   text: '[+] Web application layer mapped' },
        { type: 'out', cls: 't-warn', text: '[!] Weak TLS configuration detected on api.target.corp' },
        { type: 'out', cls: 't-crit', text: '[!!] CRITICAL: SQLi vector confirmed — /v2/auth' },
        { type: 'out', cls: 't-ok',   text: '[+] Report generated → findings_2026.pdf' },
        { type: 'cmd', text: 'Threats neutralized. Before they happen.' }
    ];

    const cursor = document.createElement('span');
    cursor.className = 'cursor-blink';
    terminalBody.textContent = '';
    terminalBody.appendChild(cursor);

    function typeCommand(line, done) {
        const row = document.createElement('div');
        row.innerHTML = '<span class="t-prompt">➜</span> <span class="t-cmd"></span>';
        terminalBody.insertBefore(row, cursor.parentElement === terminalBody ? cursor : null);
        const target = row.querySelector('.t-cmd');
        target.appendChild(cursor);
        let i = 0;
        (function tick() {
            if (i < line.text.length) {
                target.insertBefore(document.createTextNode(line.text[i]), cursor);
                i++;
                setTimeout(tick, prefersReducedMotion ? 0 : 22 + Math.random() * 40);
            } else {
                setTimeout(done, 350);
            }
        })();
    }

    function printOutput(line, done) {
        const row = document.createElement('div');
        row.innerHTML = `<span class="${line.cls}">${line.text}</span>`;
        terminalBody.insertBefore(row, null);
        terminalBody.appendChild(cursor);
        setTimeout(done, prefersReducedMotion ? 0 : 320 + Math.random() * 260);
    }

    function run(idx) {
        if (idx >= lines.length) {
            const rest = document.createElement('div');
            rest.appendChild(cursor);
            terminalBody.appendChild(rest);
            return;
        }
        const line = lines[idx];
        const next = () => run(idx + 1);
        if (line.type === 'cmd') typeCommand(line, next);
        else printOutput(line, next);
    }

    const terminalObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            setTimeout(() => run(0), 600);
            terminalObserver.disconnect();
        }
    }, { threshold: 0.3 });

    terminalObserver.observe(terminalBody);
}
