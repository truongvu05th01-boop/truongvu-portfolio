import React from 'react';
import ReactDOM from 'react-dom/client';
import Lanyard from './Lanyard';

// Inject necessary base CSS
if (typeof document !== 'undefined') {
  const styleId = 'lanyard-widget-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .lanyard-wrapper {
        position: relative;
        z-index: 0;
        width: 100%;
        height: 100%;
        min-height: 420px;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: visible;
      }
      .lanyard-wrapper canvas {
        width: 100% !important;
        height: 100% !important;
        touch-action: none;
        outline: none;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Mount the Lanyard 3D card widget into a given DOM element.
 * Called from vanilla HTML portfolio page.
 */
function mountLanyard(containerIdOrElement, options = {}) {
  const container = typeof containerIdOrElement === 'string'
    ? document.getElementById(containerIdOrElement)
    : containerIdOrElement;

  if (!container) {
    console.error(`[Lanyard] Container not found:`, containerIdOrElement);
    return null;
  }

  if (!container._lanyardRoot) {
    container._lanyardRoot = ReactDOM.createRoot(container);
  }
  const root = container._lanyardRoot;
  root.render(
    React.createElement(Lanyard, {
      position: options.position || [0, 0, 30],
      gravity: options.gravity || [0, -40, 0],
      fov: options.fov || 20,
      transparent: options.transparent !== undefined ? options.transparent : true,
      frontImage: options.frontImage || null,
      backImage: options.backImage || null,
      imageFit: options.imageFit || 'cover',
      lanyardImage: options.lanyardImage || null,
      lanyardWidth: options.lanyardWidth || 1,
    })
  );
  return root;
}

window.mountLanyard = mountLanyard;
export default mountLanyard;
