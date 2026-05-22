/* ============================================================
   📱 MAIN.JS — Shared Utilities, Gestures, & Animations
   ============================================================
   Phase 2 — Swipe detection, staggered reveal, confetti,
   haptic feedback, page transitions
   ============================================================ */

/* ----------------------------------------------------------
   0. SERVICE WORKER REGISTRATION — PWA
   ---------------------------------------------------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      // Check for updates on page focus
      reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — activate immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(function(err) {
      console.warn('SW registration failed:', err);
    });
  });

  // Reload page when new SW takes control
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    window.location.reload();
  });
}

/* ----------------------------------------------------------
   1. PAGE LOAD — Staggered Reveal Animation
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const container = document.querySelector('.container');
  const gif = document.querySelector('.tenor-gif-embed, .gif-container');
  const heading = document.querySelector('h1');
  const subtitle = document.querySelector('p');
  const buttons = document.querySelector('.btn');

  // Container reveal — hidden class is in HTML markup to prevent FOUC
  if (container) {
    requestAnimationFrame(function() {
      container.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      container.classList.remove('container-init-hidden');
    });
  }

  // Stagger children with increasing delays (hidden class in HTML markup)
  var staggerItems = [];
  if (gif) staggerItems.push({ el: gif, delay: 150 });
  if (heading) staggerItems.push({ el: heading, delay: 300 });
  if (subtitle) staggerItems.push({ el: subtitle, delay: 450 });
  if (buttons) staggerItems.push({ el: buttons, delay: 600 });

  staggerItems.forEach(function(item) {
    var el = item.el;
    el.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.transitionDelay = item.delay + 'ms';

    setTimeout(function() {
      el.classList.remove('stagger-hidden');
    }, 50);
  });

  // Initialize page-specific features
  initPageFeatures();
});

/* ----------------------------------------------------------
   2. PAGE-SPECIFIC FEATURES
   ---------------------------------------------------------- */
function initPageFeatures() {
  var body = document.body;

  // Yes page — generate hearts & confetti
  if (body.classList.contains('page-yes')) {
    generateHearts(15);
    generateConfetti(30);
    setupDoubleTapConfetti();
  }

  // No1 page — subtle shake on No button
  if (body.classList.contains('page-no1')) {
    setupShakeOnHover('.btn-no', 'shake-subtle');
    setupShakeOnTouch('.btn-no', 'shake-subtle');
  }

  // No2 page — moderate shake on No button
  if (body.classList.contains('page-no2')) {
    setupShakeOnHover('.btn-no', 'shake-moderate');
    setupShakeOnTouch('.btn-no', 'shake-moderate');
  }
}

/* ----------------------------------------------------------
   3. SWIPE GESTURE DETECTION
   ---------------------------------------------------------- */
(function() {
  var touchStartX = 0;
  var touchStartY = 0;
  var touchStartTime = 0;
  var isSwiping = false;

  document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartTime = Date.now();
    isSwiping = true;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!isSwiping) return;
    var diffX = Math.abs(e.changedTouches[0].screenX - touchStartX);
    var diffY = Math.abs(e.changedTouches[0].screenY - touchStartY);
    // Only prevent scroll if horizontal swipe is dominant
    if (diffX > diffY && diffX > 30) {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchend', function(e) {
    if (!isSwiping) return;
    isSwiping = false;

    var diffX = e.changedTouches[0].screenX - touchStartX;
    var diffY = e.changedTouches[0].screenY - touchStartY;
    var elapsed = Date.now() - touchStartTime;

    // Require: horizontal distance > 60px, more horizontal than vertical, under 300ms
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5 && elapsed < 300) {
      var body = document.body;
      var currentPage = getCurrentPage(body);

      if (diffX > 0) {
        // Swipe right — go to Yes/celebration
        navigateToYes(currentPage);
      } else {
        // Swipe left — go to next No page
        navigateToNo(currentPage);
      }
    }
  }, { passive: true });
})();

function getCurrentPage(body) {
  if (body.classList.contains('page-no1')) return 'no1';
  if (body.classList.contains('page-no2')) return 'no2';
  if (body.classList.contains('page-no3')) return 'no3';
  if (body.classList.contains('page-yes')) return 'yes';
  return 'index';
}

function navigateToYes(currentPage) {
  switch (currentPage) {
    case 'index': window.location.href = 'pages/yes.html'; break;
    case 'no1':   window.location.href = 'yes.html'; break;
    case 'no2':   window.location.href = 'yes.html'; break;
    case 'no3':   window.location.href = 'yes.html'; break;
    case 'yes':   window.location.href = '../index.html'; break;
  }
}

function navigateToNo(currentPage) {
  switch (currentPage) {
    case 'index': window.location.href = 'pages/no1.html'; break;
    case 'no1':   window.location.href = 'no2.html'; break;
    case 'no2':   window.location.href = 'no3.html'; break;
    case 'no3':   /* On dodge page — does nothing */ break;
    case 'yes':   window.location.href = '../index.html'; break;
  }
}

/* ----------------------------------------------------------
   4. HAPTIC FEEDBACK — Visual Touch Simulation
   ---------------------------------------------------------- */
