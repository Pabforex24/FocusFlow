// Exécuté avant le premier rendu : applique le mode (clair/sombre) et la palette enregistrés.
(function () {
  try {
    var saved = localStorage.getItem('focusflow-theme')
    var dark = saved === 'dark' || (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    var palette = localStorage.getItem('focusflow-palette')
    document.documentElement.dataset.palette = ['walnut', 'charcoal', 'navy'].indexOf(palette) > -1 ? palette : 'foret'
  } catch (e) {}
})()
