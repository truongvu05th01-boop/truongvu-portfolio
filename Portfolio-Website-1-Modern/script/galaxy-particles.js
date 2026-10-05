/**
 * ──────────────────────────────────────────────────────────
 * Galaxy Particle Network — Interactive 3D Background
 * ──────────────────────────────────────────────────────────
 * Features:
 *  • Full-screen WebGL-quality Canvas particle field with 3D depth (perspective z)
 *  • Fibonacci-galaxy distribution across entire viewport
 *  • Dynamic edge connections between nearby particles
 *  • Mouse attraction / repulsion (hold Shift to attract, default = repel)
 *  • Click burst — emits a radial shockwave of spark particles
 *  • Shooting star meteors crossing the field periodically
 *  • Light Mode / Dark Mode color synchronisation
 *  • Adaptive density: reduces particle count on mobile to save battery
 *  • RequestAnimationFrame with dt-based physics so it runs at any FPS
 */

class GalaxyParticleNetwork {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.sparks = [];
    this.meteors = [];
    this.mouse = { x: -9999, y: -9999, active: false };
    this.animId = null;
    this.lastTime = 0;
    this.width = 0;
    this.height = 0;
    this.isLightMode = false;

    // ── Config ──────────────────────────────────────────
    this.config = {
      // Particle counts (adaptive)
      particleCount: this.getAdaptiveCount(),

      // 3D depth range [min-z … max-z]
      zMin: -400,
      zMax: 200,

      // Connection
      maxConnectionDist: 140,   // px (at z=0 reference)
      maxConnectionsPerParticle: 6,

      // Mouse repulsion
      repelRadius: 160,
      repelStrength: 220,

      // Mouse attraction (Shift key held)
      attractRadius: 220,
      attractStrength: 140,

      // Shooting stars
      meteorInterval: 3500,   // ms between meteors
      meteorLifetime: 1400,   // ms

      // Click burst
      burstParticles: 22,

      // Dark-mode palette
      dark: {
        particleColors: [
          'rgba(0, 212, 255,',    // cyan (brand)
          'rgba(130, 100, 255,',  // violet
          'rgba(0, 200, 160,',    // teal
          'rgba(200, 230, 255,',  // ice white
          'rgba(80, 160, 255,',   // blue
        ],
        connectionColor: '0, 180, 255',
        meteorColor: '200, 240, 255',
        burstColor: '0, 212, 255',
      },
      // Light-mode palette
      light: {
        particleColors: [
          'rgba(59, 130, 246,',   // royal blue
          'rgba(99, 102, 241,',   // indigo
          'rgba(16, 185, 129,',   // emerald
          'rgba(14, 165, 233,',   // sky
          'rgba(139, 92, 246,',   // violet
        ],
        connectionColor: '59, 130, 246',
        meteorColor: '99, 102, 241',
        burstColor: '59, 130, 246',
      },
    };

