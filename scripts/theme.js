export function initTheme() {
  const saved = localStorage.getItem('osi-theme') || 'cyber'
  document.documentElement.setAttribute('data-theme', saved)

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === saved)

    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('osi-theme', theme)
      document.querySelectorAll('.theme-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.theme === theme)
      )
    })
  })
}
