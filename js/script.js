document.addEventListener('DOMContentLoaded', function () {
  var siteHeader = document.querySelector('.site-header');
  var navToggle = siteHeader && siteHeader.querySelector('.nav-toggle');

  function setNavOpen(isOpen) {
    siteHeader.classList.toggle('nav-open', isOpen);
    if (navToggle) navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (siteHeader && navToggle) {
    navToggle.addEventListener('click', function () {
      setNavOpen(!siteHeader.classList.contains('nav-open'));
    });

    // Close the mobile menu when a nav link is tapped (the "Tailored Morocco
    // Tours" trigger is handled separately below, since on mobile it expands
    // its own submenu instead of navigating away).
    siteHeader.querySelectorAll('.main-nav a:not(.nav-dropdown-trigger)').forEach(function (link) {
      link.addEventListener('click', function () {
        setNavOpen(false);
      });
    });
  }

  // On mobile, tapping "Tailored Morocco Tours" expands its city links in
  // place instead of navigating away, so the menu starts short instead of
  // always showing all 5 city links stacked under the trigger.
  var navDropdown = siteHeader && siteHeader.querySelector('.nav-dropdown');
  var navDropdownTrigger = navDropdown && navDropdown.querySelector('.nav-dropdown-trigger');
  if (navDropdown && navDropdownTrigger) {
    navDropdownTrigger.addEventListener('click', function (e) {
      if (window.matchMedia('(max-width: 1050px)').matches) {
        e.preventDefault();
        navDropdown.classList.toggle('mobile-open');
      }
    });
  }

  // Sticky header: solidify + shrink once the visitor scrolls past the hero fold
  if (siteHeader) {
    var applyHeaderState = function () {
      siteHeader.classList.toggle('scrolled', window.pageYOffset > 40);
    };
    applyHeaderState();
    window.addEventListener('scroll', applyHeaderState, { passive: true });
  }

  // Subtle scroll-reveal for content blocks (skipped if reduced motion is preferred).
  // The .reveal class is added by JS so no-JS visitors always see content normally.
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced && 'IntersectionObserver' in window) {
    var revealSelector = [
      '.section-head', '.card', '.mini-card', '.split > div', '.dest-chip',
      '.step', '.itinerary-day', '.includes-panel', '.gallery-grid > div',
      '.testimonial', '.price-box', '.contact-panel'
    ].join(', ');
    var revealTargets = document.querySelectorAll(revealSelector);
    if (revealTargets.length) {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealTargets.forEach(function (el) {
        el.classList.add('reveal');
        observer.observe(el);
      });
    }
  }

  // Cookie consent banner — analytics stays off (Consent Mode default in
  // every page's <head>) until the visitor explicitly accepts here.
  var CONSENT_KEY = 'mbt_cookie_consent';

  function getStoredConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function storeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }

  function updateAnalyticsConsent(granted) {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    }
  }

  if (!getStoredConsent()) {
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<p>We use cookies to understand how visitors use this site. You can accept or decline analytics cookies — see our <a href="privacy-policy.html">Privacy Policy</a>.</p>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="btn btn-dark cookie-decline">Decline</button>' +
          '<button type="button" class="btn btn-solid cookie-accept">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    banner.querySelector('.cookie-accept').addEventListener('click', function () {
      storeConsent('granted');
      updateAnalyticsConsent(true);
      banner.remove();
    });
    banner.querySelector('.cookie-decline').addEventListener('click', function () {
      storeConsent('denied');
      updateAnalyticsConsent(false);
      banner.remove();
    });
  }
});
