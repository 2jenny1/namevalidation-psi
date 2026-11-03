(function () {
  var ACCOUNT_PROFILE_URL = 'https://shopify.com/60496937017/account/profile';
  var root = document.getElementById('nv-psi-overlay');
  if (!root) return;

  var form = document.getElementById('nv-psi-form');
  var provinceSelect = document.getElementById('nv-psi-province');
  var errorEl = document.getElementById('nv-psi-error');
  var submitBtn = document.getElementById('nv-psi-submit');
  var proxyUrl =
    root.getAttribute('data-proxy-url') || '/apps/name-validation/verify';

  function readCookie(name) {
    var match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
    );
    return match ? decodeURIComponent(match[1]) : '';
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.hidden = !message;
    errorEl.textContent = message || '';
  }

  function syncLocationToCart(location) {
    if (!location) return Promise.resolve();
    return fetch('/cart/update.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attributes: { location: location } }),
    }).catch(function () {});
  }

  var cookieLocation = readCookie('location').trim();
  if (cookieLocation && provinceSelect) {
    var options = Array.prototype.slice.call(provinceSelect.options);
    var match = options.find(function (opt) {
      return opt.value.toLowerCase() === cookieLocation.toLowerCase();
    });
    if (match) {
      provinceSelect.value = match.value;
    }
    syncLocationToCart(cookieLocation);
  }

  root.hidden = false;
  document.documentElement.style.overflow = 'hidden';

  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    showError('');

    var data = new FormData(form);
    var firstName = String(data.get('firstName') || '').trim();
    var lastName = String(data.get('lastName') || '').trim();
    var day = String(data.get('day') || '').trim();
    var month = String(data.get('month') || '').trim();
    var year = String(data.get('year') || '').trim();
    var province = String(data.get('province') || cookieLocation || '').trim();

    if (!firstName || !lastName || !day || !month || !year || !province) {
      showError('Please complete all required fields.');
      return;
    }
    if (!data.get('confirmAccuracy') || !data.get('agreeLegal')) {
      showError('Please confirm the accuracy and legal checkboxes to continue.');
      return;
    }

    var dob =
      year.padStart(4, '0') +
      '-' +
      month.padStart(2, '0') +
      '-' +
      day.padStart(2, '0');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    fetch(proxyUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: dob,
        province: province,
      }),
    })
      .then(function (res) {
        return res
          .json()
          .then(function (payload) {
            return { ok: res.ok, payload: payload };
          })
          .catch(function () {
            return { ok: res.ok, payload: null };
          });
      })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(
            (result.payload && result.payload.error) ||
              'Could not save. Keep shopify app dev running, then retry.',
          );
        }
        return syncLocationToCart(province).then(function () {
          window.location.assign(
            (result.payload && result.payload.redirectTo) || ACCOUNT_PROFILE_URL,
          );
        });
      })
      .catch(function (err) {
        showError(err.message || 'Could not save. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue';
      });
  });
})();
