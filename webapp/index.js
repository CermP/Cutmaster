/* ==========================================
   Diclo Landing
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ========================================
    // 1. NAVIGATION — Scroll-aware
    // ========================================
    const nav = document.getElementById('nav');
    let ticking = false;

    function updateNav() {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateNav);
            ticking = true;
        }
    }, { passive: true });
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
    // 2. SCROLL REVEAL — Intersection Observer
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
    // 3. HERO WAVEFORM — Sine wave visualizer
    // ========================================
    const heroWaveCanvas = document.getElementById('hero-waveform');
    if (heroWaveCanvas) {
        const hCtx = heroWaveCanvas.getContext('2d');
        let time = 0;
        let heroW = 300, heroH = 70;
        let isHeroVisible = true;
        let rafId = null;

        function drawWaveFrame() {
            hCtx.clearRect(0, 0, heroW, heroH);

            const center = heroH / 2;
            const waves = [
                { amp: heroH * 0.22, freq: 0.012, speed: 2, color: 'rgba(94, 173, 182, 0.55)', lw: 1.5 },
                { amp: heroH * 0.15, freq: 0.02, speed: 3.2, color: 'rgba(168, 130, 196, 0.35)', lw: 1 },
            ];

            waves.forEach(wave => {
                hCtx.beginPath();
                for (let x = 0; x <= heroW; x++) {
                    const y = center + Math.sin(x * wave.freq + time * wave.speed) * wave.amp * Math.sin(time * 0.6 + 0.3);
                    if (x === 0) hCtx.moveTo(x, y); else hCtx.lineTo(x, y);
                }
                hCtx.strokeStyle = wave.color;
                hCtx.lineWidth = wave.lw;
                hCtx.stroke();
            });
        }

        const resizeHeroObserver = new ResizeObserver(entries => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = entries[0].contentRect;
            const w = rect.width || 300;
            const h = rect.height || 70;
            heroW = w;
            heroH = h;
            const targetW = Math.round(w * dpr);
            const targetH = Math.round(h * dpr);
            if (heroWaveCanvas.width !== targetW || heroWaveCanvas.height !== targetH) {
                heroWaveCanvas.width = targetW;
                heroWaveCanvas.height = targetH;
                hCtx.setTransform(1, 0, 0, 1, 0, 0);
                hCtx.scale(dpr, dpr);
                drawWaveFrame();
            }
        });
        resizeHeroObserver.observe(heroWaveCanvas);

        function loop() {
            if (!isHeroVisible || document.hidden || prefersReducedMotion) {
                rafId = null;
                return;
            }
            time += 1 / 60;
            drawWaveFrame();
            rafId = requestAnimationFrame(loop);
        }

        function startLoop() {
            if (!rafId && !prefersReducedMotion && isHeroVisible && !document.hidden) {
                rafId = requestAnimationFrame(loop);
            }
        }

        function stopLoop() {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        if ('IntersectionObserver' in window) {
            const heroVisObserver = new IntersectionObserver(entries => {
                isHeroVisible = entries[0].isIntersecting;
                if (isHeroVisible) {
                    startLoop();
                } else {
                    stopLoop();
                }
            }, { threshold: 0.05 });
            heroVisObserver.observe(heroWaveCanvas);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopLoop();
            } else if (isHeroVisible) {
                startLoop();
            }
        });

        drawWaveFrame();
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => startLoop(), { timeout: 800 });
        } else {
            setTimeout(startLoop, 300);
        }
    }

    // ========================================
    // 4. DEMO WAVEFORMS — Before / After (Lazy)
    // ========================================
    const beforeCanvas = document.getElementById('demo-canvas-before');
    const afterCanvas = document.getElementById('demo-canvas-after');

    if (beforeCanvas && afterCanvas) {
        let initialized = false;

        function initDemos() {
            if (initialized) return;
            initialized = true;

            const bCtx = beforeCanvas.getContext('2d');
            const aCtx = afterCanvas.getContext('2d');
            let demoW = 300, demoH = 80;

            const len = 100;
            const data = [];
            for (let i = 0; i < len; i++) {
                const cluster = Math.sin(i * 0.08) * 0.3 + 0.5;
                data.push(Math.max(0.04, cluster * Math.random() * 0.6));
            }

            function draw(ctx, after) {
                ctx.clearRect(0, 0, demoW, demoH);

                const barW = demoW / len;
                const center = demoH / 2;
                const maxAmp = demoH * 0.38;

                for (let i = 0; i < len; i++) {
                    let amp = data[i] * maxAmp;
                    let color;

                    if (after) {
                        const silent = (i > 18 && i < 26) || (i > 42 && i < 54) || (i > 70 && i < 82);
                        if (silent) {
                            amp = 1;
                            color = 'rgba(255, 255, 255, 0.08)';
                        } else {
                            color = `rgba(125, 184, 126, ${0.45 + data[i] * 0.55})`;
                        }
                    } else {
                        color = `rgba(94, 173, 182, ${0.35 + data[i] * 0.5})`;
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
                draw(bCtx, false);
                draw(aCtx, true);
            }

            const resizeDemoObserver = new ResizeObserver(entries => {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                let needsRender = false;
                for (let entry of entries) {
                    const c = entry.target;
                    const rect = entry.contentRect;
                    const w = rect.width || 300;
                    const h = rect.height || 80;
                    demoW = w;
                    demoH = h;
                    const targetW = Math.round(w * dpr);
                    const targetH = Math.round(h * dpr);
                    if (c.width !== targetW || c.height !== targetH) {
                        c.width = targetW;
                        c.height = targetH;
                        const ctx = c.getContext('2d');
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                        ctx.scale(dpr, dpr);
                        needsRender = true;
                    }
                }
                if (needsRender) {
                    renderDemos();
                }
            });

            resizeDemoObserver.observe(beforeCanvas);
            resizeDemoObserver.observe(afterCanvas);
        }

        if ('IntersectionObserver' in window) {
            const demoObserver = new IntersectionObserver(entries => {
                if (entries.some(e => e.isIntersecting)) {
                    initDemos();
                    demoObserver.disconnect();
                }
            }, { rootMargin: '200px 0px' });
            demoObserver.observe(beforeCanvas);
        } else {
            initDemos();
        }
    }
});
