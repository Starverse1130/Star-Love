/* ============================================================
   🏃 DODGE.JS — The Uncatchable Button (no3.html)
   ============================================================
   Phase 2 — Smooth slide, tooltip cycle, long-press, screen shake
   ============================================================ */

(function() {
  'use strict';

  /* --------------------------------------------------------
     1. DOM REFS & STATE
     -------------------------------------------------------- */
  var dodgeBtn = document.querySelector('#move-random');
  if (!dodgeBtn) return; // Not on dodge page

  var container = dodgeBtn.closest('.container') || document.querySelector('.container');
  var isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var dodgeCount = 0;
  var dodgeTimeout = null;
  var lastDodgeTime = 0;
  var isCaught = false;
  var catchChance = 0.12; // 12% chance to catch on click

  /* --------------------------------------------------------
     2. TOOLTIP CYCLE
     -------------------------------------------------------- */
  var tooltipTexts = [
    'Nope! 😋',
    'Too slow! 🏃',
    'Almost! ✋',
    'Catch me! 😜',
    'Give up? 🥺',
    'So close! 🔄',
    'Not today! 💅',
    'Try harder! 💪',
    'Ha! Missed! 😂',
    'One more try? 🎯'
  ];

  // Create tooltip element
  var tooltip = document.createElement('div');
  tooltip.className = 'dodge-tooltip';
  tooltip.setAttribute('aria-live', 'polite');
  tooltip.textContent = tooltipTexts[0];
  dodgeBtn.parentNode.insertBefore(tooltip, dodgeBtn.nextSibling);

  /* --------------------------------------------------------
     3. SMOOTH DODGE — Random Position Within Viewport
     -------------------------------------------------------- */
  function moveRandomEl(elm) {
    if (isCaught) return; // Don't dodge while caught
    var now = Date.now();
    // Throttle: max 1 dodge per 100ms (prevents spam)
    if (now - lastDodgeTime < 100) return;
    lastDodgeTime = now;

    dodgeCount++;

    // Calculate safe area boundaries
    var btnRect = elm.getBoundingClientRect();
    var btnW = btnRect.width || elm.offsetWidth || 80;
    var btnH = btnRect.height || elm.offsetHeight || 48;

    var pad = 20; // padding from edges
    var maxX = window.innerWidth - btnW - pad;
    var maxY = window.innerHeight - btnH - pad;

    // Get container bounds to avoid overlapping it
    var contRect = container.getBoundingClientRect();
    var contLeft = contRect.left - pad;
    var contTop = contRect.top - pad;
    var contRight = contRect.right + pad;
    var contBottom = contRect.bottom + pad;

    // Try up to 20 times to find a spot NOT overlapping the container
    var newX, newY, tries = 0;
    do {
      newX = Math.max(pad, Math.min(maxX, Math.random() * (maxX - pad) + pad));
      newY = Math.max(pad, Math.min(maxY, Math.random() * (maxY - pad) + pad));
      tries++;
    } while (
      tries < 20 &&
      newX < contRight && (newX + btnW) > contLeft &&
      newY < contBottom && (newY + btnH) > contTop
    );

    // If still overlapping, force to a corner (away from center)
    if (tries >= 20) {
      var centerX = window.innerWidth / 2;
      var centerY = window.innerHeight / 2;
      // Pick opposite side of center
      newX = (newX < centerX) ? pad : maxX;
      newY = (newY < centerY) ? pad : maxY;
    }

    // Use CSS transform for smooth GPU-accelerated animation
    elm.style.position = 'fixed';
    elm.style.transition = 'left 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';
    elm.style.left = newX + 'px';
    elm.style.top = newY + 'px';
    elm.style.zIndex = '40'; /* Below navbar (50) so it never blocks core UI */

    // Update tooltip
    updateTooltip();

    // Screen shake effect
    triggerScreenShake();

    // Clear timeout
    if (dodgeTimeout) {
      clearTimeout(dodgeTimeout);
      dodgeTimeout = null;
    }
  }

  /* --------------------------------------------------------
     4. TOOLTIP UPDATE
     -------------------------------------------------------- */
  function updateTooltip() {
    var text = tooltipTexts[dodgeCount % tooltipTexts.length];

    // Fade out, swap text, fade in using CSS transition from style.css
    tooltip.style.opacity = '0';
    setTimeout(function() {
      tooltip.textContent = text;
      // Use CSS transition duration (150ms from --duration-fast)
      tooltip.style.opacity = '1';
    }, 150);
  }

  /* --------------------------------------------------------
     5. SCREEN SHAKE
     -------------------------------------------------------- */
  function triggerScreenShake() {
    var main = document.querySelector('main') || document.body;
    main.classList.remove('screen-shake');
    // Force reflow
    void main.offsetWidth;
    main.classList.add('screen-shake');

    // Clean up after animation
    setTimeout(function() {
      main.classList.remove('screen-shake');
    }, 350);
  }

  /* --------------------------------------------------------
     6. CATCH MECHANIC — Rare successful catch
     -------------------------------------------------------- */
  function triggerCatch(elm) {
    isCaught = true;

    // Reset position to center-ish
    elm.style.position = '';
    elm.style.left = '';
    elm.style.top = '';
    elm.style.transition = '';
    elm.style.zIndex = '';

    // Pulse red effect
    elm.classList.add('caught');

    // Update tooltip
    tooltip.textContent = 'You caught me! 😳';
    tooltip.style.opacity = '1';

    // Resume dodging after 2 seconds
    setTimeout(function() {
      isCaught = false;
      elm.classList.remove('caught');
      tooltip.textContent = tooltipTexts[0];
    }, 2000);
  }

  /* --------------------------------------------------------
     7. EVENT LISTENERS — Desktop & Mobile
     -------------------------------------------------------- */
  // Desktop: dodge on hover
  dodgeBtn.addEventListener('mouseenter', function(e) {
    if (!isMobile) {
      moveRandomEl(e.target);
    }
  });

  // Mobile: dodge on touchstart (instant, before finger lifts)
  dodgeBtn.addEventListener('touchstart', function(e) {
    if (isCaught) return;
    moveRandomEl(e.target);
  }, { passive: true });

  // Catch attempt — rare chance to catch the button on click
  dodgeBtn.addEventListener('click', function(e) {
    if (isCaught) { e.preventDefault(); return; }

    if (Math.random() < catchChance) {
      e.preventDefault();
      triggerCatch(e.target);
    }
  });

  /* --------------------------------------------------------
     8. RESET POSITION ON RESIZE
     -------------------------------------------------------- */
  window.addEventListener('resize', function() {
    // If button is in fixed position, re-clamp to bounds
    if (dodgeBtn.style.position === 'fixed') {
      var btnRect = dodgeBtn.getBoundingClientRect();
      var pad = 20;
      var maxX = window.innerWidth - btnRect.width - pad;
      var maxY = window.innerHeight - btnRect.height - pad;

      var currX = parseInt(dodgeBtn.style.left) || 0;
      var currY = parseInt(dodgeBtn.style.top) || 0;

      currX = Math.max(pad, Math.min(maxX, currX));
      currY = Math.max(pad, Math.min(maxY, currY));

      dodgeBtn.style.left = currX + 'px';
      dodgeBtn.style.top = currY + 'px';
    }
  });

})();
