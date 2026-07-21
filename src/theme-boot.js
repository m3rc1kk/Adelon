(function () {
  var t = null;
  try { t = localStorage.getItem('adelon-theme'); } catch (e) {}
  // Автотемы разрешаем ещё до отрисовки, иначе на старте мигнёт чужая палитра.
  var auto = { 'auto-warm': ['warm-light', 'warm-dark'], 'auto-neutral': ['neutral-light', 'neutral-dark'] };
  if (auto[t]) {
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    t = auto[t][dark ? 1 : 0];
  }
  document.documentElement.setAttribute('data-theme', t || 'warm-dark');
})();
