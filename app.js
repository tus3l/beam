/* ============================================
   JBeam Vault — Application Logic (v2)
   ============================================ */

(function () {
    "use strict";

    // ── Configuration ──────────────────────────
    const CAR_COUNT = 9;
    const isMobile = window.innerWidth <= 768;
    const visibleCars = isMobile ? 5 : CAR_COUNT;

    // Cars spread EVERYWHERE — corners, edges, all around
    const carLayouts = [
        // ── Top row ──
        { left: -4,  top: -3,  scale: 0.65, z: 14, blur: 0,   rot: -8  },
        { left: 38,  top: -6,  scale: 0.42, z: 3,  blur: 4,   rot: 2   },
        { left: 78,  top: -2,  scale: 0.60, z: 12, blur: 0,   rot: 6   },
        // ── Middle row ──
        { left: -8,  top: 38,  scale: 0.80, z: 22, blur: 0,   rot: -4  },
        { left: 75,  top: 32,  scale: 0.75, z: 20, blur: 0,   rot: 5   },
        // ── Bottom row ──
        { left: -3,  top: 72,  scale: 0.55, z: 8,  blur: 2,   rot: -5  },
        { left: 30,  top: 78,  scale: 0.48, z: 5,  blur: 3,   rot: 3   },
        { left: 58,  top: 74,  scale: 0.50, z: 6,  blur: 2.5, rot: -3  },
        { left: 82,  top: 68,  scale: 0.58, z: 10, blur: 1,   rot: 7   },
    ];

    const mobileLayouts = [
        { left: -5,  top: -2,  scale: 0.35, z: 8,  blur: 2, rot: -5 },
        { left: 68,  top: 0,   scale: 0.32, z: 6,  blur: 3, rot: 4  },
        { left: -6,  top: 50,  scale: 0.45, z: 14, blur: 0, rot: -3 },
        { left: 65,  top: 55,  scale: 0.42, z: 12, blur: 0, rot: 5  },
        { left: 25,  top: 78,  scale: 0.30, z: 4,  blur: 3, rot: -2 },
    ];

    const layouts = isMobile ? mobileLayouts : carLayouts;

    // ── DOM References ─────────────────────────
    const carImages    = document.querySelectorAll(".car-img");
    const ctaWrapper   = document.getElementById("cta-wrapper");
    const downloadBtn  = document.getElementById("download-btn");
    const statusMsg    = document.getElementById("status-msg");
    const dimOverlay   = document.getElementById("dim-overlay");
    const brand        = document.querySelector(".brand");
    const logsWidget   = document.getElementById("logs-widget");
    const canvas       = document.getElementById("particle-canvas");
    const ctx          = canvas.getContext("2d");

    // ── Canvas Setup ───────────────────────────
    let W, H;
    function resizeCanvas() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // ── Utility ────────────────────────────────
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── Particle System (declared early for button hover) ──
    const particles = [];

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 1;
            this.decay = 0.015 + Math.random() * 0.02;
            this.size = 2 + Math.random() * 4;
            this.color = color;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.life -= this.decay;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function spawnBurst(x, y, count) {
        const colors = ["#00d4ff", "#a855f7", "#22d3ee", "#60a5fa", "#e879f9"];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, colors[i % colors.length]));
        }
    }

    let shockwave = null;
    class Shockwave {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.radius = 0;
            this.maxRadius = Math.max(W, H);
            this.life = 1;
        }
        update() { this.radius += 18; this.life = 1 - this.radius / this.maxRadius; }
        draw() {
            if (this.life <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.life * 0.5;
            ctx.strokeStyle = "#00d4ff";
            ctx.lineWidth = 3 * this.life;
            ctx.shadowColor = "#00d4ff";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, W, H);
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0) particles.splice(i, 1);
        }
        if (shockwave) {
            shockwave.update();
            shockwave.draw();
            if (shockwave.life <= 0) shockwave = null;
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // ── Position Cars ──────────────────────────
    const carData = [];
    carImages.forEach((img, i) => {
        if (i >= visibleCars) {
            img.style.display = "none";
            return;
        }
        const layout = layouts[i];
        const imgW = isMobile ? 200 : 350;

        img.style.width     = `${imgW * layout.scale}px`;
        img.style.left      = `${layout.left}%`;
        img.style.top       = `${layout.top}%`;
        img.style.zIndex    = layout.z;
        img.style.filter    = layout.blur > 0 ? `blur(${layout.blur}px)` : "none";
        img.style.transform = `rotate(${layout.rot}deg)`;

        carData.push({
            el: img,
            depth: parseFloat(img.dataset.depth),
            layout: layout,
            origZ: layout.z,
            origBlur: layout.blur,
        });
    });

    // ── Entrance Animation ─────────────────────
    const masterTL = gsap.timeline({ defaults: { ease: "back.out(1.4)" } });

    carData.forEach((car, i) => {
        const edge = i % 4;
        let fromX = 0, fromY = 0;
        switch (edge) {
            case 0: fromY = -window.innerHeight - 200; break;
            case 1: fromX =  window.innerWidth  + 200; break;
            case 2: fromY =  window.innerHeight + 200; break;
            case 3: fromX = -window.innerWidth  - 200; break;
        }

        masterTL.fromTo(car.el,
            { x: fromX, y: fromY, opacity: 0, scale: 0.2, rotation: car.layout.rot + (Math.random() * 60 - 30) },
            { x: 0, y: 0, opacity: 1, scale: 1, rotation: car.layout.rot, duration: 1.3 + Math.random() * 0.5, ease: "elastic.out(0.7, 0.45)" },
            i * 0.09
        );
    });

    masterTL.fromTo(ctaWrapper,
        { opacity: 0, scale: 0.6, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 1, ease: "back.out(2.5)" },
        "-=0.6"
    );
    masterTL.fromTo(brand,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.7"
    );
    masterTL.fromTo(logsWidget,
        { opacity: 0, x: 40, scale: 0.8 },
        { opacity: 1, x: 0, scale: 1, duration: 0.7, ease: "back.out(1.5)" },
        "-=0.5"
    );

    // ── Continuous Floating (more visible) ─────
    carData.forEach((car) => {
        const floatY  = 12 + Math.random() * 18;
        const floatX  = 5  + Math.random() * 10;
        const floatR  = 1.5 + Math.random() * 3;
        const durY    = 3.5 + Math.random() * 4;
        const durX    = 4   + Math.random() * 5;
        const durR    = 5   + Math.random() * 4;
        const d       = Math.random() * 3;

        gsap.to(car.el, { y: `+=${floatY}`, duration: durY, repeat: -1, yoyo: true, ease: "sine.inOut", delay: d });
        gsap.to(car.el, { x: `+=${floatX}`, duration: durX, repeat: -1, yoyo: true, ease: "sine.inOut", delay: d + 0.5 });
        gsap.to(car.el, { rotation: car.layout.rot + floatR, duration: durR, repeat: -1, yoyo: true, ease: "sine.inOut", delay: d + 1 });
    });

    // Logs gentle float
    gsap.to(logsWidget, { y: -6, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });

    // ── Mouse Parallax ─────────────────────────
    let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;

    if (!isMobile) {
        document.addEventListener("mousemove", (e) => {
            targetMX = (e.clientX / W - 0.5) * 2;
            targetMY = (e.clientY / H - 0.5) * 2;
        });

        (function parallaxLoop() {
            mouseX = lerp(mouseX, targetMX, 0.04);
            mouseY = lerp(mouseY, targetMY, 0.04);
            carData.forEach((car) => {
                gsap.set(car.el, {
                    x: `+=${mouseX * car.depth * 35 * 0.012}`,
                    y: `+=${mouseY * car.depth * 20 * 0.012}`,
                });
            });
            gsap.set(ctaWrapper, { x: mouseX * 6, y: mouseY * 4 });
            requestAnimationFrame(parallaxLoop);
        })();
    }

    // ── Enhanced Button Hover (GSAP) ───────────
    let btnHoverTL = null;

    downloadBtn.addEventListener("mouseenter", () => {
        if (btnHoverTL) btnHoverTL.kill();
        btnHoverTL = gsap.timeline();

        // Magnetic lift
        btnHoverTL.to(downloadBtn, { y: -4, duration: 0.35, ease: "power2.out" }, 0);

        // Icon bounce loop
        btnHoverTL.to(downloadBtn.querySelector(".btn-icon"), {
            y: 3, duration: 0.5, repeat: -1, yoyo: true, ease: "sine.inOut",
        }, 0);

        // Push nearby cars away
        carData.forEach((car) => {
            const rect = car.el.getBoundingClientRect();
            const bRect = downloadBtn.getBoundingClientRect();
            const dx = (rect.left + rect.width / 2) - (bRect.left + bRect.width / 2);
            const dy = (rect.top + rect.height / 2) - (bRect.top + bRect.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 400) {
                gsap.to(car.el, {
                    x: `+=${(dx / dist) * 15}`, y: `+=${(dy / dist) * 15}`,
                    duration: 0.5, ease: "power2.out",
                });
            }
        });

        // Sparkle particles around button
        const r = downloadBtn.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            const p = new Particle(
                r.left + Math.random() * r.width,
                r.top  + Math.random() * r.height,
                ["#00d4ff", "#a855f7", "#22d3ee"][i % 3]
            );
            p.vx = (Math.random() - 0.5) * 2;
            p.vy = -1 - Math.random() * 2;
            p.decay = 0.008;
            p.size = 2;
            particles.push(p);
        }
    });

    downloadBtn.addEventListener("mouseleave", () => {
        if (btnHoverTL) { btnHoverTL.kill(); btnHoverTL = null; }
        gsap.to(downloadBtn, { y: 0, duration: 0.4, ease: "power2.out" });
        gsap.to(downloadBtn.querySelector(".btn-icon"), { y: 0, duration: 0.3, overwrite: true });
        carData.forEach((car) => {
            gsap.to(car.el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(0.5, 0.4)", overwrite: "auto" });
        });
    });

    // ── Hover Effect on Cars ───────────────────
    carData.forEach((car) => {
        car.el.addEventListener("mouseenter", () => {
            dimOverlay.classList.add("active");
            gsap.to(car.el, { scale: 1.15, duration: 0.4, ease: "power2.out", overwrite: "auto" });
            car.el.style.zIndex = 100;
            car.el.style.filter = "none";
        });
        car.el.addEventListener("mouseleave", () => {
            dimOverlay.classList.remove("active");
            gsap.to(car.el, { scale: 1, duration: 0.4, ease: "power2.out", overwrite: "auto" });
            car.el.style.zIndex = car.origZ;
            car.el.style.filter = car.origBlur > 0 ? `blur(${car.origBlur}px)` : "none";
        });
    });

    // ── Button Click — Shockwave + Scatter ─────
    let isScattered = false;

    downloadBtn.addEventListener("click", () => {
        if (isScattered) return;
        isScattered = true;

        const bRect = downloadBtn.getBoundingClientRect();
        const cx = bRect.left + bRect.width / 2;
        const cy = bRect.top + bRect.height / 2;

        spawnBurst(cx, cy, 100);
        shockwave = new Shockwave(cx, cy);

        carData.forEach((car) => {
            const rect = car.el.getBoundingClientRect();
            const dx = (rect.left + rect.width / 2) - cx;
            const dy = (rect.top + rect.height / 2) - cy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1400;
            gsap.to(car.el, {
                x: `+=${(dx / dist) * force}`, y: `+=${(dy / dist) * force}`,
                opacity: 0, rotation: `+=${Math.random() * 80 - 40}`,
                duration: 0.9, ease: "power3.out",
            });
        });

        gsap.timeline()
            .to(downloadBtn, { scale: 0.9, duration: 0.08 })
            .to(downloadBtn, { scale: 1.05, duration: 0.15 })
            .to(downloadBtn, { scale: 1, duration: 0.2 });

        statusMsg.textContent = "جاري التحضير...";
        gsap.to(statusMsg, { opacity: 1, duration: 0.4, delay: 0.3 });

        setTimeout(() => {
            gsap.to(statusMsg, { opacity: 0, duration: 0.3, onComplete: () => { statusMsg.textContent = ""; } });
            carData.forEach((car) => {
                gsap.to(car.el, {
                    x: 0, y: 0, opacity: 1, rotation: car.layout.rot,
                    duration: 1.4, ease: "elastic.out(0.6, 0.4)", delay: Math.random() * 0.4,
                });
            });
            isScattered = false;
        }, 2500);
    });

    // ── Ambient Particles ──────────────────────
    (function ambientLoop() {
        if (Math.random() > 0.9) {
            const p = new Particle(Math.random() * W, Math.random() * H, "rgba(0, 212, 255, 0.3)");
            p.vx = (Math.random() - 0.5) * 0.5;
            p.vy = -0.3 - Math.random() * 0.5;
            p.decay = 0.003 + Math.random() * 0.005;
            p.size = 1 + Math.random() * 2;
            particles.push(p);
        }
        requestAnimationFrame(ambientLoop);
    })();

})();
