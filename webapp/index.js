/* ==========================================
   CutMaster Landing — Scroll-Driven Engine
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ========================================
    // 1. KINETIC TEXT — Scroll-driven fly-through
    // ========================================
    const kineticText = document.getElementById('kinetic-text');
    const heroRevealed = document.getElementById('hero-revealed');
    const heroSection = document.getElementById('hero');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const word = 'CutMaster';

    // Inject individual letter spans
    kineticText.innerHTML = word.split('').map((letter, i) => {
        // Small random X/Y drift per letter for organic spread
        const driftX = (Math.random() - 0.5) * 200;
        const driftY = (Math.random() - 0.5) * 120;
        return `<span class="letter" data-dx="${driftX}" data-dy="${driftY}" style="--i:${i}">${letter}</span>`;
    }).join('');

    const letters = kineticText.querySelectorAll('.letter');

    if (!prefersReducedMotion) {
        function updateHeroOnScroll() {
            const heroRect = heroSection.getBoundingClientRect();
            const heroHeight = heroSection.offsetHeight;
            const viewportH = window.innerHeight;

            // progress: 0 at top, 1 when hero fully scrolled
            const scrolled = -heroRect.top;
            const maxScroll = heroHeight - viewportH;
            const progress = Math.max(0, Math.min(1, scrolled / maxScroll));

            // --- Scroll indicator ---
            if (scrollIndicator) {
                scrollIndicator.style.opacity = progress < 0.03 ? '0.4' : '0';
            }

            // --- Hide aurora/particles after hero ---
            const heroAurora = document.querySelector('.hero-aurora');
            const particleCanvas = document.getElementById('particle-canvas');
            const fadeProg = Math.max(0, Math.min(1, (progress - 0.8) / 0.2));
            if (heroAurora) heroAurora.style.opacity = 0.1 * (1 - fadeProg);
            if (particleCanvas) particleCanvas.style.opacity = 1 - fadeProg;

            // ============================
            // Phase 1 (0–0.1): Text at rest
            // Phase 2 (0.1–0.55): Letters fly toward camera using translateZ
            // Phase 3 (0.55–0.8): Fully gone, reveal fades in
            // ============================

            if (progress <= 0.1) {
                // Text at rest, visible
                kineticText.style.visibility = 'visible';
                kineticText.style.opacity = '1';
                letters.forEach(letter => {
                    letter.style.transform = 'translateX(0) translateY(0) translateZ(0)';
                    letter.style.opacity = '1';
                    letter.style.filter = '';
                });
                heroRevealed.classList.remove('active');

            } else if (progress <= 0.55) {
                // Fly-through phase
                kineticText.style.visibility = 'visible';
                const flyProg = (progress - 0.1) / 0.45; // 0→1

                letters.forEach((letter, i) => {
                    // Each letter starts slightly later for cascade
                    const stagger = i * 0.05;
                    const local = Math.max(0, Math.min(1, (flyProg - stagger) / (1 - stagger * 0.5)));

                    // Ease-in (accelerating) for "rushing toward you" feel
                    const eased = local * local * local;

                    // translateZ moves text toward camera (perspective on parent)
                    const z = eased * 1800;
                    // Spread out on X/Y
                    const dx = parseFloat(letter.dataset.dx) * eased;
                    const dy = parseFloat(letter.dataset.dy) * eased;
                    // Opacity: fully visible until 40% through, then fade
                    const opacity = local < 0.4 ? 1 : Math.max(0, 1 - (local - 0.4) / 0.6);
                    // Blur only in the last 30%
                    const blur = local > 0.7 ? (local - 0.7) / 0.3 * 6 : 0;

                    letter.style.transform = `translateX(${dx}px) translateY(${dy}px) translateZ(${z}px)`;
                    letter.style.opacity = opacity;
                    letter.style.filter = blur > 0 ? `blur(${blur}px)` : '';
                });

                heroRevealed.classList.remove('active');

            } else {
                // Reveal phase
                kineticText.style.visibility = 'hidden';
                kineticText.style.opacity = '0';
                heroRevealed.classList.add('active');
            }
        }

        window.addEventListener('scroll', updateHeroOnScroll, { passive: true });
        // Run once on load
        updateHeroOnScroll();

    } else {
        kineticText.style.display = 'none';
        heroRevealed.classList.add('active');
        if (scrollIndicator) scrollIndicator.style.display = 'none';
    }

    // ========================================
    // 2. NAVIGATION — Scroll-aware
    // ========================================
    const nav = document.getElementById('nav');

    function updateNav() {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }

    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // ========================================
    // 3. SCROLL REVEAL — Intersection Observer
    // ========================================
    if (!prefersReducedMotion) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    } else {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }

    // ========================================
    // 4. PARTICLES — Subtle floating dots
    // ========================================
    const particleCanvas = document.getElementById('particle-canvas');
    if (particleCanvas && !prefersReducedMotion) {
        const ctx = particleCanvas.getContext('2d');
        const particles = [];
        const COUNT = 40;

        function resizeCanvas() {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x: Math.random() * particleCanvas.width,
                y: Math.random() * particleCanvas.height,
                r: Math.random() * 1.2 + 0.3,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                alpha: Math.random() * 0.2 + 0.05,
            });
        }

        function drawParticles() {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = particleCanvas.width;
                if (p.x > particleCanvas.width) p.x = 0;
                if (p.y < 0) p.y = particleCanvas.height;
                if (p.y > particleCanvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(136, 192, 208, ${p.alpha})`;
                ctx.fill();
            });

            // Faint connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 10000) { // 100px
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(136, 192, 208, ${0.03 * (1 - distSq / 10000)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(drawParticles);
        }
        drawParticles();
    }

    // ========================================
    // 5. HERO WAVEFORM — Gentle sine wave
    // ========================================
    const heroWaveCanvas = document.getElementById('hero-waveform');
    if (heroWaveCanvas) {
        const hCtx = heroWaveCanvas.getContext('2d');
        let time = 0;

        function resizeHeroWave() {
            const dpr = window.devicePixelRatio || 1;
            const rect = heroWaveCanvas.getBoundingClientRect();
            heroWaveCanvas.width = rect.width * dpr;
            heroWaveCanvas.height = rect.height * dpr;
            hCtx.scale(dpr, dpr);
        }
        window.addEventListener('resize', resizeHeroWave);
        resizeHeroWave();

        function drawWave() {
            const w = heroWaveCanvas.getBoundingClientRect().width;
            const h = heroWaveCanvas.getBoundingClientRect().height;
            hCtx.clearRect(0, 0, w, h);

            const center = h / 2;
            const waves = [
                { amp: h * 0.22, freq: 0.012, speed: 2, color: 'rgba(136, 192, 208, 0.35)', lw: 1.5 },
                { amp: h * 0.15, freq: 0.02, speed: 3.2, color: 'rgba(129, 161, 193, 0.2)', lw: 1 },
            ];

            waves.forEach(wave => {
                hCtx.beginPath();
                for (let x = 0; x <= w; x++) {
                    const y = center + Math.sin(x * wave.freq + time * wave.speed) * wave.amp * Math.sin(time * 0.6 + 0.3);
                    if (x === 0) hCtx.moveTo(x, y); else hCtx.lineTo(x, y);
                }
                hCtx.strokeStyle = wave.color;
                hCtx.lineWidth = wave.lw;
                hCtx.stroke();
            });

            if (!prefersReducedMotion) {
                time += 1 / 60;
                requestAnimationFrame(drawWave);
            }
        }
        drawWave();
    }

    // ========================================
    // 6. DEMO WAVEFORMS — Before / After
    // ========================================
    const beforeCanvas = document.getElementById('demo-canvas-before');
    const afterCanvas = document.getElementById('demo-canvas-after');

    if (beforeCanvas && afterCanvas) {
        const bCtx = beforeCanvas.getContext('2d');
        const aCtx = afterCanvas.getContext('2d');

        function resizeDemo() {
            [beforeCanvas, afterCanvas].forEach(c => {
                const dpr = window.devicePixelRatio || 1;
                const rect = c.getBoundingClientRect();
                c.width = rect.width * dpr;
                c.height = rect.height * dpr;
                c.getContext('2d').scale(dpr, dpr);
            });
        }

        const len = 120;
        const data = [];
        for (let i = 0; i < len; i++) {
            const cluster = Math.sin(i * 0.08) * 0.3 + 0.5;
            data.push(Math.max(0.04, cluster * Math.random() * 0.6));
        }

        function draw(ctx, canvas, after) {
            const w = canvas.getBoundingClientRect().width;
            const h = canvas.getBoundingClientRect().height;
            ctx.clearRect(0, 0, w, h);

            const barW = w / len;
            const center = h / 2;
            const maxAmp = h * 0.38;

            for (let i = 0; i < len; i++) {
                let amp = data[i] * maxAmp;
                let color;

                if (after) {
                    const silent = (i > 22 && i < 30) || (i > 50 && i < 62) || (i > 82 && i < 95);
                    if (silent) {
                        amp = 1;
                        color = 'rgba(76, 86, 106, 0.2)';
                    } else {
                        color = `rgba(163, 190, 140, ${0.4 + data[i] * 0.5})`;
                    }
                } else {
                    color = `rgba(129, 161, 193, ${0.35 + data[i] * 0.5})`;
                }

                const x = i * barW;
                const bw = Math.max(1, barW - 1);
                const bh = amp * 2;
                const y = center - amp;

                ctx.fillStyle = color;
                ctx.fillRect(x, y, bw, bh);
            }
        }

        function renderDemos() {
            draw(bCtx, beforeCanvas, false);
            draw(aCtx, afterCanvas, true);
        }

        window.addEventListener('resize', () => { resizeDemo(); renderDemos(); });
        resizeDemo();
        renderDemos();
    }
});
