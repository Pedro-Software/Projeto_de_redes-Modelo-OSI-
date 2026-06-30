/* ===== Camada 2 — Enlace de Dados ===== */

import { md5 } from './md5.js'

const datalinkContainer = document.querySelector('.datalink-container')
const datalinkSection = document.querySelector('.datalink-layer-section')

/* ===== Utilidades ===== */

/**
 * Escapa caracteres HTML para evitar XSS ao renderizar conteúdo dinâmico.
 */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/* ===== Geração de Frame ID ===== */

/**
 * Gera um Frame ID incremental no formato F001, F002, F003...
 * O contador é persistido em localStorage para manter a sequência entre requisições.
 */
function gerarFrameId() {
  let counter = parseInt(localStorage.getItem('frameCounter') || '0', 10)
  counter++
  localStorage.setItem('frameCounter', String(counter))
  return 'F' + String(counter).padStart(3, '0')
}

/* ===== Geração de Endereço MAC ===== */

/**
 * Gera um endereço MAC fictício aleatório no formato XX:XX:XX:XX:XX:XX
 * usando caracteres hexadecimais em maiúsculo.
 */
function gerarMacFicticio() {
  const hexChars = '0123456789ABCDEF'
  const octetos = []
  for (let i = 0; i < 6; i++) {
    let octeto = ''
    for (let j = 0; j < 2; j++) {
      octeto += hexChars.charAt(Math.floor(Math.random() * hexChars.length))
    }
    octetos.push(octeto)
  }
  return octetos.join(':')
}

/**
 * Obtém o MAC da máquina de origem (emissor da mensagem).
 * Como o projeto roda em JavaScript puro no navegador, não é possível
 * obter o MAC real da máquina — limitação de segurança do browser.
 * 
 * Solução didática:
 *   1. Gera um MAC fictício para a máquina de origem na primeira requisição.
 *   2. Persiste esse MAC no localStorage para manter consistência entre requisições.
 *   3. Nas próximas requisições, retorna sempre o mesmo MAC armazenado.
 */
function obterMacOrigem() {
  const savedMac = localStorage.getItem('macOrigemSimulado')
  if (savedMac) return savedMac

  const mac = gerarMacFicticio()
  localStorage.setItem('macOrigemSimulado', mac)
  return mac
}

/**
 * Gera um endereço MAC fictício para o dispositivo de destino
 * (roteador, switch ou outro equipamento de rede receptor).
 * Gerado aleatoriamente a cada requisição, pois em uma rede real
 * o MAC de destino muda conforme o próximo salto (hop).
 */
function gerarMacDestino() {
  return gerarMacFicticio()
}

/* ===== Renderização do Code Block ===== */

/**
 * Monta uma linha de código formatada para o bloco de código do card da Camada de Enlace.
 * Segue exatamente o mesmo padrão visual dos buildCodeLine das camadas de Transporte e Rede.
 */
function buildDataLinkCodeLine(prop, value, isHighlight, isLast) {
  const comma = isLast ? '' : '<span class="syn-comma">,</span>'
  const displayValue = escapeHtml(String(value))
  const stringClass = isHighlight ? 'syn-string-datalink' : 'syn-string'
  const badge = isHighlight ? ' <span class="datalink-badge">🔗 Enlace</span>' : ''

  return `  <span class="syn-prop">${escapeHtml(prop)}</span>: <span class="${stringClass}">'${displayValue}'</span>${badge}${comma}`
}

/* ===== Função Principal de Renderização ===== */

/**
 * Renderiza a Camada de Enlace de Dados.
 * Recebe o pacote da Camada de Rede (com IP origem, IP destino, rota, custoTotal, TTL,
 * e dadosOriginais contendo toda a cadeia de encapsulamento desde a Camada 7).
 *
 * Cria o frame Ethernet com:
 *   - frameId: identificador incremental (F001, F002...)
 *   - macOrigem: MAC fictício persistente da máquina emissora
 *   - macDestino: MAC fictício aleatório do dispositivo receptor
 *   - tipo: protocolo de rede (IPv4)
 *   - dadosOriginais: pacote completo da Camada de Rede (encapsulamento)
 *   - crc: hash MD5 do frame (sem o próprio campo crc, para evitar auto-referência)
 *
 * @param {Object} networkPacket — objeto retornado por renderNetworkLayer()
 * @returns {Object|null} — frame completo da Camada de Enlace, ou null em caso de erro
 */
