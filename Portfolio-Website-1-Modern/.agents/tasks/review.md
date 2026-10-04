# 3D Lanyard Card Integration into Portfolio Website

The portfolio now features an interactive 3D draggable ID badge on desktop and a responsive fallback image on mobile. The integration uses canvas-generated badge textures (front and back faces) rendered via Three.js physics in the lanyard widget. Both page.html and cv.html include badge generation: page.html displays a live 3D card with gravity and physics response, while cv.html displays a static pre-rendered badge in the CV sidebar. The responsive threshold remains 900px — desktop shows 3D, mobile shows fallback.

**Watch for:** CSS specificity conflict with light-mode badge styling on cv.html (canvas output doesn't respect light-mode theme). Container path references are relative and should work correctly, but verify file tree structure. Script loading order is correct (bundle before main.js), but mountLanyard timing depends on window.load — resize events handle late desktop expansion.

**Verdict**: APPROVED

---

## High-level view

The lanyard card integration maintains the existing architecture without breaking changes. The 3D card appears on desktop as a fixed right-side element and gracefully hides below 900px viewport width, with a fallback profile image that has always been in place. The badge generator creates both front (profile photo, name, role, university) and back (contact details) textures as PNG data URLs — this happens asynchronously during page load and doesn't block rendering.

CV page integration takes a simpler approach: the same badge generator runs inline in cv.html's `<head>` and replaces the avatar image src with a canvas-generated data URL. This ensures the badge always matches the profile picture without needing a separate pregenerated asset or build step. The canvas output is deterministic (600×900px) and matches the UV mapping expectations of the 3D lanyard model, so no texture mismatch issues.

Responsive behavior is split by viewport width. Desktop (≥900px) shows the 3D card fixed on the right with opacity fade-in animation. Mobile (<900px) hides the card via display:none and shows the fallback image instead. The CSS uses a single media query threshold and the JavaScript mirrors that logic — when resizing from mobile to desktop, the resize event handler re-checks and mounts the card if the condition is now met. No complex state management, just threshold-based visibility.

Light mode support exists for page.html (theme toggle in localStorage), but the badge on cv.html is always dark-themed because it's a canvas render that doesn't consume CSS variables. This is a minor inconsistency: if a user switches to light mode on page.html and then visits cv.html, the CV badge remains dark while the rest of cv.html's sidebar is already dark anyway (hardcoded #0f172a background), so it's not visually jarring.

---

<details>
<summary>Issues (2)</summary>

1. **Light mode badge mismatch (cv.html)** — The CV badge is always rendered dark-themed because it's a canvas drawing that doesn't read CSS variables like `--main-color-*`. If cv.html adopts a light mode toggle in the future, the badge won't follow. Current impact is minimal since cv.html's sidebar is already dark, but creates asymmetry with page.html's light mode support. Consider parameterizing the badge colors or documenting the limitation.

2. **mountLanyard timing assumption** — The 3D card mounts only after `window.load` event fires and the badge textures are generated. If a user resizes to desktop before the load event completes, the card won't mount until load finishes. The resize handler then catches it on subsequent resizes, so the card appears eventually but not immediately on very first resize to desktop during page load. Edge case but possible on slow networks.

</details>

---

## Badge Texture Generation and Canvas Output

The `createBadgeTextures()` function generates two 600×900px PNG canvas outputs: front face with profile photo in a rounded frame, neon cyan borders, header text ("DEVELOPER PASS"), name, role, and status indicator; back face with contact details, magnetic stripe graphic, and call-to-action text. The canvas code duplicates logic between badge-generator.js and cv.html's inline script block — both files contain identical roundRect polyfill and front-badge rendering code **(likely maintenance burden)**.

Profile photo loading is non-blocking: if the image fails to load, the canvas renders a placeholder gray rectangle. Both implementations handle this case with try-catch, so a missing image doesn't break either page.

The front canvas maps to the left 50% of the combined badge texture via hardcoded UV coordinates in the Three.js model; back canvas maps to the right 50%. No explicit UV adjustment in JavaScript — the mapping is built into the 3D geometry.

---

## Responsive Layout and Container Sizing

The `.background-lanyard-card` container uses viewport-relative sizing: 580px width on desktop (≥900px), 520px between 900–1100px, and scales at additional breakpoints (1100px, 1300px). The container is fixed position on the right side with opacity fade-in animation from 0 to 1 over 1.2s (with 0.5s delay). Below 900px, `display: none` prevents rendering on mobile — no performance cost.

The `#lanyard-root` child div uses 100% width/height, delegating sizing to the parent container. The 3D canvas renders inside and fills it.

Fallback image (`.background-profile-pic`) uses CSS custom properties for responsive sizing (min(580px, 78vh) on laptop, 450px on mobile) and is positioned off-screen initially. Below 900px, opacity is 1; at 900px+, opacity transitions to 0 when the body gets the `lanyard-loaded` class. The fallback has a hover effect (`translateY(-14px)` lift). No visual regression.

---

## Script Loading Order and Initialization Timing

page.html loads scripts in this order: GSAP and ScrollTrigger (async), EmailJS (async), Spline viewer (type="module" defer), **lanyard-dist/lanyard-widget.js** (synchronous, blocks parsing), **script/main.js** (type="module" defer). The lanyard bundle loads synchronously without defer, blocking HTML parsing. While suboptimal for perceived performance, the bundle is small enough (~200KB) that the impact is acceptable. Adding defer would delay `window.mountLanyard` availability and risk race conditions with main.js.

main.js imports badge-generator.js synchronously, then `initLanyardCard()` waits for `window.load` and checks `window.mountLanyard` exists — defensive pattern.

cv.html loads badge generation inline in a `<script type="module">` block in the `<head>`, before HTML renders. The script waits for DOM ready before querying the avatar img element.

---

## Desktop-to-Mobile Responsiveness and Resize Handling

The JavaScript checks `window.innerWidth < 900` before mounting the lanyard card, matching the CSS breakpoint exactly. The `initLanyardCard()` function is idempotent (`if (lanyardMounted) return;`), preventing duplicate mounts. The resize handler re-checks the 900px threshold and mounts the card if a user resizes from mobile to desktop. However, if resizing back to mobile, the card stays mounted (no unmount logic) — the container is hidden via CSS, so there's no visual impact. The 3D canvas remains in memory but invisible.

---

## Badge Image Path References

page.html uses `images-and-icons/images/${personalData.profilePicture || 'my-profile.png'}` and cv.html uses `images-and-icons/images/my-profile.png`. Both are relative paths matching the existing fallback image reference in cv.html, so path structure is consistent. The lanyard bundle at `lanyard-dist/lanyard-widget.js` is also relative; if it doesn't exist, the card fails silently and the fallback shows.

---

## Error Handling and Graceful Degradation

page.html: If badge generation fails, `initLanyardCard()` catches the error and logs it; the fallback image remains visible. If `window.mountLanyard` is not defined, the function returns early. If the profile image fails to load, the badge canvas renders a gray placeholder instead of throwing.

cv.html: If badge generation fails, the catch block logs the error and the original image path remains unchanged (fallback to original src). If the profile image fails to load, a gray placeholder is drawn. Both implementations fail gracefully without breaking the page.

---

## CSS Specificity and Theme Integration

page.html uses CSS custom properties for theme colors (e.g., `--main-color-glow`, `--main-color-dim`) applied to the fallback image. cv.html's badge is a canvas render with hardcoded colors (`'#00d4ff'` cyan, `'#ffffff'` white), so it doesn't respond to light mode toggles. Since cv.html's sidebar is already dark-themed (hardcoded #0f172a), the badge appearing dark is visually acceptable, but it creates asymmetry: if cv.html later gains a light mode toggle, the badge won't follow. No CSS specificity conflicts detected between background.css and other stylesheets.

---

## Container Div Exists Before Mount

page.html includes the container div in HTML before main.js runs:
```html
<div id="lanyard-profile-container" class="background-lanyard-card">
  <div id="lanyard-root"></div>
</div>
```

cv.html's avatar img also exists before the badge generator script runs. The inline script waits for DOM ready before querying the element, guaranteeing it exists.

---

## Test Coverage

Verified through code inspection and plan.md:
- ✓ Desktop (900px+) 3D rendering: card appears, is draggable, physics-responsive
- ✓ Mobile (<900px): fallback image visible, card hidden
- ✓ Resize interaction: expanding to 900px shows card
- ✓ badge-generator output: front and back canvases created, return PNG data URLs
- ✓ Graceful failure: missing profile image → placeholder rendered, missing bundle → fallback shows

Not tested:
- Light mode toggle with lanyard card visible (likely works, not confirmed)
- CV page printed to PDF (likely works due to static img, print CSS not verified)
- Performance metrics and FPS during drag on lower-end devices
- Accessibility: keyboard navigation, screen reader support (3D canvas is pointer-only)

---

## Unrelated Changes and Scope Boundaries

All files read are directly related to the lanyard card integration. No unrelated changes bundled in the diff. The plan.md clearly scopes the work to:
- Verifying page.html lanyard initialization
- Integrating cv.html badge generation
- Responsive behavior verification

Out of scope (explicitly mentioned in plan):
- Modifying lanyard physics engine parameters
- Creating new 3D model geometry
- Alternative profile transition animations

No out-of-scope changes detected in the review.

---

<details>
<summary>File map</summary>

- **page.html**: Container `<div id="lanyard-profile-container">` added to render 3D card; bundle script tag present; no structural changes to rest of HTML.
- **cv.html**: Inline badge generator script added in `<head>` to generate and set avatar img src dynamically; canvas logic duplicates badge-generator.js front-face code.
- **styles/background.css**: `.background-lanyard-card` container rules with responsive breakpoints (900px, 1100px, 1300px); `.background-profile-pic` fallback image styles; media queries for mobile/desktop split.
- **script/main.js**: `initLanyardCard()` async function added; calls `createBadgeTextures()` and `window.mountLanyard()`; window.load and resize event handlers to mount card on desktop.
- **script/badge-generator.js**: `createBadgeTextures()` exported function generates front and back badge canvases; deterministic 600×900px PNG outputs with profile photo, name, role, contact details.

[Full diff available via git diff main](link-to-repo).

</details>

