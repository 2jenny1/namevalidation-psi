(function syncLocationCookieToCart() {
  try {
    var match = document.cookie.match(/(?:^|; )location=([^;]*)/);
    if (!match) return;
    var location = decodeURIComponent(match[1]).trim();
    if (!location) return;

    fetch('/cart.js', { credentials: 'same-origin' })
      .then(function (res) {
        return res.json();
      })
      .then(function (cart) {
        var current =
          cart && cart.attributes && cart.attributes.location
            ? String(cart.attributes.location)
            : '';
        if (current === location) return;
        return fetch('/cart/update.js', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributes: { location: location } }),
        });
      })
      .catch(function () {});
  } catch (e) {}
})();
