/* ===== Camada 4 — Transporte ===== */

const transportContainer = document.querySelector('.transport-container')
const transportSection = document.querySelector('.transport-layer-section')

/**
 * Mapeamento de protocolo da camada de aplicação para porta de destino.
 * Referência do professor:
 * HTTP     - TCP - 80
 * HTTPS    - TCP - 443
 * WebSocket (ws) - TCP - 80
 * SMTP (envio de e-mail) - TCP - 587
 * FTP      - TCP - 21
 */
const PROTOCOLO_PORTA_MAP = {
  'HTTP': 80,
  'HTTPS': 443,
  'HTTP/HTTPS': 443,
  'WebSocket': 80,
  'SMTP': 587,
  'SMTP/POP': 587,
  'FTP': 21,
  'HTTP Upload': 80
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Gera porta de origem aleatória no range efêmero (49152–65535)
 */
function gerarPortaOrigem() {
  return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152
}

/**
 * Determina a porta de destino com base no protocolo da camada de aplicação
 */
function obterPortaDestino(protocolo) {
  return PROTOCOLO_PORTA_MAP[protocolo] || 80
}

function buildTransportCodeLine(prop, value, isHighlight, isLast) {
  const comma = isLast ? '' : '<span class="syn-comma">,</span>'
  const displayValue = escapeHtml(String(value))
  const stringClass = isHighlight ? 'syn-string-transport' : 'syn-string'
  const badge = isHighlight ? ' <span class="transport-badge">📡 Transporte</span>' : ''

  // Valores numéricos não precisam de aspas
  const isNumeric = typeof value === 'number'
  const valueHTML = isNumeric
    ? `<span class="syn-number">${displayValue}</span>`
    : `<span class="${stringClass}">'${displayValue}'</span>`

  return `  <span class="syn-prop">${escapeHtml(prop)}</span>: ${valueHTML}${badge}${comma}`
}

/**
 * Renderiza a Camada de Transporte.
 * Recebe o pacote da camada de sessão (com sessionId, protocolo, etc.)
 * Retorna o objeto de transporte para encadeamento com a próxima camada.
 */
export function renderTransportLayer(sessionPacket) {
  if (!transportContainer) return null

  const protocolo = sessionPacket.protocolo || sessionPacket.dadosOriginais?.protocolo || 'HTTP'

  const transporte = {
    sessionId: sessionPacket.sessionId,
    packetId: crypto.randomUUID(),
    protocoloTransporte: 'TCP',
    portaOrigem: gerarPortaOrigem(),
    portaDestino: obterPortaDestino(protocolo)
  }

  const highlightFields = ['sessionId', 'packetId', 'protocoloTransporte']

  const fields = Object.keys(transporte)
  const lines = fields.map((prop, i) => {
    const isHighlight = highlightFields.includes(prop)
    const isLast = i === fields.length - 1
    return buildTransportCodeLine(prop, transporte[prop], isHighlight, isLast)
  })

  const codeHTML = `<span class="syn-keyword">const</span> <span class="syn-var-name">transporte</span> <span class="syn-brace">=</span> <span class="syn-brace">{</span>
${lines.join('\n')}
<span class="syn-brace">}</span><span class="syn-semicolon">;</span>`

  const cardHTML = `
    <div class="transport-card">
      <div class="transport-card-header">
        <span class="transport-card-icon">📡</span>
        <span class="transport-card-type">SEGMENTO TCP</span>
        <span class="transport-status-indicator">
          <span class="transport-pulse"></span>
          ENCAPSULADO
        </span>
      </div>
      <pre class="transport-code-block">${codeHTML}</pre>
      <div class="transport-port-section">
        <div class="transport-port-label">Mapeamento de Porta (${escapeHtml(protocolo)} → TCP)</div>
        <div class="transport-port-detail">
          <span class="transport-port-item">
            <span class="transport-port-icon">⬆️</span>
            Porta Origem: <strong>${transporte.portaOrigem}</strong> <span class="transport-port-tag">efêmera</span>
          </span>
          <span class="transport-port-item">
            <span class="transport-port-icon">⬇️</span>
            Porta Destino: <strong>${transporte.portaDestino}</strong> <span class="transport-port-tag">${escapeHtml(protocolo)}</span>
          </span>
        </div>
      </div>
      <div class="transport-note">
        <span class="transport-note-icon">⚡</span>
        Segmento TCP criado com sucesso. A camada de transporte adicionou as portas de origem e destino, garantindo a entrega confiável dos dados entre os processos de comunicação. O pacote será encaminhado para a Camada de Rede.
      </div>
    </div>
  `

  transportContainer.innerHTML = cardHTML
  if (transportSection) transportSection.classList.remove('hidden')

  // Retorna o pacote de transporte para a próxima camada
  return {
    ...transporte,
    protocolo: protocolo,
    dadosOriginais: sessionPacket
  }
}

export function clearTransportLayer() {
  if (transportContainer) transportContainer.innerHTML = ''
  if (transportSection) transportSection.classList.add('hidden')
}