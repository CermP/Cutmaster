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

    // Inject individual letter spans with radial spread from word center
    const centerIdx = (word.length - 1) / 2; // 4
    kineticText.innerHTML = word.split('').map((letter, i) => {
        const rel = (i - centerIdx) / centerIdx; // -1 to +1
        // Letters on left fly left, right fly right, with organic spread
        const isMobile = window.innerWidth <= 768;
        const driftX = rel * (isMobile ? 70 : 160) + (Math.random() - 0.5) * (isMobile ? 20 : 40);
        const driftY = (i % 2 === 0 ? -1 : 1) * (isMobile ? 20 + Math.random() * 20 : 35 + Math.random() * 40);
        return `<span class="letter" data-dx="${driftX.toFixed(1)}" data-dy="${driftY.toFixed(1)}" style="--i:${i}">${letter}</span>`;
    }).join('');

    const letters = kineticText.querySelectorAll('.letter');

    // Tap / Click to smoothly reveal hero content on mobile or desktop
    function smoothScrollToReveal() {
        const heroHeight = heroSection.offsetHeight;
        const viewportH = window.innerHeight;
        const maxScroll = heroHeight - viewportH;
        const targetScroll = heroSection.offsetTop + Math.max(80, maxScroll * 0.72);
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }

    kineticText.addEventListener('click', smoothScrollToReveal);
    kineticText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            smoothScrollToReveal();
        }
    });
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', smoothScrollToReveal);
        scrollIndicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                smoothScrollToReveal();
            }
        });
    }

    // Scroll-driven calculation
    let resizeHeroWaveFn = null;

    function updateHeroOnScroll() {
        const heroRect = heroSection.getBoundingClientRect();
        const heroHeight = heroSection.offsetHeight;
        const viewportH = window.innerHeight;

        // progress: 0 at top, 1 when hero fully scrolled
        const scrolled = -heroRect.top;
        const maxScroll = heroHeight - viewportH;
        const progress = maxScroll > 0 ? Math.max(0, Math.min(1, scrolled / maxScroll)) : 0;

        // --- Scroll indicator visibility ---
        if (scrollIndicator) {
            if (progress < 0.04) {
                scrollIndicator.style.opacity = '0.7';
                scrollIndicator.style.pointerEvents = 'auto';
            } else if (progress < 0.2) {
                scrollIndicator.style.opacity = String(0.7 * (1 - (progress - 0.04) / 0.16));
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            }
        }

        // --- Hide aurora/particles after hero ---
        const heroAurora = document.querySelector('.hero-aurora');
        const particleCanvas = document.getElementById('particle-canvas');
        const fadeProg = Math.max(0, Math.min(1, (progress - 0.8) / 0.2));
        if (heroAurora) {
            heroAurora.style.opacity = String(0.1 * (1 - fadeProg));
            heroAurora.style.display = fadeProg >= 1 ? 'none' : 'block';
        }
        if (particleCanvas) {
            particleCanvas.style.opacity = String(1 - fadeProg);
            particleCanvas.style.display = fadeProg >= 1 ? 'none' : 'block';
        }

        // ============================
        // Phase 1 (0–0.06): Text at rest
        // Phase 2 (0.06–0.58): Letters fly outward toward viewer
        // Phase 3 (0.58–1.0): Hero reveal active
        // ============================
        if (prefersReducedMotion) {
            // Gentle cross-fade for reduced motion users
            if (progress < 0.3) {
                kineticText.style.visibility = 'visible';
                kineticText.style.opacity = String(1 - progress / 0.3);
                heroRevealed.classList.remove('active');
            } else {
                kineticText.style.visibility = 'hidden';
                kineticText.style.opacity = '0';
                heroRevealed.classList.add('active');
            }
            return;
        }

        if (progress <= 0.06) {
            // Text at rest, visible
            kineticText.style.visibility = 'visible';
            kineticText.style.opacity = '1';
            letters.forEach(letter => {
                letter.style.transform = 'translate3d(0, 0, 0) scale(1)';
                letter.style.webkitTransform = 'translate3d(0, 0, 0) scale(1)';
                letter.style.opacity = '1';
            });
            heroRevealed.classList.remove('active');

        } else if (progress <= 0.58) {
            // Fly-through phase
            kineticText.style.visibility = 'visible';
            const flyProg = (progress - 0.06) / 0.52; // 0→1
            const isMobile = window.innerWidth <= 768;

            letters.forEach((letter, i) => {
                const stagger = i * 0.035;
                const local = Math.max(0, Math.min(1, (flyProg - stagger) / (1 - stagger * 0.4)));

                // Smooth cubic acceleration
                const eased = local * local * (3 - 2 * local);

                // Safe z translation (well below 800px perspective)
                const z = eased * (isMobile ? 180 : 460);
                // Scale delivers the dramatic "rushing past the viewer" effect across all mobile GPUs
                const scale = 1 + eased * (isMobile ? 2.2 : 5.4);
                const dx = parseFloat(letter.dataset.dx) * (1 + eased * 1.5);
                const dy = parseFloat(letter.dataset.dy) * (1 + eased * 1.5);

                // Opacity: crystal clear for first 35%, then smooth fade-out
                const opacity = local < 0.35 ? 1 : Math.max(0, 1 - (local - 0.35) / 0.65);

                const transformStr = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, ${z.toFixed(1)}px) scale(${scale.toFixed(2)})`;
                letter.style.transform = transformStr;
                letter.style.webkitTransform = transformStr;
                letter.style.opacity = opacity.toFixed(2);
            });

            heroRevealed.classList.remove('active');

        } else {
            // Reveal phase
            kineticText.style.visibility = 'hidden';
            kineticText.style.opacity = '0';
            const wasActive = heroRevealed.classList.contains('active');
            heroRevealed.classList.add('active');
            if (!wasActive && typeof resizeHeroWaveFn === 'function') {
                resizeHeroWaveFn();
            }
        }
    }

    // High performance RAF scroll listener
    let ticking = false;
    function requestHeroUpdate() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHeroOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestHeroUpdate, { passive: true });
    window.addEventListener('resize', requestHeroUpdate, { passive: true });
    window.addEventListener('orientationchange', requestHeroUpdate, { passive: true });

    // Initial trigger on load
    updateHeroOnScroll();

    // ========================================
    // 2. NAVIGATION — Scroll-aware
    // ========================================
    const nav = document.getElementById('nav');

    function updateNav() {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
    }

    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const href = anchor.getAttribute('href');
            if (href === '#' || !href) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ========================================
    // 3. SCROLL REVEAL — Intersection Observer
    // ========================================
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -20px 0px', threshold: 0.05 });

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
        const isMobile = window.innerWidth <= 768;
        const COUNT = isMobile ? 18 : 36;

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
            const maxDistSq = isMobile ? 6400 : 10000;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < maxDistSq) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(136, 192, 208, ${0.03 * (1 - distSq / maxDistSq)})`;
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

        resizeHeroWaveFn = function() {
            const dpr = window.devicePixelRatio || 1;
            const rect = heroWaveCanvas.getBoundingClientRect();
            const w = rect.width || heroWaveCanvas.clientWidth || 300;
            const h = rect.height || heroWaveCanvas.clientHeight || 70;
            heroWaveCanvas.width = Math.round(w * dpr);
            heroWaveCanvas.height = Math.round(h * dpr);
            hCtx.setTransform(1, 0, 0, 1, 0, 0);
            hCtx.scale(dpr, dpr);
        };
        window.addEventListener('resize', resizeHeroWaveFn);
        resizeHeroWaveFn();

        function drawWave() {
            const rect = heroWaveCanvas.getBoundingClientRect();
            const w = rect.width || heroWaveCanvas.clientWidth || 300;
            const h = rect.height || heroWaveCanvas.clientHeight || 70;
            hCtx.clearRect(0, 0, w, h);

            const center = h / 2;
            const waves = [
                { amp: h * 0.22, freq: 0.012, speed: 2, color: 'rgba(136, 192, 208, 0.4)', lw: 1.5 },
                { amp: h * 0.15, freq: 0.02, speed: 3.2, color: 'rgba(129, 161, 193, 0.25)', lw: 1 },
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
                const w = rect.width || c.clientWidth || 300;
                const h = rect.height || c.clientHeight || 80;
                c.width = Math.round(w * dpr);
                c.height = Math.round(h * dpr);
                const ctx = c.getContext('2d');
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
            });
        }

        const len = 100;
        const data = [];
        for (let i = 0; i < len; i++) {
            const cluster = Math.sin(i * 0.08) * 0.3 + 0.5;
            data.push(Math.max(0.04, cluster * Math.random() * 0.6));
        }

        function draw(ctx, canvas, after) {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width || canvas.clientWidth || 300;
            const h = rect.height || canvas.clientHeight || 80;
            ctx.clearRect(0, 0, w, h);

            const barW = w / len;
            const center = h / 2;
            const maxAmp = h * 0.38;

            for (let i = 0; i < len; i++) {
                let amp = data[i] * maxAmp;
                let color;

                if (after) {
                    const silent = (i > 18 && i < 26) || (i > 42 && i < 54) || (i > 70 && i < 82);
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