(function() {
  document.addEventListener('touchstart', function(e) {
    var target = e.target.closest('.btn a, #move-random, button');
    if (!target) return;

    target.classList.add('haptic-active');
    setTimeout(function() {
      if (target) target.classList.remove('haptic-active');
    }, 250);
  }, { passive: true });
})();

/* ----------------------------------------------------------
   5. SHAKE ON HOVER / TOUCH (No Buttons)
   ---------------------------------------------------------- */
function triggerShake(el, className) {
  el.classList.remove(className);
  // Force reflow to restart animation
  void el.offsetWidth;
  el.classList.add(className);
}

function setupShakeOnHover(selector, className) {
  var buttons = document.querySelectorAll(selector);
  buttons.forEach(function(btn) {
    btn.addEventListener('mouseenter', function() {
      triggerShake(this, className);
    });
    btn.addEventListener('animationend', function() {
      this.classList.remove(className);
    });
  });
}

function setupShakeOnTouch(selector, className) {
  var buttons = document.querySelectorAll(selector);
  buttons.forEach(function(btn) {
    btn.addEventListener('touchstart', function() {
      triggerShake(this, className);
    }, { passive: true });
  });
}

/* ----------------------------------------------------------
   6. CONFETTI GENERATION (Yes Page)
   ---------------------------------------------------------- */
function generateConfetti(count) {
  var container = document.getElementById('confettiContainer');
  if (!container) return;

  var colors = ['#f43f5e', '#fb7185', '#fbbf24', '#fb923c', '#a78bfa', '#34d399', '#60a5fa', '#f472b6'];

  for (var i = 0; i < count; i++) {
    var particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.width = (Math.random() * 6 + 4) + 'px';
    particle.style.height = (Math.random() * 6 + 4) + 'px';
    particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    particle.style.animationDelay = (Math.random() * 3) + 's';
    particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
    container.appendChild(particle);
  }
}

/* ----------------------------------------------------------
   7. FLOATING HEARTS GENERATION (Yes Page)
   ---------------------------------------------------------- */
function generateHearts(count) {
  var container = document.getElementById('heartsContainer');
  if (!container) return;

  var heartSizes = ['0.8rem', '1rem', '1.2rem', '1.5rem', '0.6rem'];

  for (var i = 0; i < count; i++) {
    var heart = document.createElement('div');
    heart.className = 'heart-particle';
    heart.textContent = '❤️';
    heart.style.left = Math.random() * 100 + '%';
    heart.style.fontSize = heartSizes[Math.floor(Math.random() * heartSizes.length)];
    heart.style.animationDelay = (Math.random() * 4) + 's';
    heart.style.opacity = Math.random() * 0.6 + 0.4;
    container.appendChild(heart);
  }
}

/* ----------------------------------------------------------
   8. DOUBLE-TAP CONFETTI BURST (Yes Page)
   ---------------------------------------------------------- */
function setupDoubleTapConfetti() {
  var lastTap = 0;
  var container = document.getElementById('confettiContainer');
  if (!container) return;

  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouch) {
    // Touch devices — use touchend only (avoids duplicate click firing)
    document.addEventListener('touchend', function(e) {
      var now = Date.now();
      var timeSince = now - lastTap;
      lastTap = now;

      if (timeSince > 200 && timeSince < 500) {
        var touch = e.changedTouches[0];
        confettiBurst(touch.clientX, touch.clientY);
      }
    }, { passive: true });
  } else {
    // Desktop — use dblclick
    document.addEventListener('dblclick', function(e) {
      confettiBurst(e.clientX, e.clientY);
    });
  }
}

function confettiBurst(x, y) {
  var colors = ['#f43f5e', '#fb7185', '#fbbf24', '#fb923c', '#a78bfa', '#34d399', '#60a5fa', '#f472b6'];
  var container = document.getElementById('confettiContainer');
  if (!container) return;

  for (var i = 0; i < 20; i++) {
    var particle = document.createElement('div');
    particle.className = 'confetti-burst-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.setProperty('--burst-x', (Math.random() * 200 - 100) + 'px');
    particle.style.setProperty('--burst-y', (Math.random() * -200 - 50) + 'px');
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.width = (Math.random() * 8 + 6) + 'px';
    particle.style.height = (Math.random() * 8 + 6) + 'px';
    particle.style.animationDelay = Math.random() * 0.1 + 's';
    container.appendChild(particle);

    // Clean up after animation
    setTimeout(function() {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 1000);
  }
}

/* ----------------------------------------------------------
   8. DISABLE CONTEXT MENU — Block right-click on images/iframes
   ---------------------------------------------------------- */
document.addEventListener('contextmenu', function(e) {
  var tag = e.target.tagName;
  if (tag === 'IMG' || tag === 'IFRAME' || tag === 'VIDEO' ||
      e.target.closest('.tenor-gif-embed') ||
      e.target.closest('.gif-container')) {
    e.preventDefault();
  }
});

// Disable drag on images
document.addEventListener('dragstart', function(e) {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
  }
});
