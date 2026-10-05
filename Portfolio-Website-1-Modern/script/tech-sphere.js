/**
 * 3D Tech Stack Sphere (Khối cầu kỹ năng 3D tương tác)
 * Mathematical spherical projection with Fibonacci lattice distribution,
 * direct natural drag physics, inertia damping, ambient floating, and interactive HUD.
 */

export class TechSphere {
  constructor({ containerId, tools, onSelect }) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.tools = tools || [];
    this.onSelect = onSelect || null;
    this.items = [];
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.velocity = { x: 0.0035, y: 0.0012 };
    this.targetIndex = null;
    this.isHovered = false;
    this.hoveredIndex = -1;
    this.selectedCategory = 'all';
    this.animId = null;
    this.baseSpeed = { x: 0.0035, y: 0.0012 };

    this.init();
  }

  init() {
    this.setupDOM();
    this.calculatePositions();
    this.bindEvents();
    this.startLoop();
  }

  getSphereRadius() {
    const width = this.container.clientWidth || 500;
    if (width < 420) return 130;
    if (width < 600) return 155;
    return 190;
  }

  setupDOM() {
    this.container.innerHTML = `
      <div class="tech-sphere-wrapper">
        <!-- Ambient Atmospheric Orbs & Rings -->
        <div class="sphere-ambience">
          <div class="sphere-ambience__glow"></div>
          <div class="sphere-ambience__orbital-ring ring-1"></div>
          <div class="sphere-ambience__orbital-ring ring-2"></div>
        </div>

        <!-- 3D Viewport -->
        <div class="tech-sphere-viewport" id="sphere-viewport" aria-label="3D Tech Stack Sphere">
          <div class="tech-sphere-cloud" id="sphere-cloud"></div>
        </div>

        <!-- Sphere Controls & Drag Hint -->
        <div class="tech-sphere-hint">
          <span class="hint-pulse"></span>
          <i class="ph ph-hand-pointing"></i>
          <span>Kéo chuột / vuốt để xoay 360° • Click vào logo để xem chi tiết</span>
        </div>

        <!-- Active Skill HUD Card -->
        <div class="tech-sphere-hud" id="sphere-hud">
          <div class="hud-content">
            <div class="hud-icon-wrap" id="hud-icon-wrap">
              <img id="hud-icon" src="images-and-icons/icons/${this.tools[0]?.icon || 'react-icon.png'}" alt="Skill icon">
            </div>
            <div class="hud-info">
              <div class="hud-header">
                <h4 id="hud-title">${this.tools[0]?.name || 'React'}</h4>
                <span class="hud-badge" id="hud-badge">${this.tools[0]?.category || 'Frontend'}</span>
              </div>
              <p id="hud-desc">${this.tools[0]?.desc || 'Thư viện UI hiện đại cho Web & Single Page Apps'}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.cloudEl = document.getElementById('sphere-cloud');
    this.viewportEl = document.getElementById('sphere-viewport');
    this.hudIcon = document.getElementById('hud-icon');
    this.hudTitle = document.getElementById('hud-title');
    this.hudBadge = document.getElementById('hud-badge');
    this.hudDesc = document.getElementById('hud-desc');
    this.hudIconWrap = document.getElementById('hud-icon-wrap');

    // Create item nodes
    this.cloudEl.innerHTML = '';
    this.items = this.tools.map((tool, idx) => {
      const el = document.createElement('div');
      el.className = 'sphere-node';
      el.dataset.index = idx;
      el.dataset.category = (tool.category || '').toLowerCase();
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', tool.name);

      el.innerHTML = `
        <div class="sphere-node__inner" style="--brand-color: ${tool.color || '#00d4ff'}">
          <img class="sphere-node__icon" src="images-and-icons/icons/${tool.icon}" alt="${tool.name}" loading="lazy" />
          <span class="sphere-node__label">${tool.name}</span>
        </div>
      `;

      this.cloudEl.appendChild(el);
      return {
        el,
        tool,
        x: 0,
        y: 0,
        z: 0,
      };
    });

    if (this.tools[0]) {
      this.updateHUD(this.tools[0]);
    }
  }

  calculatePositions() {
    const R = this.getSphereRadius();
    const count = this.items.length;
    // Golden angle in radians
    const phi = Math.PI * (3 - Math.sqrt(5));

    this.items.forEach((item, i) => {
      // Fibonacci sphere distribution
      const y = 1 - (i / (count - 1)) * 2; // from 1 to -1
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      item.x = x * R;
      item.y = y * R;
      item.z = z * R;
    });
  }

  bindEvents() {
    const vp = this.viewportEl;

    // Pointer events for smooth drag on Mouse / Touch / Pen
    const onPointerDown = (e) => {
      this.isDragging = true;
      this.targetIndex = null;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      vp.classList.add('is-grabbing');
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;

      const sensitivity = 0.005;
      this.velocity.x = dx * sensitivity;
      this.velocity.y = dy * sensitivity;

      this.rotateSphere(this.velocity.x, this.velocity.y);

      this.lastPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        vp.classList.remove('is-grabbing');
      }
    };

    vp.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Hover & Click detection on nodes
    this.items.forEach((item, idx) => {
      item.el.addEventListener('mouseenter', () => {
        this.isHovered = true;
        this.hoveredIndex = idx;
        this.updateHUD(item.tool);
      });

      item.el.addEventListener('mouseleave', () => {
        this.isHovered = false;
        this.hoveredIndex = -1;
      });

      // Click to focus and smoothly rotate to front
      item.el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateHUD(item.tool);
        this.bringToFront(idx);
        if (this.onSelect) this.onSelect(item.tool);
      });

      item.el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.updateHUD(item.tool);
          this.bringToFront(idx);
        }
      });
    });

    // Handle container resize
    window.addEventListener('resize', () => {
      this.calculatePositions();
    });
  }

  bringToFront(targetIndex) {
    this.targetIndex = targetIndex;
  }

  updateHUD(tool) {
    if (!tool) return;
    if (this.hudIcon) this.hudIcon.src = `images-and-icons/icons/${tool.icon}`;
    if (this.hudTitle) this.hudTitle.textContent = tool.name;
    if (this.hudBadge) {
      this.hudBadge.textContent = tool.category || 'Skill';
      this.hudBadge.style.borderColor = tool.color || 'var(--main-color)';
      this.hudBadge.style.color = tool.color || 'var(--main-color)';
    }
    if (this.hudDesc) this.hudDesc.textContent = tool.desc || '';
    if (this.hudIconWrap) {
      this.hudIconWrap.style.boxShadow = `0 0 20px ${tool.color ? tool.color + '44' : 'var(--main-color-glow)'}`;
    }
  }

  setCategoryFilter(category) {
    this.selectedCategory = (category || 'all').toLowerCase();
    this.items.forEach(item => {
      const itemCat = (item.tool.category || '').toLowerCase();
      const match = this.selectedCategory === 'all' || itemCat === this.selectedCategory;
      item.el.classList.toggle('is-dimmed', !match);
      item.el.classList.toggle('is-matched', match && this.selectedCategory !== 'all');
    });
  }

  rotateSphere(rotY, rotX) {
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    this.items.forEach(item => {
      // Natural rotation around Y axis (horizontal drag moves front points in direction of drag)
      const x1 = item.x * cosY + item.z * sinY;
      const z1 = -item.x * sinY + item.z * cosY;

      // Natural rotation around X axis (vertical drag moves front points in direction of drag)
      const y2 = item.y * cosX + z1 * sinX;
      const z2 = -item.y * sinX + z1 * cosX;

      item.x = x1;
      item.y = y2;
      item.z = z2;
    });
  }

  render() {
    const R = this.getSphereRadius();
    const focalLength = 380; // Perspective depth

    let frontMostItem = null;
    let maxZ = -Infinity;

    this.items.forEach((item, idx) => {
      const { x, y, z, el, tool } = item;

      // Perspective projection with safe denominator
      const denom = Math.max(90, focalLength - z);
      const scale = focalLength / denom;
      const screenX = x * scale;
      const screenY = y * scale;

      // Normalized depth [0, 1]
      const depth = (z + R) / (2 * R);
      const isItemHovered = idx === this.hoveredIndex;

      // Opacity: front is 1.0, deep back is ~0.26
      const baseOpacity = 0.26 + 0.74 * Math.max(0, Math.min(1, depth));
      const opacity = isItemHovered ? 1 : baseOpacity;

      // Z-Index ordering
      const zIndex = isItemHovered ? 1000 : Math.round(depth * 100) + 10;

      // Apply transform & visuals
      el.style.transform = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0) scale(${(scale * 0.88).toFixed(3)})`;
      el.style.opacity = opacity.toFixed(2);
      el.style.zIndex = zIndex;

      // Deep back items shouldn't block front clicks
      el.style.pointerEvents = z < -R * 0.4 ? 'none' : 'auto';

      if (isItemHovered) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }

      // Track front-most item
      if (z > maxZ) {
        maxZ = z;
        frontMostItem = tool;
      }
    });

    // Auto-update HUD to front-most item if user is not hovering any specific item
    if (!this.isHovered && frontMostItem && Math.random() < 0.015) {
      this.updateHUD(frontMostItem);
    }
  }

  startLoop() {
    const loop = () => {
      if (this.targetIndex !== null) {
        const target = this.items[this.targetIndex];
        if (target) {
          // Angle in XZ plane (Y rotation): target.x -> 0, target.z -> R
          const angleY = Math.atan2(target.x, target.z);
          // Angle in YZ plane (X rotation): target.y -> 0
          const angleX = -Math.atan2(target.y, Math.sqrt(target.x * target.x + target.z * target.z));

          const stepY = -angleY * 0.12;
          const stepX = -angleX * 0.12;

          this.rotateSphere(stepY, stepX);

          if (Math.abs(angleY) < 0.008 && Math.abs(angleX) < 0.008) {
            this.targetIndex = null;
            this.velocity = { x: 0, y: 0 };
          }
        } else {
          this.targetIndex = null;
        }
      } else if (!this.isDragging) {
        if (this.isHovered) {
          // Slow down smoothly when hovering an item
          this.velocity.x *= 0.86;
          this.velocity.y *= 0.86;
        } else {
          // Inertia damping
          this.velocity.x *= 0.94;
          this.velocity.y *= 0.94;

          // Blend into steady ambient auto-rotation
          const targetVx = this.baseSpeed.x;
          const targetVy = this.baseSpeed.y;
          this.velocity.x += (targetVx - this.velocity.x) * 0.035;
          this.velocity.y += (targetVy - this.velocity.y) * 0.035;
        }

        this.rotateSphere(this.velocity.x, this.velocity.y);
      }

      this.render();
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