    this.init();
  }

  getAdaptiveCount() {
    const vw = window.innerWidth;
    if (vw < 480) return 55;
    if (vw < 768) return 90;
    if (vw < 1200) return 140;
    return 200;
  }

  // ── Initialise ──────────────────────────────────────────
  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'galaxy-particle-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(this.canvas, document.body.firstChild);

    this.ctx = this.canvas.getContext('2d');
    this.isLightMode = document.documentElement.classList.contains('light-mode');

    this.resize();
    this.spawnParticles();
    this.bindEvents();
    this.scheduleMeteor();
    this.startLoop();
  }

  // ── Helpers ─────────────────────────────────────────────
  palette() {
    return this.isLightMode ? this.config.light : this.config.dark;
  }

  randomColorBase() {
    const colors = this.palette().particleColors;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ── Resize ──────────────────────────────────────────────
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  // ── Particle Factory ─────────────────────────────────────
  spawnParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle(x, y, z, vx, vy) {
    const { zMin, zMax } = this.config;
    const depth = z !== undefined ? z : zMin + Math.random() * (zMax - zMin);
    // perspective scale
    const fov = 500;
    const scale = fov / (fov - depth);

    return {
      // 3D coords (world space)
      wx: x !== undefined ? x : Math.random() * this.width,
      wy: y !== undefined ? y : Math.random() * this.height,
      wz: depth,

      // velocity (world space)
      vx: vx !== undefined ? vx : (Math.random() - 0.5) * 0.35,
      vy: vy !== undefined ? vy : (Math.random() - 0.5) * 0.35,
      vz: (Math.random() - 0.5) * 0.15,

      // visual
      baseRadius: 1.2 + Math.random() * 2.0,
      colorBase: this.randomColorBase(),
      baseAlpha: 0.35 + Math.random() * 0.65,

      // twinkle
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.6 + Math.random() * 1.4,

      // screen-space (computed per frame)
      sx: 0,
      sy: 0,
      scale: scale,
      radius: 0,
      alpha: 0,

      // connection tracking
      connections: 0,

      // lifetime (for burst sparks)
      life: 1.0,
      decay: 0,
    };
  }

  // ── Shooting Star / Meteor ───────────────────────────────
  scheduleMeteor() {
    const jitter = 0.5 + Math.random();
    setTimeout(() => {
      this.spawnMeteor();
      this.scheduleMeteor();
    }, this.config.meteorInterval * jitter);
  }

  spawnMeteor() {
    // Spawn from a random edge
    const side = Math.floor(Math.random() * 3); // 0=top, 1=left, 2=right
    let sx, sy, angle;

    if (side === 0) {
      sx = Math.random() * this.width;
      sy = -20;
      angle = Math.PI / 4 + Math.random() * Math.PI / 4; // downward diagonal
    } else if (side === 1) {
      sx = -20;
      sy = Math.random() * this.height * 0.6;
      angle = -(Math.PI / 8) + Math.random() * Math.PI / 4;
    } else {
      sx = this.width + 20;
      sy = Math.random() * this.height * 0.6;
      angle = Math.PI - Math.PI / 8 + Math.random() * Math.PI / 4;
    }

    const speed = 4 + Math.random() * 5;
    this.meteors.push({
      x: sx, y: sy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: 80 + Math.random() * 120,
      life: 1.0,
      decay: 1 / (this.config.meteorLifetime / 16.67), // per frame at 60fps
      colorBase: this.palette().meteorColor,
    });
  }

  // ── Click Burst ──────────────────────────────────────────
  emitBurst(cx, cy) {
    const { burstParticles, burstColor } = { ...this.config, burstColor: this.palette().burstColor };
    for (let i = 0; i < burstParticles; i++) {
      const angle = (i / burstParticles) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 4.5;
      const p = this.createParticle(cx, cy, 0, Math.cos(angle) * speed, Math.sin(angle) * speed);
      p.life = 1.0;
      p.decay = 0.025 + Math.random() * 0.03;
      p.colorBase = `rgba(${burstColor},`;
      p.baseRadius = 2 + Math.random() * 2.5;
      p.baseAlpha = 1.0;
      this.sparks.push(p);
    }
  }

  // ── Events ───────────────────────────────────────────────
  bindEvents() {
    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
      this.mouse.shift = e.shiftKey;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    // Click burst
    window.addEventListener('click', (e) => {
      // Don't burst on interactive elements
      const tag = e.target.tagName.toLowerCase();
      if (['a', 'button', 'input', 'textarea', 'select'].includes(tag)) return;
      if (e.target.closest('a, button, input, textarea, .project-card, .sphere-node')) return;
      this.emitBurst(e.clientX, e.clientY);
    });

    // Touch
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.active = false;
    });

    // Resize
    window.addEventListener('resize', () => {
      this.resize();
      // Re-distribute particles to new dimensions
      this.config.particleCount = this.getAdaptiveCount();
      this.spawnParticles();
    });

    // Theme toggle — watch for class changes on <html>
    const observer = new MutationObserver(() => {
      this.isLightMode = document.documentElement.classList.contains('light-mode');
      // Re-colour particles
      this.particles.forEach(p => { p.colorBase = this.randomColorBase(); });
      this.sparks.forEach(p => { p.colorBase = `rgba(${this.palette().burstColor},`; });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  // ── Physics Update ───────────────────────────────────────
  update(dt) {
    const { repelRadius, repelStrength, attractRadius, attractStrength, zMin, zMax } = this.config;
    const fov = 500;
    const half_w = this.width * 0.5;
    const half_h = this.height * 0.5;

    // Update main particles
    for (const p of this.particles) {
      // 3D drift
      p.wx += p.vx * dt * 60;
      p.wy += p.vy * dt * 60;
      p.wz += p.vz * dt * 60;

      // Wrap screen space
      if (p.wx < -50) p.wx = this.width + 50;
      if (p.wx > this.width + 50) p.wx = -50;
      if (p.wy < -50) p.wy = this.height + 50;
      if (p.wy > this.height + 50) p.wy = -50;

      // Z bounce
      if (p.wz < zMin) { p.wz = zMin; p.vz *= -1; }
      if (p.wz > zMax) { p.wz = zMax; p.vz *= -1; }

      // Perspective projection to screen space
      const scale = fov / Math.max(1, fov - p.wz);
      p.sx = p.wx;  // world-x already maps to screen-x
      p.sy = p.wy;
      p.scale = scale;
      p.radius = Math.max(0.4, p.baseRadius * scale);

      // Twinkle
      p.twinklePhase += p.twinkleSpeed * dt;
      const twinkle = 0.75 + 0.25 * Math.sin(p.twinklePhase);
      p.alpha = p.baseAlpha * twinkle * Math.min(1, scale * 0.85);

      // Mouse interaction
      if (this.mouse.active) {
        const mdx = p.sx - this.mouse.x;
        const mdy = p.sy - this.mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (this.mouse.shift) {
          // Attract
          if (mdist < attractRadius && mdist > 1) {
            const force = (attractStrength / mdist) * dt;
            p.vx -= (mdx / mdist) * force;
            p.vy -= (mdy / mdist) * force;
          }
        } else {
          // Repel
          if (mdist < repelRadius && mdist > 1) {
            const force = (repelStrength / (mdist + 1)) * dt;
            p.vx += (mdx / mdist) * force * 0.6;
            p.vy += (mdy / mdist) * force * 0.6;
          }
        }

        // Dampen velocity
        p.vx *= 0.988;
        p.vy *= 0.988;
      }

      // Clamp velocity
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = 1.8;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.connections = 0;
    }

    // Update burst sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.wx += s.vx * dt * 60;
      s.wy += s.vy * dt * 60;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.life -= s.decay * dt * 60;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }

    // Update meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += m.vx * dt * 60;
      m.y += m.vy * dt * 60;
      m.life -= m.decay * dt * 60;
      if (m.life <= 0) this.meteors.splice(i, 1);
    }
  }

  // ── Draw ─────────────────────────────────────────────────
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const pal = this.palette();
    const maxDist = this.config.maxConnectionDist;
    const maxConns = this.config.maxConnectionsPerParticle;

    // 1. Draw connections
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      if (a.connections >= maxConns) continue;

      for (let j = i + 1; j < this.particles.length; j++) {
        if (a.connections >= maxConns) break;
        const b = this.particles[j];
        if (b.connections >= maxConns) continue;

        const dx = a.sx - b.sx;
        const dy = a.sy - b.sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Adjust connection distance by average z-scale for 3D effect
        const avgScale = (a.scale + b.scale) * 0.5;
        const threshold = maxDist * avgScale;

        if (dist < threshold) {
          const alpha = (1 - dist / threshold) * 0.55 * Math.min(a.alpha, b.alpha);

          // Check mouse proximity — boost connection near mouse
          let mouseBoost = 1;
          if (this.mouse.active) {
            const mx = (a.sx + b.sx) * 0.5 - this.mouse.x;
            const my = (a.sy + b.sy) * 0.5 - this.mouse.y;
            const md = Math.sqrt(mx * mx + my * my);
            if (md < 200) mouseBoost = 1 + (1 - md / 200) * 1.2;
          }

          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.strokeStyle = `rgba(${pal.connectionColor}, ${Math.min(1, alpha * mouseBoost)})`;
          ctx.lineWidth = Math.max(0.2, 0.8 * avgScale * mouseBoost);
          ctx.stroke();

          a.connections++;
          b.connections++;
        }
      }
    }
    ctx.restore();

    // 2. Draw main particles
    for (const p of this.particles) {
      ctx.save();

      const grd = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, p.radius * 2.2);
      grd.addColorStop(0, `${p.colorBase} ${p.alpha})`);
      grd.addColorStop(0.5, `${p.colorBase} ${p.alpha * 0.45})`);
      grd.addColorStop(1, `${p.colorBase} 0)`);

      ctx.beginPath();
      ctx.arc(p.sx, p.sy, p.radius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Solid core dot
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, p.radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `${p.colorBase} ${Math.min(1, p.alpha * 1.4)})`;
      ctx.fill();

      ctx.restore();
    }

    // 3. Draw burst sparks
    for (const s of this.sparks) {
      ctx.save();
      const a = Math.max(0, s.life * s.baseAlpha);
      const grd = ctx.createRadialGradient(s.wx, s.wy, 0, s.wx, s.wy, s.radius * 3);
      grd.addColorStop(0, `${s.colorBase} ${a})`);
      grd.addColorStop(1, `${s.colorBase} 0)`);
      ctx.beginPath();
      ctx.arc(s.wx, s.wy, s.radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();
    }

    // 4. Draw shooting star meteors
    for (const m of this.meteors) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, m.life);

      const tailX = m.x - m.vx * m.length / Math.sqrt(m.vx * m.vx + m.vy * m.vy) * 1.5;
      const tailY = m.y - m.vy * m.length / Math.sqrt(m.vx * m.vx + m.vy * m.vy) * 1.5;

      const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      grad.addColorStop(0, `rgba(${m.colorBase}, ${m.life})`);
      grad.addColorStop(0.3, `rgba(${m.colorBase}, ${m.life * 0.5})`);
      grad.addColorStop(1, `rgba(${m.colorBase}, 0)`);

      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5 * m.life;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Head glow
      ctx.beginPath();
      ctx.arc(m.x, m.y, 2.5 * m.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${m.colorBase}, ${m.life * 0.9})`;
      ctx.fill();

      ctx.restore();
    }

    // 5. Draw mouse halo / cursor influence ring
    if (this.mouse.active) {
      ctx.save();
      const r1 = this.mouse.shift ? this.config.attractRadius : this.config.repelRadius;
      const ringColor = this.mouse.shift
        ? (this.isLightMode ? '99, 102, 241' : '120, 80, 255')
        : pal.connectionColor;

      const haloGrad = ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, r1 * 0.75,
        this.mouse.x, this.mouse.y, r1
      );
      haloGrad.addColorStop(0, `rgba(${ringColor}, 0)`);
      haloGrad.addColorStop(0.7, `rgba(${ringColor}, 0.06)`);
      haloGrad.addColorStop(1, `rgba(${ringColor}, 0)`);

      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, r1, 0, Math.PI * 2);
      ctx.fillStyle = haloGrad;
      ctx.fill();

      // Dashed interaction ring
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, r1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ringColor}, 0.22)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }
  }

  // ── Animation Loop ───────────────────────────────────────
  startLoop() {
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms to prevent spiral
      this.lastTime = timestamp;

      this.update(dt);
      this.draw();

      this.animId = requestAnimationFrame(loop);
    };

    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Auto-init
window.galaxyParticles = new GalaxyParticleNetwork();
