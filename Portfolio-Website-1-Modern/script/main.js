import renderAllContents from "./render-contents.js";
import handleAllAnimations from "./animations.js";
import emailSender from "./email-sender.js";
import { personalData } from "../data/personal-data.js";
import { createBadgeTextures } from "./badge-generator.js";

/**
 * ── Theme Toggle (Dark / Light Mode) ──
 * Apply saved theme before render to avoid flash
 */
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.documentElement.classList.add('light-mode');
}

/**
 * Initialize the rendering of all contents
 */
renderAllContents();

/**
 * Bind theme toggle button (rendered dynamically, so bind AFTER render)
 */
// Wait a bit for render to complete, then bind
const initThemeToggle = () => {
  const themeBtn = document.getElementById('theme-toggle-btn');
  
  if (!themeBtn) {
    console.warn('[Theme] Button not found, retrying...');
    setTimeout(initThemeToggle, 100);
    return;
  }

  const updateToggleState = (isLight) => {
    themeBtn.setAttribute('aria-pressed', isLight ? 'false' : 'true');
    themeBtn.classList.toggle('light', isLight);
    themeBtn.classList.toggle('dark', !isLight);
    themeBtn.setAttribute('title', isLight ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng');
  };

  // Initial state sync
  const isLightOnLoad = document.documentElement.classList.contains('light-mode');
  updateToggleState(isLightOnLoad);

  // Bind click handler
  themeBtn.addEventListener('click', () => {
    const isLight = document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateToggleState(isLight);
    console.log('[Theme] Toggled to:', isLight ? 'light' : 'dark');
  });
};

// Call immediately, will retry if button not found
initThemeToggle();



/**
 * Initialize animations when the page is fully loaded
 */
window.addEventListener('load', () => {
  handleAllAnimations();
});

/**
 * Change dot color based on work status
 * - If the status is 'Available for work', activate the work status dot
 * - Otherwise, deactivate it
 */
const workStatusLabel = document.querySelector('.header__work-status-label')?.innerText;
const workStatusDot = document.querySelector('.header__work-status-dot');

if (workStatusLabel && workStatusDot) {
  if (workStatusLabel === 'Available for work') {
    workStatusDot.classList.add('active');
  } else {
    workStatusDot.classList.remove('active');
  }
}

/**
 * Initialize email sending feature
 */
emailSender();

/**
 * ── Initialize 3D Interactive Lanyard Profile Card ──
 */
let lanyardMounted = false;

async function initLanyardCard() {
  if (lanyardMounted) {
    console.log('[Lanyard] Already mounted, skipping...');
    return;
  }
  
  const container = document.getElementById('lanyard-root');
  console.log('[Lanyard] Container found:', !!container);
  console.log('[Lanyard] window.mountLanyard available:', typeof window.mountLanyard);
  
  if (!container) {
    console.error('[Lanyard] Container #lanyard-root not found');
    return;
  }
  
  if (!window.mountLanyard) {
    console.error('[Lanyard] window.mountLanyard not available. Bundle may not have loaded.');
    return;
  }

  // Only mount on desktop/laptop screen widths for smooth 60fps & proper spacing
  if (window.innerWidth < 900) {
    console.log('[Lanyard] Viewport width too small:', window.innerWidth, '< 900px');
    return;
  }

  try {
    console.log('[Lanyard] Starting badge generation...');
    const profileImgPath = `images-and-icons/images/${personalData.profilePicture || 'my-profile.png'}`;
    console.log('[Lanyard] Profile image path:', profileImgPath);
    
    const badge = await createBadgeTextures(profileImgPath);
    console.log('[Lanyard] Badge textures generated successfully');
    console.log('[Lanyard] Badge front:', badge.front?.substring(0, 50), '...');
    console.log('[Lanyard] Badge back:', badge.back?.substring(0, 50), '...');

    console.log('[Lanyard] Mounting 3D card...');
    window.mountLanyard('lanyard-root', {
      frontImage: badge.front,
      backImage: badge.back,
      position: [0, 0, 28],
      gravity: [0, -35, 0],
      fov: 22,
      transparent: true,
    });

    lanyardMounted = true;
    document.body.classList.add('lanyard-loaded');
    console.log('[Lanyard] Successfully mounted!');
  } catch (err) {
    console.error('[Lanyard] Failed to initialize:', err);
    console.error('[Lanyard] Stack:', err.stack);
  }
}

window.updateLanyardProfile = async (imageName) => {
  if (!lanyardMounted || !window.mountLanyard) return;
  try {
    const profileImgPath = `images-and-icons/images/${imageName}`;
    const badge = await createBadgeTextures(profileImgPath);
    window.mountLanyard('lanyard-root', {
      frontImage: badge.front,
      backImage: badge.back,
      position: [0, 0, 28],
      gravity: [0, -35, 0],
      fov: 22,
      transparent: true,
    });
  } catch (err) {
    console.error('[Lanyard] Failed to update profile:', err);
  }
};

// Mount when window is loaded or on resize if widening screen
window.addEventListener('load', () => {
  console.log('[Lanyard] Window load event fired');
  initLanyardCard();
});

window.addEventListener('resize', () => {
  if (!lanyardMounted && window.innerWidth >= 900) {
    console.log('[Lanyard] Resize event: width now', window.innerWidth, 'px - attempting mount');
    initLanyardCard();
  }
});





