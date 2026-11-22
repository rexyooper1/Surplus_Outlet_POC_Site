/* Shared interactivity for Surplus Outlet prototype pages:
   - mobile navigation menu
   - header-height syncing (fixed header offset + anchor scroll margin)
   - confirmation modal for the contact form and footer newsletter signup
   - "Reserve" buttons hand off to the contact form with the item pre-filled */
(function () {
  'use strict';

  document.body.classList.add('so-js');
  var header = document.querySelector('body > header');

  /* ---------- Header height ---------- */
  function syncHeaderHeight() {
    if (!header) return;
    document.documentElement.style.setProperty('--so-header-h', header.offsetHeight + 'px');
  }

  /* ---------- Logo fallback ----------
     If the logo image ever fails to load, hide it so its alt text doesn't
     blow out the header width. */
  function initLogoFallback() {
    var logo = header && header.querySelector('a[href="index.html"] img');
    if (!logo) return;
    function hide() { logo.style.display = 'none'; syncHeaderHeight(); }
    if (logo.complete && logo.naturalWidth === 0) hide();
    else logo.addEventListener('error', hide);
  }

  /* ---------- Mobile navigation ---------- */
  function initMobileNav() {
    var nav = document.getElementById('primary-nav');
    if (!header || !nav) return;
    var navRow = nav.parentElement;
    navRow.classList.add('so-nav-row');

    // Right-hand cluster of the main header row (store badge + account icon)
    var mainRow = header.querySelector('.h-20');
    var cluster = mainRow && mainRow.lastElementChild;
    if (!cluster) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'so-menu-toggle';
    btn.setAttribute('aria-controls', 'primary-nav');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
    btn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">menu</span>';
    cluster.appendChild(btn);

    var backdrop = null;
    var icon = btn.firstElementChild;

    function setOpen(open) {
      header.classList.toggle('so-nav-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      icon.textContent = open ? 'close' : 'menu';
      if (open && !backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'so-menu-backdrop';
        backdrop.addEventListener('click', function () { setOpen(false); });
        document.body.appendChild(backdrop);
      } else if (!open && backdrop) {
        backdrop.remove();
        backdrop = null;
      }
    }

    btn.addEventListener('click', function () {
      setOpen(!header.classList.contains('so-nav-open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('so-nav-open')) {
        setOpen(false);
        btn.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------- Confirmation modal ---------- */
  var modal = null;
  function showConfirmation(opts) {
    if (!modal) {
      modal = document.createElement('dialog');
      modal.className = 'so-modal';
      modal.setAttribute('aria-labelledby', 'so-modal-title');
      modal.innerHTML =
        '<form method="dialog" class="so-modal__body">' +
          '<div class="so-modal__icon"><span class="material-symbols-outlined" aria-hidden="true"></span></div>' +
          '<h2 class="so-modal__title" id="so-modal-title"></h2>' +
          '<p class="so-modal__text"></p>' +
          '<button class="so-modal__btn" value="close" autofocus>Got it</button>' +
        '</form>';
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.close(); // click on backdrop
      });
      document.body.appendChild(modal);
    }
    modal.querySelector('.material-symbols-outlined').textContent = opts.icon || 'done_all';
    modal.querySelector('.so-modal__title').textContent = opts.title;
    modal.querySelector('.so-modal__text').textContent = opts.text;
    modal.showModal();
  }

  /* ---------- Contact / counter inquiry form ---------- */
  function initContactForm() {
    var form = document.getElementById('counter-inquiry-form');
    if (!form) return;

    // Pre-fill from a "Reserve" click on another page (contact.html?item=...)
    var params = new URLSearchParams(location.search);
    var item = params.get('item');
    if (item) {
      var type = document.getElementById('inquiry-type');
      var msg = document.getElementById('contact-message');
      if (type) type.value = 'stock';
      if (msg && !msg.value) msg.value = 'Please hold / check stock for: ' + item + '\nSize: ';
      requestAnimationFrame(function () {
        form.scrollIntoView({ block: 'start' });
        var name = document.getElementById('contact-name');
        if (name) name.focus({ preventScroll: true });
      });
    }

    // Native `required` validation runs before submit fires.
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameEl = document.getElementById('contact-name');
      var first = nameEl && nameEl.value.trim().split(/\s+/)[0];
      showConfirmation({
        icon: 'done_all',
        title: 'Inquiry Received at Houghton Register',
        text: (first ? 'Thanks, ' + first + '! ' : 'Thanks! ') +
          'Our Houghton floor staff has your message. If you asked for a size hold or urgent stock check, ' +
          "we'll get back to you promptly during open store hours."
      });
      form.reset();
      if (history.replaceState && location.search) history.replaceState(null, '', location.pathname);
    });
  }

  /* ---------- Footer "Field Dispatch" newsletter ---------- */
  function initNewsletter() {
    document.querySelectorAll('footer button').forEach(function (btn) {
      if (!/join field roster/i.test(btn.textContent)) return;
      var input = btn.parentElement.querySelector('input[type="email"]');
      if (!input) return;
      input.required = true;
      input.setAttribute('aria-label', 'Email address');

      var err = document.createElement('p');
      err.className = 'so-field-error';
      err.setAttribute('role', 'alert');
      err.hidden = true;
      btn.insertAdjacentElement('afterend', err);

      function submit() {
        if (!input.value.trim() || !input.checkValidity()) {
          err.textContent = 'Please enter a valid email address.';
          err.hidden = false;
          input.focus();
          return;
        }
        err.hidden = true;
        showConfirmation({
          icon: 'mark_email_read',
          title: "You're on the Field Roster",
          text: 'Watch ' + input.value.trim() + ' for seasonal gear drops, UP trail conditions, and surplus arrival notices.'
        });
        input.value = '';
      }
      btn.addEventListener('click', submit);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      });
      input.addEventListener('input', function () { err.hidden = true; });
    });
  }

  /* ---------- "Reserve" buttons -> contact form ---------- */
  function initReserveButtons() {
    document.querySelectorAll('main button').forEach(function (btn) {
      if (!/^\s*(call\s+)?reserve(\s+in\s+store)?\s*$/i.test(btn.textContent.replace(/shopping_bag/, ''))) return;
      btn.addEventListener('click', function () {
        var card = btn.closest('.product-card') || btn.closest('section');
        var heading = card && card.querySelector('h3, h2, h1');
        var name = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';
        location.href = 'contact.html' + (name ? '?item=' + encodeURIComponent(name) : '');
      });
    });
  }

  initLogoFallback();
  initMobileNav();
  initContactForm();
  initNewsletter();
  initReserveButtons();

  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
  if (window.ResizeObserver && header) new ResizeObserver(syncHeaderHeight).observe(header);
})();
