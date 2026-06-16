/* ===== Camada 5 — Sessão ===== */

const sessionContainer = document.querySelector('.session-container')
const sessionSection = document.querySelector('.session-layer-section')

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function buildSessionCodeLine(prop, value, isHighlight, isLast) {
  const comma = isLast ? '' : '<span class="syn-comma">,</span>'
  const displayValue = escapeHtml(String(value))
  const stringClass = isHighlight ? 'syn-string-session' : 'syn-string'
  const badge = isHighlight ? ' <span class="session-badge">🔗 Sessão</span>' : ''

  return `  <span class="syn-prop">${escapeHtml(prop)}</span>: <span class="${stringClass}">'${displayValue}'</span>${badge}${comma}`
}

export function renderSessionLayer(presentationPacket) {
  if (!sessionContainer) return null

  const now = new Date()
  const expiry = new Date(now.getTime() + 30 * 60 * 1000)

  const sessao = {
    sessionId: crypto.randomUUID(),
    status: 'sessao_estabelecida',
    origem: presentationPacket.origem || 'Pedro Henrique',
    destino: 'Servidor OSI',
    camadaAnterior: 'Apresentação',
    tokenJWT: presentationPacket.tokenJWT,
    inicioSessao: now.toISOString(),
    expiraEm: expiry.toISOString()
  }

  const highlightFields = ['sessionId', 'status', 'tokenJWT']

  const fields = Object.keys(sessao)
  const lines = fields.map((prop, i) => {
    const isHighlight = highlightFields.includes(prop)
    const isLast = i === fields.length - 1
    return buildSessionCodeLine(prop, sessao[prop], isHighlight, isLast)
  })

  const codeHTML = `<span class="syn-keyword">const</span> <span class="syn-var-name">sessao</span> <span class="syn-brace">=</span> <span class="syn-brace">{</span>
${lines.join('\n')}
<span class="syn-brace">}</span><span class="syn-semicolon">;</span>`

  const tokenPreview = escapeHtml(sessao.tokenJWT)

  const cardHTML = `
    <div class="session-card">
      <div class="session-card-header">
        <span class="session-card-icon">🔗</span>
        <span class="session-card-type">SESSÃO ESTABELECIDA</span>
        <span class="session-status-indicator">
          <span class="session-pulse"></span>
          ATIVA
        </span>
      </div>
      <pre class="session-code-block">${codeHTML}</pre>
      <div class="session-jwt-section">
        <div class="session-jwt-label">Token JWT recebido da Camada de Apresentação:</div>
        <div class="session-jwt-token-display"><code>${tokenPreview}</code></div>
      </div>
      <div class="session-note">
        <span class="session-note-icon">⚡</span>
        Sessão criada com sucesso. A comunicação entre origem e destino foi estabelecida, garantindo controle e continuidade do envio de dados para as próximas camadas do Modelo OSI.
      </div>
    </div>
  `

  sessionContainer.innerHTML = cardHTML
  if (sessionSection) sessionSection.classList.remove('hidden')

  // Retorna o pacote de sessão para a próxima camada (Transporte)
  return {
    ...sessao,
    protocolo: presentationPacket.protocolo,
    dadosOriginais: presentationPacket
  }
}

export function clearSessionLayer() {
  if (sessionContainer) sessionContainer.innerHTML = ''
  if (sessionSection) sessionSection.classList.add('hidden')
}
