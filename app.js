/* ============================================
   JBeam Vault — Application Logic (v2)
   ============================================ */

(function () {
    "use strict";

    // ── Configuration ──────────────────────────
    const CAR_COUNT = 18;
    const isMobile = window.innerWidth <= 768;
    const visibleCars = isMobile ? 8 : CAR_COUNT;

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
        // ── Extra cars ──
        { left: 20,  top: 10,  scale: 0.38, z: 2,  blur: 5,   rot: -2  },
        { left: 55,  top: 15,  scale: 0.45, z: 4,  blur: 3,   rot: 4   },
        { left: 90,  top: 42,  scale: 0.40, z: 3,  blur: 4,   rot: -6  },
        { left: 10,  top: 55,  scale: 0.52, z: 7,  blur: 2,   rot: 3   },
        { left: 45,  top: 48,  scale: 0.35, z: 2,  blur: 5,   rot: -1  },
        { left: 92,  top: 15,  scale: 0.55, z: 9,  blur: 1,   rot: 8   },
        { left: 15,  top: 85,  scale: 0.42, z: 4,  blur: 3,   rot: -4  },
        { left: 70,  top: 85,  scale: 0.38, z: 3,  blur: 4,   rot: 2   },
        { left: 48,  top: 60,  scale: 0.44, z: 5,  blur: 2,   rot: -5  },
    ];

    const mobileLayouts = [
        { left: -5,  top: -2,  scale: 0.35, z: 8,  blur: 2, rot: -5 },
        { left: 68,  top: 0,   scale: 0.32, z: 6,  blur: 3, rot: 4  },
        { left: -6,  top: 50,  scale: 0.45, z: 14, blur: 0, rot: -3 },
        { left: 65,  top: 55,  scale: 0.42, z: 12, blur: 0, rot: 5  },
        { left: 25,  top: 78,  scale: 0.30, z: 4,  blur: 3, rot: -2 },
        { left: 40,  top: 20,  scale: 0.28, z: 3,  blur: 4, rot: 2  },
        { left: 75,  top: 35,  scale: 0.33, z: 5,  blur: 2, rot: -4 },
        { left: 10,  top: 70,  scale: 0.30, z: 4,  blur: 3, rot: 3  },
    ];

    const layouts = isMobile ? mobileLayouts : carLayouts;

    // ── DOM References ─────────────────────────
    const carImages    = document.querySelectorAll(".car-img");
    const ctaWrapper   = document.getElementById("cta-wrapper");
    const downloadBtn  = document.getElementById("download-btn");
    const statusMsg    = document.getElementById("status-msg");
    const dimOverlay   = document.getElementById("dim-overlay");
    const brand        = document.querySelector(".brand");
    const logsBg       = document.getElementById("logs-bg");
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
    masterTL.fromTo(logsBg,
        { opacity: 0 },
        { opacity: 1, duration: 0.7, ease: "power2.out" },
        "-=0.5"
    );

    // ── Autonomous Car Movement (slow drift + respawn loop) ─────
    carData.forEach((car) => {
        const speed = 0.05 + Math.random() * 0.15;
        const dirX = (Math.random() > 0.5 ? 1 : -1) * speed;
        const dirY = (Math.random() > 0.5 ? 1 : -1) * speed * 0.5;
        const rotSpeed = (Math.random() - 0.5) * 0.03;

        let posX = 0, posY = 0, rot = car.layout.rot;

        function driftCar() {
            posX += dirX;
            posY += dirY;
            rot += rotSpeed;

            // Respawn when off-screen
            const rect = car.el.getBoundingClientRect();
            if (rect.right < -100) posX += W + 300;
            if (rect.left > W + 100) posX -= W + 300;
            if (rect.bottom < -100) posY += H + 300;
            if (rect.top > H + 100) posY -= H + 300;

            gsap.set(car.el, {
                x: posX,
                y: posY,
                rotation: rot,
            });
            requestAnimationFrame(driftCar);
        }
        driftCar();

        // Gentle floating bobbing
        const floatY  = 6 + Math.random() * 8;
        const floatX  = 3 + Math.random() * 5;
        const durY    = 5 + Math.random() * 5;
        const durX    = 6 + Math.random() * 6;
        const d       = Math.random() * 3;

        gsap.to(car.el, { y: `+=${floatY}`, duration: durY, repeat: -1, yoyo: true, ease: "sine.inOut", delay: d });
        gsap.to(car.el, { x: `+=${floatX}`, duration: durX, repeat: -1, yoyo: true, ease: "sine.inOut", delay: d + 0.5 });
    });

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

    // ── Magnetic Glow: button reacts to nearby cars ──
    let btnGlowIntensity = 0;
    (function magneticGlowLoop() {
        const bRect = downloadBtn.getBoundingClientRect();
        const bcx = bRect.left + bRect.width / 2;
        const bcy = bRect.top + bRect.height / 2;
        let closestDist = Infinity;

        carData.forEach((car) => {
            const rect = car.el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dist = Math.sqrt((cx - bcx) ** 2 + (cy - bcy) ** 2);
            if (dist < closestDist) closestDist = dist;
        });

        const maxRange = 500;
        const targetIntensity = Math.max(0, 1 - closestDist / maxRange);
        btnGlowIntensity = lerp(btnGlowIntensity, targetIntensity, 0.05);

        const glowSize = 30 + btnGlowIntensity * 60;
        const glowAlpha = 0.15 + btnGlowIntensity * 0.4;
        downloadBtn.style.boxShadow = `0 0 ${glowSize}px rgba(0, 212, 255, ${glowAlpha}), 0 0 ${glowSize * 2}px rgba(0, 212, 255, ${glowAlpha * 0.3}), 0 0 ${glowSize * 3}px rgba(168, 85, 247, ${glowAlpha * 0.15})`;
        downloadBtn.style.borderColor = `rgba(0, 212, 255, ${0.25 + btnGlowIntensity * 0.5})`;

        requestAnimationFrame(magneticGlowLoop);
    })();

    // ── JBeam Data Fragments around cars ────────
    const jbeamTexts = ["nodes", "beams", "torsion", "slots", "flexbodies", "vars", "wheels", "props", "0.5", "1.0", "FLT_MAX", "ref:", "id:", "\u25CB", "\u25A0", "\u25B3"];
    const dataFragColors = ["rgba(0,212,255,0.35)", "rgba(168,85,247,0.3)", "rgba(34,211,238,0.3)", "rgba(251,146,60,0.25)"];

    (function dataFragLoop() {
        // Spawn data fragments near random visible cars
        if (Math.random() > 0.85 && carData.length > 0) {
            const car = carData[Math.floor(Math.random() * carData.length)];
            const rect = car.el.getBoundingClientRect();
            if (rect.width > 0) {
                const fx = rect.left + Math.random() * rect.width;
                const fy = rect.top + Math.random() * rect.height;
                const color = dataFragColors[Math.floor(Math.random() * dataFragColors.length)];
                const frag = new Particle(fx, fy, color);
                frag.vx = (Math.random() - 0.5) * 1.5;
                frag.vy = -0.5 - Math.random() * 1.5;
                frag.decay = 0.004 + Math.random() * 0.006;
                frag.size = 1.5 + Math.random() * 2;
                particles.push(frag);

                // Also draw text fragments on canvas
                const txt = jbeamTexts[Math.floor(Math.random() * jbeamTexts.length)];
                const textFrag = {
                    x: fx, y: fy,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: -0.4 - Math.random() * 0.8,
                    life: 1,
                    decay: 0.006 + Math.random() * 0.008,
                    text: txt,
                    color: color,
                    update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; },
                    draw() {
                        ctx.save();
                        ctx.globalAlpha = this.life * 0.7;
                        ctx.fillStyle = this.color;
                        ctx.font = `${9 + Math.random() * 3}px 'Orbitron', monospace`;
                        ctx.fillText(this.text, this.x, this.y);
                        ctx.restore();
                    }
                };
                particles.push(textFrag);
            }
        }
        requestAnimationFrame(dataFragLoop);
    })();

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
