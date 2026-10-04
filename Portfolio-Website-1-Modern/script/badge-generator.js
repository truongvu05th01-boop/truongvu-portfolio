/**
 * Badge Texture Generator for 3D Lanyard Card
 * Generates front and back ID card textures dynamically on canvas.
 */

// Polyfill for Canvas roundRect (for older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

export async function createBadgeTextures(photoSrc) {
  const width = 600;
  const height = 900;

  // Helper to load an image
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  let photo = null;
  if (photoSrc) {
    try {
      photo = await loadImage(photoSrc);
    } catch (e) {
      console.warn('Failed to load profile photo for badge:', e);
    }
  }

  // --- Front Face Canvas ---
  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = width;
  frontCanvas.height = height;
  const fCtx = frontCanvas.getContext('2d');

  // Background
  const bgGrad = fCtx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0a0f1d');
  bgGrad.addColorStop(0.5, '#111827');
  bgGrad.addColorStop(1, '#070b14');
  fCtx.fillStyle = bgGrad;
  fCtx.fillRect(0, 0, width, height);

  // Modern decorative mesh / grid lines
  fCtx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
  fCtx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    fCtx.beginPath();
    fCtx.moveTo(x, 0);
    fCtx.lineTo(x, height);
    fCtx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    fCtx.beginPath();
    fCtx.moveTo(0, y);
    fCtx.lineTo(width, y);
    fCtx.stroke();
  }

  // Neon glowing border
  fCtx.strokeStyle = '#00d4ff';
  fCtx.lineWidth = 4;
  fCtx.strokeRect(18, 18, width - 36, height - 36);

  // Corner accents
  fCtx.fillStyle = '#00d4ff';
  const cornerSize = 16;
  fCtx.fillRect(18, 18, cornerSize, 4);
  fCtx.fillRect(18, 18, 4, cornerSize);
  fCtx.fillRect(width - 18 - cornerSize, 18, cornerSize, 4);
  fCtx.fillRect(width - 22, 18, 4, cornerSize);
  fCtx.fillRect(18, height - 22, cornerSize, 4);
  fCtx.fillRect(18, height - 18 - cornerSize, 4, cornerSize);
  fCtx.fillRect(width - 18 - cornerSize, height - 22, cornerSize, 4);
  fCtx.fillRect(width - 22, height - 18 - cornerSize, 4, cornerSize);

  // Header banner
  fCtx.fillStyle = '#00d4ff';
  fCtx.font = 'bold 22px "Inter", sans-serif';
  fCtx.textAlign = 'center';
  fCtx.fillText('DEVELOPER PASS', width / 2, 70);

  fCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  fCtx.font = '500 13px "Inter", sans-serif';
  fCtx.fillText('VERIFIED TALENT • 2026', width / 2, 95);

  // Avatar / Profile photo frame
  const avatarSize = 340;
  const avatarX = (width - avatarSize) / 2;
  const avatarY = 125;

  // Frame background / border
  fCtx.save();
  fCtx.beginPath();
  fCtx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 24);
  fCtx.fillStyle = '#1e293b';
  fCtx.fill();
  fCtx.strokeStyle = '#00d4ff';
  fCtx.lineWidth = 3;
  fCtx.stroke();
  fCtx.clip();

  if (photo) {
    // Draw photo centered & scaled to cover
    const scale = Math.max(avatarSize / photo.width, avatarSize / photo.height);
    const sw = photo.width * scale;
    const sh = photo.height * scale;
    const sx = avatarX + (avatarSize - sw) / 2;
    const sy = avatarY + (avatarSize - sh) / 2;
    fCtx.drawImage(photo, sx, sy, sw, sh);
  } else {
    fCtx.fillStyle = '#334155';
    fCtx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
  }
  fCtx.restore();

  // Name
  fCtx.fillStyle = '#ffffff';
  fCtx.font = 'bold 30px "Inter", sans-serif';
  fCtx.textAlign = 'center';
  fCtx.fillText('TRƯỜNG VŨ', width / 2, 515);

  // Role
  fCtx.fillStyle = '#00d4ff';
  fCtx.font = '600 18px "Inter", sans-serif';
  fCtx.fillText('FULL-STACK DEVELOPER', width / 2, 550);

  // University / Subtitle
  fCtx.fillStyle = '#94a3b8';
  fCtx.font = '500 15px "Inter", sans-serif';
  fCtx.fillText('Đại học Công Nghệ TP.HCM (HUTECH)', width / 2, 580);

  // Chip Icon (Smart EMV Chip graphic)
  const chipX = 55;
  const chipY = 640;
  fCtx.fillStyle = '#d4af37';
  fCtx.beginPath();
  fCtx.roundRect(chipX, chipY, 65, 48, 8);
  fCtx.fill();
  fCtx.strokeStyle = '#854d0e';
  fCtx.lineWidth = 1.5;
  fCtx.stroke();
  // Chip contacts
  fCtx.strokeStyle = '#713f12';
  fCtx.beginPath();
  fCtx.moveTo(chipX + 22, chipY);
  fCtx.lineTo(chipX + 22, chipY + 48);
  fCtx.moveTo(chipX + 43, chipY);
  fCtx.lineTo(chipX + 43, chipY + 48);
  fCtx.moveTo(chipX, chipY + 24);
  fCtx.lineTo(chipX + 65, chipY + 24);
  fCtx.stroke();

  // Barcode lines at bottom
  const barcodeX = 55;
  const barcodeY = 740;
  const barcodeW = width - 110;
  fCtx.fillStyle = '#ffffff';
  for (let bx = 0; bx < barcodeW; bx += 7) {
    const barWidth = (bx % 3 === 0) ? 4 : (bx % 2 === 0 ? 2 : 3);
    fCtx.fillRect(barcodeX + bx, barcodeY, barWidth, 55);
  }

  // Barcode number
  fCtx.fillStyle = '#94a3b8';
  fCtx.font = '13px monospace';
  fCtx.textAlign = 'center';
  fCtx.fillText('BOOP-2026-VN-0333030276', width / 2, 825);

  // Status indicator
  fCtx.fillStyle = '#22c55e';
  fCtx.beginPath();
  fCtx.arc(width - 65, 664, 7, 0, Math.PI * 2);
  fCtx.fill();
  fCtx.fillStyle = '#94a3b8';
  fCtx.font = '600 13px "Inter", sans-serif';
  fCtx.textAlign = 'right';
  fCtx.fillText('AVAILABLE', width - 80, 669);


  // --- Back Face Canvas ---
  const backCanvas = document.createElement('canvas');
  backCanvas.width = width;
  backCanvas.height = height;
  const bCtx = backCanvas.getContext('2d');

  // Background
  const bbgGrad = bCtx.createLinearGradient(0, 0, width, height);
  bbgGrad.addColorStop(0, '#0a0f1d');
  bbgGrad.addColorStop(1, '#05070e');
  bCtx.fillStyle = bbgGrad;
  bCtx.fillRect(0, 0, width, height);

  // Magnetic stripe
  bCtx.fillStyle = '#020617';
  bCtx.fillRect(0, 50, width, 90);

  // Border
  bCtx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
  bCtx.lineWidth = 3;
  bCtx.strokeRect(18, 18, width - 36, height - 36);

  // Contact Info
  bCtx.fillStyle = '#ffffff';
  bCtx.font = 'bold 24px "Inter", sans-serif';
  bCtx.textAlign = 'center';
  bCtx.fillText('PORTFOLIO & CONTACT', width / 2, 200);

  bCtx.fillStyle = '#00d4ff';
  bCtx.font = '600 16px "Inter", sans-serif';
  bCtx.fillText('SCAN OR CONNECT DIRECTLY', width / 2, 230);

  // Details
  const items = [
    { label: 'EMAIL', value: 'truongvu05th01@gmail.com' },
    { label: 'PHONE', value: '0333 030 276' },
    { label: 'LOCATION', value: 'TP. Hồ Chí Minh' },
    { label: 'GITHUB', value: 'github.com/truongvu05th01-boop' },
    { label: 'STATUS', value: 'Ready for Internship / Full-time' },
  ];

  let itemY = 300;
  items.forEach((item) => {
    bCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    bCtx.beginPath();
    bCtx.roundRect(40, itemY, width - 80, 65, 12);
    bCtx.fill();
    bCtx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    bCtx.lineWidth = 1;
    bCtx.stroke();

    bCtx.textAlign = 'left';
    bCtx.fillStyle = '#00d4ff';
    bCtx.font = 'bold 12px "Inter", sans-serif';
    bCtx.fillText(item.label, 60, itemY + 26);

    bCtx.fillStyle = '#f8fafc';
    bCtx.font = '500 15px "Inter", sans-serif';
    bCtx.fillText(item.value, 60, itemY + 50);

    itemY += 80;
  });

  // Footer note
  bCtx.textAlign = 'center';
  bCtx.fillStyle = '#64748b';
  bCtx.font = '12px "Inter", sans-serif';
  bCtx.fillText('Handmade 3D Interactive Portfolio • Powered by Three.js', width / 2, 790);
  bCtx.fillStyle = '#00d4ff';
  bCtx.font = 'bold 12px monospace';
  bCtx.fillText('DRAG AND RELEASE TO PLAY WITH PHYSICS', width / 2, 820);

  return {
    front: frontCanvas.toDataURL('image/png'),
    back: backCanvas.toDataURL('image/png'),
  };
}
