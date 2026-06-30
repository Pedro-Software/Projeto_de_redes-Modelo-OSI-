/* ===== Camada 1 — Física ===== */

import { md5 } from './md5.js'

const physicalContainer = document.querySelector('.physical-container')
const physicalSection = document.querySelector('.physical-layer-section')

/* ===== Utilidades ===== */

/**
 * Escapa caracteres HTML para evitar XSS ao renderizar conteúdo dinâmico.
 */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Converte um objeto para sua representação binária (sequência de bits).
 * Primeiro serializa o objeto para JSON, depois converte cada caractere
 * da string JSON para seu código ASCII em binário de 8 bits (1 byte).
 *
 * Exemplo: 'A' → 01000001
 *
 * @param {Object} obj — objeto a ser convertido
 * @returns {string} — string de 0s e 1s separados por espaço (1 byte por grupo)
 */
function converterParaBinario(obj) {
  const jsonString = JSON.stringify(obj)
  return jsonString
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ')
}

/**
 * Formata um objeto para exibição legível no card da Camada Física.
 * Renderiza apenas os campos de primeiro nível do frame (sem expandir
 * dadosOriginais recursivamente, pois seria muito extenso).
 *
 * @param {Object} obj — frame recebido da Camada de Enlace
 * @returns {string} — representação formatada (HTML-safe) do objeto
 */
function formatarObjeto(obj) {
  const camposVisiveis = ['frameId', 'macOrigem', 'macDestino', 'tipo', 'crc']
  let resultado = '{\n'
  camposVisiveis.forEach((key, index) => {
    if (obj[key] !== undefined) {
      const valor = typeof obj[key] === 'string' ? `"${escapeHtml(obj[key])}"` : escapeHtml(String(obj[key]))
      const comma = index < camposVisiveis.length - 1 ? ',' : ''
      resultado += `  ${escapeHtml(key)}: ${valor}${comma}\n`
    }
  })
  // Indica que dadosOriginais existe mas está resumido
  if (obj.dadosOriginais) {
    resultado += `  dadosOriginais: { ... } // pacote completo da Camada de Rede\n`
  }
  resultado += '}'
  return resultado
}

/* ===== Função Principal de Renderização ===== */

/**
 * Renderiza a Camada Física.
 * Recebe o frame da Camada de Enlace e realiza:
 *   1. Validação de integridade — recalcula o CRC (MD5) do frame
 *      sem o campo crc e compara com o valor recebido.
 *   2. Conversão para binário — converte o frame inteiro (incluindo CRC)
 *      para sequência de bits (0s e 1s).
 *   3. Exibição na tela — mostra o frame recebido, resultado da validação,
 *      representação binária e mensagem de encerramento da transmissão.
 *
 * @param {Object} frame — frame retornado por renderDataLinkLayer()
 */
export function renderPhysicalLayer(frame) {
  if (!physicalContainer) return

  // === 1. Validação de Integridade (CRC) ===
  // Separa o CRC do restante do frame para recalcular o hash
  const { crc, ...frameSemCrc } = frame
  const crcRecalculado = md5(JSON.stringify(frameSemCrc))
  const integridadeOk = crcRecalculado === crc

  // === 2. Conversão para Binário ===
  // Converte o frame completo (com CRC) para bits
  const binario = converterParaBinario(frame)

  // === 3. Renderização na Tela ===
  const statusIntegridade = integridadeOk
    ? '<span class="physical-integrity-ok">✅ Integridade verificada: CRC compatível</span><br><span class="physical-integrity-detail">A mensagem não perdeu nenhum frame/dado.</span>'
    : '<span class="physical-integrity-fail">❌ Falha de integridade: CRC diferente</span><br><span class="physical-integrity-detail">A mensagem pode ter sido corrompida durante a transmissão.</span>'

  const frameFormatado = formatarObjeto(frame)

  const cardHTML = `
    <div class="physical-card">
      <div class="physical-card-header">
        <span class="physical-card-icon">⚡</span>
        <span class="physical-card-type">SINAL FÍSICO</span>
        <span class="physical-status-indicator">
          <span class="physical-pulse"></span>
          TRANSMITIDO
        </span>
      </div>

      <!-- Bloco Superior: Frame recebido da Camada de Enlace -->
      <div class="physical-frame-section">
        <div class="physical-frame-label">Frame recebido da Camada de Enlace</div>
        <pre class="physical-code-block">${escapeHtml(frameFormatado)}</pre>
      </div>

      <!-- Bloco Intermediário: Verificação de Integridade -->
      <div class="physical-integrity-section">
        <div class="physical-integrity-label">Verificação de Integridade (CRC / MD5)</div>
        <div class="physical-integrity-detail-block">
          <div class="physical-integrity-row">
            <span class="physical-integrity-key">CRC Recebido:</span>
            <span class="physical-integrity-hash">${escapeHtml(crc)}</span>
          </div>
          <div class="physical-integrity-row">
            <span class="physical-integrity-key">CRC Recalculado:</span>
            <span class="physical-integrity-hash">${escapeHtml(crcRecalculado)}</span>
          </div>
          <div class="physical-integrity-status">
            ${statusIntegridade}
          </div>
        </div>
      </div>

      <!-- Bloco Inferior: Representação Binária -->
      <div class="physical-binary-section">
        <div class="physical-binary-label">Representação Binária do Frame (bits transmitidos pelo meio físico)</div>
        <div class="physical-binary-block">${escapeHtml(binario)}</div>
      </div>

      <!-- Nota Final: Encerramento da Transmissão -->
      <div class="physical-note">
        <span class="physical-note-icon">⚡</span>
        Transmissão finalizada. Os dados foram convertidos em bits e enviados pelo meio físico. O frame Ethernet percorreu todas as 7 camadas do Modelo OSI — da Aplicação à Física — concluindo o encapsulamento completo da transmissão.
      </div>
    </div>
  `

  physicalContainer.innerHTML = cardHTML
  if (physicalSection) physicalSection.classList.remove('hidden')
}

/**
 * Limpa o conteúdo da Camada Física e oculta a seção.
 * Chamada no início de uma nova requisição ou quando não há rota válida.
 */
export function clearPhysicalLayer() {
  if (physicalContainer) physicalContainer.innerHTML = ''
  if (physicalSection) physicalSection.classList.add('hidden')
}
