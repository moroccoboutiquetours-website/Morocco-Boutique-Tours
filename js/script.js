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
    document.body.classList.add('has-cookie-banner');

    banner.querySelector('.cookie-accept').addEventListener('click', function () {
      storeConsent('granted');
      updateAnalyticsConsent(true);
      banner.remove();
      document.body.classList.remove('has-cookie-banner');
    });
    banner.querySelector('.cookie-decline').addEventListener('click', function () {
      storeConsent('denied');
      updateAnalyticsConsent(false);
      banner.remove();
      document.body.classList.remove('has-cookie-banner');
    });
  }

  // WhatsApp contact — a floating CTA styled as part of the site rather than
  // a bolted-on widget. On a tour page it names that tour in the pre-filled
  // message; everywhere else it opens with a general enquiry. Skipped on
  // pages (like the private Instagram queue admin tool) that don't carry
  // the shared site footer.
  var siteFooter = document.querySelector('.site-footer');
  if (siteFooter) {
    var WHATSAPP_NUMBER = '212771822758';

    function buildWhatsappMessage() {
      var slug = window.location.pathname.split('/').pop();
      if (slug && slug.indexOf('tour-') === 0) {
        var tourHeading = document.querySelector('h1');
        var tourName = tourHeading && tourHeading.textContent.trim();
        if (tourName) {
          return 'Hello! I\'m interested in the "' + tourName + '" and would like some information.';
        }
      }
      return 'Hello, I am interested in a Morocco tour and would like some information.';
    }

    var whatsappLink = document.createElement('a');
    whatsappLink.className = 'whatsapp-fab';
    whatsappLink.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildWhatsappMessage());
    whatsappLink.target = '_blank';
    whatsappLink.rel = 'noopener';
    whatsappLink.setAttribute('aria-label', 'Chat with us on WhatsApp');
    whatsappLink.innerHTML =
      '<span class="whatsapp-fab-icon">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
          '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.48 1.34 4.99L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.005c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.83 14.17c-.24.68-1.4 1.32-1.94 1.4-.5.08-1.12.11-1.81-.11-.42-.13-.95-.3-1.64-.6-2.88-1.24-4.76-4.13-4.9-4.32-.14-.19-1.17-1.55-1.17-2.96 0-1.41.74-2.1 1-2.39.26-.29.58-.36.77-.36.19 0 .39.002.56.01.18.008.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.19-.15.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.29-.13.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.19-.27.37-.22.62-.13.25.09 1.6.75 1.87.89.27.14.46.21.52.32.07.11.07.65-.17 1.33z"/>' +
        '</svg>' +
      '</span>' +
      '<span class="whatsapp-fab-label">Chat with a Morocco Expert</span>';
    document.body.appendChild(whatsappLink);

    // Ease in shortly after load rather than appearing abruptly on top of content.
    setTimeout(function () { whatsappLink.classList.add('is-visible'); }, 500);
  }
});
