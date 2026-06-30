/* ===== Theme Switcher — Troca de temas com transição cinematográfica ===== */

/**
 * Cores de cada tema, usadas para colorir o flash de transição.
 * Cada tema tem uma cor primária e uma cor de glow que definem
 * a "personalidade visual" da animação de troca.
 */
const THEME_COLORS = {
  cyber: { primary: '#00f0ff', glow: 'rgba(0, 240, 255, 0.35)', bg: '#070312' },
  dark:  { primary: '#6366f1', glow: 'rgba(99, 102, 241, 0.35)', bg: '#0f0f0f' },
  light: { primary: '#6366f1', glow: 'rgba(99, 102, 241, 0.25)', bg: '#f8fafc' }
}

/**
 * Move o indicador deslizante (slider) para a posição do botão ativo.
 */
function posicionarSlider(activeBtn) {
  const slider = document.querySelector('.theme-slider')
  if (!slider || !activeBtn) return

  const switcher = activeBtn.parentElement
  const switcherRect = switcher.getBoundingClientRect()
  const btnRect = activeBtn.getBoundingClientRect()

  slider.style.width = btnRect.width + 'px'
  slider.style.transform = `translateX(${btnRect.left - switcherRect.left}px)`
}

/**
 * Cria e executa a animação de transição ao trocar de tema.
 *
 * O efeito tem 3 fases:
 *   1. Ripple colorido (cor do NOVO tema) se expande a partir do botão
 *   2. No pico, o tema é trocado e o conteúdo faz um sutil blur→clear
 *   3. O overlay desvanece e partículas de brilho se dissipam
 */
function themeTransition(originBtn, targetTheme, callback) {
  const colors = THEME_COLORS[targetTheme] || THEME_COLORS.cyber
  const isLight = targetTheme === 'light'

  // === Cria o overlay principal (ripple) ===
  const overlay = document.createElement('div')
  overlay.className = 'theme-transition-overlay'

  // Posiciona o ponto de origem no centro do botão clicado
  const btnRect = originBtn.getBoundingClientRect()
  const cx = btnRect.left + btnRect.width / 2
  const cy = btnRect.top + btnRect.height / 2

  overlay.style.setProperty('--flash-x', cx + 'px')
  overlay.style.setProperty('--flash-y', cy + 'px')
  overlay.style.setProperty('--flash-color', colors.primary)
  overlay.style.setProperty('--flash-glow', colors.glow)
  overlay.style.setProperty('--flash-bg', isLight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)')

  document.body.appendChild(overlay)

  // === Cria o ring de brilho que pulsa no ponto de origem ===
  const ring = document.createElement('div')
  ring.className = 'theme-transition-ring'
  ring.style.setProperty('--ring-x', cx + 'px')
  ring.style.setProperty('--ring-y', cy + 'px')
  ring.style.setProperty('--ring-color', colors.primary)
  document.body.appendChild(ring)

  // === Cria partículas de brilho que saem do ponto de origem ===
  const particleCount = 12
  const particlesContainer = document.createElement('div')
  particlesContainer.className = 'theme-particles'
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div')
    p.className = 'theme-particle'
    const angle = (i / particleCount) * 360
    const dist = 60 + Math.random() * 80
    p.style.setProperty('--px', cx + 'px')
    p.style.setProperty('--py', cy + 'px')
    p.style.setProperty('--tx', (Math.cos(angle * Math.PI / 180) * dist) + 'px')
    p.style.setProperty('--ty', (Math.sin(angle * Math.PI / 180) * dist) + 'px')
    p.style.setProperty('--particle-color', colors.primary)
    p.style.setProperty('--delay', (Math.random() * 80) + 'ms')
    particlesContainer.appendChild(p)
  }
  document.body.appendChild(particlesContainer)

  // Força reflow
  overlay.offsetHeight

  // === Fase 1: Ripple expande + ring pulsa + partículas saem ===
  overlay.classList.add('expanding')
  ring.classList.add('pulsing')
  particlesContainer.classList.add('active')

  // === Fase 2: No pico, troca o tema e aplica transições CSS ===
  setTimeout(() => {
    // Ativa transições suaves de cor em todos os elementos
    document.documentElement.classList.add('theme-changing')
    callback()
  }, 200)

  // === Fase 3: Fade out de tudo ===
  setTimeout(() => {
    overlay.classList.add('fading')
    ring.classList.add('fading')
    particlesContainer.classList.add('fading')
  }, 350)

  // Limpeza: remove todos os elementos de transição
  setTimeout(() => {
    overlay.remove()
    ring.remove()
    particlesContainer.remove()
  }, 800)

  // Remove a classe de transição de cores após as transições CSS terminarem
  setTimeout(() => {
    document.documentElement.classList.remove('theme-changing')
  }, 1000)
}

export function initTheme() {
  const saved = localStorage.getItem('osi-theme') || 'cyber'
  document.documentElement.setAttribute('data-theme', saved)

  const buttons = document.querySelectorAll('.theme-btn')

  // Seta estado inicial dos botões
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === saved)
  })

  // Posiciona o slider no botão ativo após o DOM estar pronto
  requestAnimationFrame(() => {
    const activeBtn = document.querySelector('.theme-btn.active')
    posicionarSlider(activeBtn)
  })

  // Reposiciona o slider quando a janela é redimensionada
  window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.theme-btn.active')
    posicionarSlider(activeBtn)
  })

  // Listeners dos botões de tema
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme
      const currentTheme = document.documentElement.getAttribute('data-theme')

      // Não faz nada se clicar no tema já ativo
      if (theme === currentTheme) return

      // Anima o slider imediatamente
      posicionarSlider(btn)

      // Executa a transição cinematográfica
      themeTransition(btn, theme, () => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('osi-theme', theme)
        buttons.forEach(b => b.classList.toggle('active', b.dataset.theme === theme))
      })
    })
  })
}
