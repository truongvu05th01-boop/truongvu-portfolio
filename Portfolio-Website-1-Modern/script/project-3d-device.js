/**
 * 3D Project Device Showcase (Laptop & Phone)
 * Built with Three.js WebGL:
 * Features: Minimalist 3D Laptop/Phone, dynamic screen texture crossfading,
 * mouse 360° drag rotation, inertia physics, ambient floating, and external card sync.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Project3DDevice {
  constructor({ containerId, projects = [], onProjectChange = null }) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.projects = projects;
    this.onProjectChange = onProjectChange;
    this.currentIndex = 0;
    this.deviceType = 'laptop'; // 'laptop' | 'phone'
    this.isDragging = false;
    this.isHovering = false;
    this.lastPointer = { x: 0, y: 0 };
    this.velocity = { x: 0.003, y: 0 };
    this.baseSpeed = { x: 0.0025, y: 0 };
    this.autoRotate = true;
    this.autoSlide = true;
    this.slideInterval = null;
    this.loadedImages = {};
    this.crossfade = {
      active: false,
      fromIdx: 0,
      toIdx: 0,
      progress: 1,
      startTime: 0,
      duration: 550, // ms
    };

    this.init();
  }

  async init() {
    this.setupDOM();
    this.setupOffscreenCanvas();
    this.setupThree();
    this.createShadow();
    this.createLaptop();
    this.createPhone();
    this.setDevice(this.deviceType);
    this.bindEvents();
    await this.preloadImages();
    this.renderScreenTexture();
    this.startAutoSlide();
    this.startAnimationLoop();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div class="project-3d-wrapper">
        <!-- Top Toolbar: Device switcher & Auto-play indicator -->
        <div class="project-3d-toolbar">
          <div class="device-switch-group">
            <button class="device-toggle-btn active" data-device="laptop" id="toggle-laptop-btn" title="Chế độ Laptop 3D">
              <i class="ph ph-laptop"></i> <span>Laptop 3D</span>
            </button>
            <button class="device-toggle-btn" data-device="phone" id="toggle-phone-btn" title="Chế độ Điện thoại 3D">
              <i class="ph ph-device-mobile"></i> <span>Phone 3D</span>
            </button>
          </div>

          <div class="slide-indicator-group">
            <span class="slide-counter" id="slide-counter">01 / ${String(this.projects.length).padStart(2, '0')}</span>
            <button class="control-btn" id="slide-prev-btn" title="Dự án trước"><i class="ph ph-caret-left"></i></button>
            <button class="control-btn" id="slide-play-btn" title="Tạm dừng / Tiếp tục"><i class="ph ph-pause"></i></button>
            <button class="control-btn" id="slide-next-btn" title="Dự án tiếp theo"><i class="ph ph-caret-right"></i></button>
          </div>
        </div>

        <!-- 3D Canvas Viewport -->
        <div class="project-3d-viewport" id="project-3d-viewport" aria-label="3D Project Device Viewport">
          <canvas id="project-three-canvas"></canvas>
          <div class="viewport-drag-hint">
            <i class="ph ph-arrows-clockwise"></i>
            <span>Kéo chuột để xoay 360°</span>
          </div>
        </div>

        <!-- Bottom Active Project HUD Card -->
        <div class="project-3d-hud" id="project-3d-hud">
          <div class="hud-project-info">
            <div class="hud-project-header">
              <span class="hud-category-badge" id="hud-project-category">${this.projects[0]?.category || 'Dự án nổi bật'}</span>
              <span class="hud-indicator-dot"></span>
            </div>
            <h3 class="hud-project-title" id="hud-project-title">${this.projects[0]?.title || ''}</h3>
            <p class="hud-project-detail" id="hud-project-detail">${this.projects[0]?.detail || ''}</p>
          </div>
          <div class="hud-project-actions">
            <a href="${this.projects[0]?.link || '#'}" target="_blank" rel="noopener" class="hud-view-btn" id="hud-project-link">
              <span>Xem Dự Án</span>
              <i class="ph ph-arrow-up-right"></i>
            </a>
          </div>
        </div>

        <!-- Project Dots Indicator -->
        <div class="project-dots-nav" id="project-dots-nav">
          ${this.projects.map((p, idx) => `
            <button class="project-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" title="${p.title}" aria-label="Project ${idx + 1}"></button>
          `).join('')}
        </div>
      </div>
    `;

    this.viewportEl = document.getElementById('project-3d-viewport');
    this.canvasEl = document.getElementById('project-three-canvas');
    this.hudCategory = document.getElementById('hud-project-category');
    this.hudTitle = document.getElementById('hud-project-title');
    this.hudDetail = document.getElementById('hud-project-detail');
    this.hudLink = document.getElementById('hud-project-link');
    this.slideCounter = document.getElementById('slide-counter');
    this.playBtn = document.getElementById('slide-play-btn');
  }

  setupOffscreenCanvas() {
    // 16:10 Laptop Screen (1280x800)
    this.laptopCanvas = document.createElement('canvas');
    this.laptopCanvas.width = 1280;
    this.laptopCanvas.height = 800;
    this.laptopCtx = this.laptopCanvas.getContext('2d');
    this.laptopTexture = new THREE.CanvasTexture(this.laptopCanvas);
    this.laptopTexture.anisotropy = 8;

    // 19.5:9 Phone Screen (640x1380)
    this.phoneCanvas = document.createElement('canvas');
    this.phoneCanvas.width = 640;
    this.phoneCanvas.height = 1380;
    this.phoneCtx = this.phoneCanvas.getContext('2d');
    this.phoneTexture = new THREE.CanvasTexture(this.phoneCanvas);
    this.phoneTexture.anisotropy = 8;
  }

  async preloadImages() {
    const promises = this.projects.map(p => {
      return new Promise(resolve => {
        const img = new Image();
        img.src = `images-and-icons/images/${p.image}`;
        img.onload = () => {
          this.loadedImages[p.image] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn('[3D Device] Failed to load image:', p.image);
          resolve();
        };
      });
    });
    await Promise.all(promises);
  }

  setupThree() {
    const width = this.viewportEl.clientWidth || 580;
    const height = width < 600 ? 350 : 420;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0.85, 4.8);
    this.camera.lookAt(0, -0.05, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasEl,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight1.position.set(4, 5, 4);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-4, 3, -2);
    this.scene.add(dirLight2);

    // Cyan/Blue Rim Light (matching site accent)
    const isLightMode = document.documentElement.classList.contains('light-mode');
    this.rimLight = new THREE.PointLight(isLightMode ? 0x3b82f6 : 0x00d4ff, 3.2, 10);
    this.rimLight.position.set(-2.5, 1.5, 1.8);
    this.scene.add(this.rimLight);

    // Main rotating device group
    this.deviceGroup = new THREE.Group();
    this.scene.add(this.deviceGroup);
  }

  createShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(4.2, 3.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = -0.95;
    this.scene.add(this.shadowMesh);
  }

  createLaptop() {
    this.laptopGroup = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1b202c,
      metalness: 0.88,
      roughness: 0.32,
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x0f131a,
      metalness: 0.7,
      roughness: 0.6,
    });

    // 1. Base Chassis
    const baseGeo = new THREE.BoxGeometry(3.3, 0.075, 2.25);
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    baseMesh.position.set(0, -0.038, 0);
    this.laptopGroup.add(baseMesh);

    // Front notch
    const notchGeo = new THREE.BoxGeometry(0.55, 0.03, 0.05);
    const notchMesh = new THREE.Mesh(notchGeo, darkMetalMat);
    notchMesh.position.set(0, 0.015, 1.12);
    this.laptopGroup.add(notchMesh);

    // Keyboard well
    const kbWellGeo = new THREE.BoxGeometry(2.85, 0.015, 1.15);
    const kbWellMesh = new THREE.Mesh(kbWellGeo, darkMetalMat);
    kbWellMesh.position.set(0, 0.005, -0.22);
    this.laptopGroup.add(kbWellMesh);

    // Keycaps grid
    const keysGeo = new THREE.PlaneGeometry(2.78, 1.08);
    const keysCanvas = document.createElement('canvas');
    keysCanvas.width = 512;
    keysCanvas.height = 200;
    const kCtx = keysCanvas.getContext('2d');
    kCtx.fillStyle = '#0a0d14';
    kCtx.fillRect(0, 0, 512, 200);
    kCtx.strokeStyle = 'rgba(0, 212, 255, 0.12)';
    kCtx.lineWidth = 2;
    const rows = 5;
    const cols = 14;
    const rw = 504 / cols;
    const rh = 192 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        kCtx.fillStyle = '#141822';
        kCtx.fillRect(4 + c * rw + 2, 4 + r * rh + 2, rw - 4, rh - 4);
        kCtx.strokeRect(4 + c * rw + 2, 4 + r * rh + 2, rw - 4, rh - 4);
      }
    }
    const keysTex = new THREE.CanvasTexture(keysCanvas);
    const keysMat = new THREE.MeshStandardMaterial({
      map: keysTex,
      roughness: 0.5,
      metalness: 0.2,
    });
    const keysMesh = new THREE.Mesh(keysGeo, keysMat);
    keysMesh.rotation.x = -Math.PI / 2;
    keysMesh.position.set(0, 0.015, -0.22);
    this.laptopGroup.add(keysMesh);

    // Trackpad
    const padGeo = new THREE.BoxGeometry(0.95, 0.01, 0.65);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x161a24,
      metalness: 0.6,
      roughness: 0.25,
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(0, 0.005, 0.62);
    this.laptopGroup.add(padMesh);

    // Hinge
    const hingeGeo = new THREE.CylinderGeometry(0.045, 0.045, 3.0, 16);
    const hingeMesh = new THREE.Mesh(hingeGeo, darkMetalMat);
    hingeMesh.rotation.z = Math.PI / 2;
    hingeMesh.position.set(0, 0.02, -1.09);
    this.laptopGroup.add(hingeMesh);

    // 2. Display Assembly (Lid + Screen)
    this.lidGroup = new THREE.Group();
    this.lidGroup.position.set(0, 0.02, -1.09);
    this.lidGroup.rotation.x = -0.28; // Tilted angle ~108 degrees

    const lidBackGeo = new THREE.BoxGeometry(3.3, 2.15, 0.045);
    const lidBackMesh = new THREE.Mesh(lidBackGeo, metalMat);
    lidBackMesh.position.set(0, 1.05, -0.022);
    this.lidGroup.add(lidBackMesh);

    const bezelGeo = new THREE.BoxGeometry(3.28, 2.13, 0.01);
    const bezelMesh = new THREE.Mesh(bezelGeo, darkMetalMat);
    bezelMesh.position.set(0, 1.05, 0.005);
    this.lidGroup.add(bezelMesh);

    const camGeo = new THREE.CircleGeometry(0.015, 12);
    const camMat = new THREE.MeshBasicMaterial({ color: 0x05070a });
    const camMesh = new THREE.Mesh(camGeo, camMat);
    camMesh.position.set(0, 2.06, 0.012);
    this.lidGroup.add(camMesh);

    const screenGeo = new THREE.PlaneGeometry(3.12, 1.95);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.laptopTexture,
      toneMapped: false,
    });
    this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.screenMesh.position.set(0, 1.05, 0.012);
    this.lidGroup.add(this.screenMesh);

    this.laptopGroup.add(this.lidGroup);
    this.laptopGroup.position.set(0, -0.15, 0);
    this.deviceGroup.add(this.laptopGroup);
  }

  createPhone() {
    this.phoneGroup = new THREE.Group();

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      metalness: 0.92,
      roughness: 0.22,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      metalness: 0.5,
      roughness: 0.8,
    });

    const bodyGeo = new THREE.BoxGeometry(1.5, 3.05, 0.12);
    const bodyMesh = new THREE.Mesh(bodyGeo, titaniumMat);
    this.phoneGroup.add(bodyMesh);

    const screenGeo = new THREE.PlaneGeometry(1.42, 2.95);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.phoneTexture,
      toneMapped: false,
    });
    this.phoneScreenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.phoneScreenMesh.position.set(0, 0, 0.062);
    this.phoneGroup.add(this.phoneScreenMesh);

    const pillGeo = new THREE.BoxGeometry(0.38, 0.07, 0.01);
    const pillMesh = new THREE.Mesh(pillGeo, darkMat);
    pillMesh.position.set(0, 1.34, 0.065);
    this.phoneGroup.add(pillMesh);

    const camBumpGeo = new THREE.BoxGeometry(0.65, 0.65, 0.06);
    const camBump = new THREE.Mesh(camBumpGeo, titaniumMat);
    camBump.position.set(0.35, 1.05, -0.08);
    this.phoneGroup.add(camBump);

    this.phoneGroup.position.set(0, 0, 0);
    this.phoneGroup.visible = false;
    this.deviceGroup.add(this.phoneGroup);
  }

  setDevice(type) {
    this.deviceType = type;
    if (type === 'laptop') {
      this.laptopGroup.visible = true;
      this.phoneGroup.visible = false;
      this.deviceGroup.rotation.x = 0.12;
      this.shadowMesh.scale.set(1, 1, 1);
    } else {
      this.laptopGroup.visible = false;
      this.phoneGroup.visible = true;
      this.deviceGroup.rotation.x = -0.05;
      this.shadowMesh.scale.set(0.55, 0.8, 1);
    }
    this.renderScreenTexture();
  }

  renderScreenTexture() {
    const pCurrent = this.projects[this.currentIndex];
    if (!pCurrent) return;

    if (this.deviceType === 'laptop') {
      this.drawLaptopScreen();
    } else {
      this.drawPhoneScreen();
    }
  }

  drawLaptopScreen() {
    const ctx = this.laptopCtx;
    const w = this.laptopCanvas.width;
    const h = this.laptopCanvas.height;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Browser Header Bar (Height: 52px)
    const barH = 52;
    ctx.fillStyle = '#101522';
    ctx.fillRect(0, 0, w, barH);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(w, barH);
    ctx.stroke();

    // Traffic Lights (● ● ●)
    const dots = [
      { color: '#ff5f56', x: 26 },
      { color: '#ffbd2e', x: 46 },
      { color: '#27c93f', x: 66 },
    ];
    dots.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, barH / 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    });

    // Browser URL Bar Pill
    const urlW = 540;
    const urlH = 30;
    const urlX = (w - urlW) / 2;
    const urlY = (barH - urlH) / 2;
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(urlX, urlY, urlW, urlH, 8);
    } else {
      ctx.rect(urlX, urlY, urlW, urlH);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.fillStyle = '#8ea1b8';
    ctx.font = '13px "Albert Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cleanTitle = (this.projects[this.currentIndex]?.title || 'portfolio').toLowerCase().replace(/\s+/g, '-');
    ctx.fillText(`🔒 https://truongvu.dev/projects/${cleanTitle}`, w / 2, barH / 2);

    // Draw Screenshot
    const contentH = h - barH;

    const drawProject = (idx, opacity = 1) => {
      const proj = this.projects[idx];
      if (!proj) return;
      const img = this.loadedImages[proj.image];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = opacity;

        const imgAspect = img.width / img.height;
        const areaAspect = w / contentH;
        let dw, dh, dx, dy;
        if (imgAspect > areaAspect) {
          dh = contentH;
          dw = dh * imgAspect;
          dx = (w - dw) / 2;
          dy = barH;
        } else {
          dw = w;
          dh = dw / imgAspect;
          dx = 0;
          dy = barH + (contentH - dh) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } else {
        // Fallback
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#101726';
        ctx.fillRect(0, barH, w, contentH);
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 36px "Albert Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(proj.title, w / 2, barH + contentH / 2);
        ctx.restore();
      }
    };

    if (this.crossfade.active) {
      drawProject(this.crossfade.fromIdx, 1 - this.crossfade.progress);
      drawProject(this.crossfade.toIdx, this.crossfade.progress);
    } else {
      drawProject(this.currentIndex, 1);
    }

    // Specular Sheen Gradient
    const sheenGrad = ctx.createLinearGradient(0, 0, w, h);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    sheenGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
    sheenGrad.addColorStop(0.6, 'transparent');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, w, h);

    this.laptopTexture.needsUpdate = true;
  }

  drawPhoneScreen() {
    const ctx = this.phoneCtx;
    const w = this.phoneCanvas.width;
    const h = this.phoneCanvas.height;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Status bar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Albert Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('9:41', 45, 48);

    ctx.textAlign = 'right';
    ctx.font = '16px "Albert Sans", sans-serif';
    ctx.fillText('5G  100%', w - 45, 48);

    const startY = 90;
    const contentH = h - startY - 40;

    const drawPhoneProj = (idx, opacity = 1) => {
      const proj = this.projects[idx];
      if (!proj) return;
      const img = this.loadedImages[proj.image];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = opacity;

        const imgAspect = img.width / img.height;
        const areaAspect = w / contentH;
        let dw, dh, dx, dy;
        if (imgAspect > areaAspect) {
          dh = contentH;
          dw = dh * imgAspect;
          dx = (w - dw) / 2;
          dy = startY;
        } else {
          dw = w;
          dh = dw / imgAspect;
          dx = 0;
          dy = startY + (contentH - dh) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      }
    };

    if (this.crossfade.active) {
      drawPhoneProj(this.crossfade.fromIdx, 1 - this.crossfade.progress);
      drawPhoneProj(this.crossfade.toIdx, this.crossfade.progress);
    } else {
      drawPhoneProj(this.currentIndex, 1);
    }

    // Home indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect((w - 180) / 2, h - 22, 180, 5, 3);
    } else {
      ctx.rect((w - 180) / 2, h - 22, 180, 5);
    }
    ctx.fill();

    this.phoneTexture.needsUpdate = true;
  }

  setProject(newIndex, animate = true) {
    if (newIndex < 0) newIndex = this.projects.length - 1;
    if (newIndex >= this.projects.length) newIndex = 0;
    if (newIndex === this.currentIndex && !this.crossfade.active) return;

    if (animate) {
      this.crossfade = {
        active: true,
        fromIdx: this.currentIndex,
        toIdx: newIndex,
        progress: 0,
        startTime: performance.now(),
        duration: 500,
      };
    }

    this.currentIndex = newIndex;
    this.updateHUD();

    if (this.onProjectChange) {
      this.onProjectChange(newIndex, this.projects[newIndex]);
    }
  }

  updateHUD() {
    const p = this.projects[this.currentIndex];
    if (!p) return;

    if (this.hudTitle) this.hudTitle.textContent = p.title;
    if (this.hudDetail) this.hudDetail.textContent = p.detail;
    if (this.hudCategory) this.hudCategory.textContent = p.category || 'Dự án thực tế';
    if (this.hudLink) this.hudLink.href = p.link || '#';
    if (this.slideCounter) {
      this.slideCounter.textContent = `${String(this.currentIndex + 1).padStart(2, '0')} / ${String(this.projects.length).padStart(2, '0')}`;
    }

    const dots = this.container.querySelectorAll('.project-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.currentIndex);
    });

    const externalCards = document.querySelectorAll('.project-card');
    externalCards.forEach((card, idx) => {
      card.classList.toggle('is-featured-active', idx === this.currentIndex);
    });
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.slideInterval = setInterval(() => {
      if (this.autoSlide && !this.isDragging && !this.isHovering) {
        this.setProject(this.currentIndex + 1);
      }
    }, 4500);
  }

  stopAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  handleResize() {
    if (!this.viewportEl || !this.renderer || !this.camera) return;
    const w = this.viewportEl.clientWidth;
    const h = w < 600 ? 350 : 420;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  bindEvents() {
    const vp = this.viewportEl;

    // Hover pause auto-slide
    vp.addEventListener('mouseenter', () => {
      this.isHovering = true;
    });
    vp.addEventListener('mouseleave', () => {
      this.isHovering = false;
    });

    // Pointer events for 3D Drag Rotation
    const onPointerDown = (e) => {
      this.isDragging = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      vp.classList.add('is-grabbing');
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;

      const sensitivity = 0.007;
      this.velocity.x = dx * sensitivity;
      this.velocity.y = dy * sensitivity;

      this.deviceGroup.rotation.y += this.velocity.x;
      this.deviceGroup.rotation.x = Math.max(-0.4, Math.min(0.5, this.deviceGroup.rotation.x + this.velocity.y));

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

    // Device switch buttons
    const laptopBtn = document.getElementById('toggle-laptop-btn');
    const phoneBtn = document.getElementById('toggle-phone-btn');
    if (laptopBtn && phoneBtn) {
      laptopBtn.addEventListener('click', () => {
        laptopBtn.classList.add('active');
        phoneBtn.classList.remove('active');
        this.setDevice('laptop');
      });
      phoneBtn.addEventListener('click', () => {
        phoneBtn.classList.add('active');
        laptopBtn.classList.remove('active');
        this.setDevice('phone');
      });
    }

    // Slider Controls
    const prevBtn = document.getElementById('slide-prev-btn');
    const nextBtn = document.getElementById('slide-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.setProject(this.currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.setProject(this.currentIndex + 1));

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => {
        this.autoSlide = !this.autoSlide;
        this.playBtn.innerHTML = this.autoSlide ? '<i class="ph ph-pause"></i>' : '<i class="ph ph-play"></i>';
      });
    }

    // Project Dot Navigation
    const dotsNav = document.getElementById('project-dots-nav');
    if (dotsNav) {
      dotsNav.addEventListener('click', (e) => {
        const dot = e.target.closest('.project-dot');
        if (dot && dot.dataset.index !== undefined) {
          this.setProject(parseInt(dot.dataset.index, 10));
        }
      });
    }

    // Theme Toggle Sync
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        setTimeout(() => {
          const isLight = document.documentElement.classList.contains('light-mode');
          if (this.rimLight) {
            this.rimLight.color.setHex(isLight ? 0x3b82f6 : 0x00d4ff);
          }
        }, 100);
      });
    }

    // Window & Container Resize
    window.addEventListener('resize', () => this.handleResize());
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.viewportEl);
    }
  }

  startAnimationLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Handle Crossfade Transition
      if (this.crossfade.active) {
        const elapsed = currentTime - this.crossfade.startTime;
        this.crossfade.progress = Math.min(1, elapsed / this.crossfade.duration);
        this.renderScreenTexture();
        if (this.crossfade.progress >= 1) {
          this.crossfade.active = false;
        }
      }

      // Physics & Auto-Orbit
      if (!this.isDragging) {
        this.velocity.x *= 0.94;
        this.velocity.y *= 0.94;

        if (this.autoRotate) {
          this.velocity.x += (this.baseSpeed.x - this.velocity.x) * 0.035;
        }

        this.deviceGroup.rotation.y += this.velocity.x;
      }

      // Ambient Floating / Breathing Motion
      const time = currentTime * 0.0015;
      const floatY = Math.sin(time) * 0.06;
      this.deviceGroup.position.y = (this.deviceType === 'laptop' ? -0.1 : 0) + floatY;
      this.deviceGroup.rotation.z = Math.sin(time * 0.8) * 0.015;

      // Dynamic ground shadow scale
      if (this.shadowMesh) {
        const shadowScale = 1 - floatY * 0.8;
        this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
        this.shadowMesh.material.opacity = 0.55 - floatY * 0.3;
      }

      this.renderer.render(this.scene, this.camera);
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  destroy() {
    this.stopAutoSlide();
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
