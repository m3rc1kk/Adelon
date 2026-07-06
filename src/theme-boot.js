(function () {
  var t = null;
  try { t = localStorage.getItem('adelon-theme'); } catch (e) {}
  document.documentElement.setAttribute('data-theme', t || 'warm-dark');
})();