export function renderDataLinkLayer(networkPacket) {
  if (!datalinkContainer) return null

  // Gera os campos obrigatórios do frame
  const frameId = gerarFrameId()
  const macOrigem = obterMacOrigem()
  const macDestino = gerarMacDestino()
  const tipo = 'IPv4' // Preparado para futuramente aceitar IPv6

  // Monta o frame SEM o CRC para calcular o hash corretamente
  const frameSemCrc = {
    frameId,
    macOrigem,
    macDestino,
    tipo,
    dadosOriginais: networkPacket
  }

  // Calcula o CRC (hash MD5) do frame sem incluir o próprio campo crc
  const crc = md5(JSON.stringify(frameSemCrc))

  // Frame final com CRC incluído
  const frame = {
    ...frameSemCrc,
    crc
  }

  // Campos que serão exibidos no bloco de código visual
  // (dadosOriginais não é renderizado no code block — é um objeto aninhado complexo)
  const camposVisiveis = ['frameId', 'macOrigem', 'macDestino', 'tipo', 'crc']
  const highlightFields = ['frameId', 'macOrigem', 'macDestino']

  const lines = camposVisiveis.map((prop, i) => {
    const isHighlight = highlightFields.includes(prop)
    const isLast = i === camposVisiveis.length - 1
    return buildDataLinkCodeLine(prop, frame[prop], isHighlight, isLast)
  })

  const codeHTML = `<span class="syn-keyword">const</span> <span class="syn-var-name">frame</span> <span class="syn-brace">=</span> <span class="syn-brace">{</span>
${lines.join('\n')}
<span class="syn-brace">}</span><span class="syn-semicolon">;</span>`

  const cardHTML = `
    <div class="datalink-card">
      <div class="datalink-card-header">
        <span class="datalink-card-icon">🔗</span>
        <span class="datalink-card-type">FRAME ETHERNET</span>
        <span class="datalink-status-indicator">
          <span class="datalink-pulse"></span>
          ENCAPSULADO
        </span>
      </div>
      <pre class="datalink-code-block">${codeHTML}</pre>
      <div class="datalink-info-section">
        <div class="datalink-info-label">Detalhes do Frame Ethernet (Camada 2)</div>
        <div class="datalink-info-detail">
          <span class="datalink-info-item">
            <span class="datalink-info-icon">🆔</span>
            Frame ID: <strong>${escapeHtml(frameId)}</strong>
          </span>
          <span class="datalink-info-item">
            <span class="datalink-info-icon">📤</span>
            MAC Origem: <strong>${escapeHtml(macOrigem)}</strong> <span class="datalink-info-tag">máquina emissora</span>
          </span>
          <span class="datalink-info-item">
            <span class="datalink-info-icon">📥</span>
            MAC Destino: <strong>${escapeHtml(macDestino)}</strong> <span class="datalink-info-tag">próximo salto</span>
          </span>
          <span class="datalink-info-item">
            <span class="datalink-info-icon">📋</span>
            Tipo: <strong>${escapeHtml(tipo)}</strong>
          </span>
          <span class="datalink-info-item">
            <span class="datalink-info-icon">🔐</span>
            CRC (MD5): <strong class="datalink-crc-value">${escapeHtml(crc)}</strong>
          </span>
        </div>
      </div>
      <div class="datalink-note">
        <span class="datalink-note-icon">⚡</span>
        A Camada de Enlace encapsulou o pacote IP da Camada de Rede em um frame Ethernet, adicionando endereços MAC (físicos) de origem e destino, além de um CRC calculado via hash MD5 para verificação de integridade. O frame será enviado para a Camada Física para transmissão em bits.
      </div>
    </div>
  `

  datalinkContainer.innerHTML = cardHTML
  if (datalinkSection) datalinkSection.classList.remove('hidden')

  // Retorna o frame completo para a próxima camada (Física)
  return frame
}

/**
 * Limpa o conteúdo da Camada de Enlace e oculta a seção.
 * Chamada no início de uma nova requisição ou quando não há rota válida.
 */
export function clearDataLinkLayer() {
  if (datalinkContainer) datalinkContainer.innerHTML = ''
  if (datalinkSection) datalinkSection.classList.add('hidden')
}
