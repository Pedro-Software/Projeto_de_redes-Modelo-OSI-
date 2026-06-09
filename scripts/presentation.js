const user = document.querySelector('.user')
const reqBtn = document.querySelector('.request-btn')
const reqText = document.querySelector('.text-input')
const inputFile = document.querySelector('#arquivo')
const protocolName = document.querySelector('.protocol-name')
const formContainer = document.querySelector('.form-container')
const presentationContainer = document.querySelector('.presentation-container')
const applicationSection = document.querySelector('.application-layer-section')
const presentationSection = document.querySelector('.presentation-layer-section')

export function initializeUI(userName) {
  if (user) user.textContent = `Usuário: ${userName}`
}

export function getRequestText() {
  return reqText ? reqText.value.trim() : ''
}

export function getSelectedFile() {
  return inputFile && inputFile.files.length > 0 ? inputFile.files[0] : null
}

export function renderProtocolName(text) {
  if (protocolName) protocolName.textContent = text
}

export function clearUI() {
  if (formContainer) formContainer.innerHTML = ''
  if (applicationSection) applicationSection.classList.add('hidden')
  if (reqText) reqText.value = ''
  if (inputFile) inputFile.value = ''
  renderProtocolName('')
  clearPresentationLayer()
}

function showApplicationLayer() {
  if (applicationSection) applicationSection.classList.remove('hidden')
}

export function showAlert(message) {
  window.alert(message)
}

function attachFormSubmit(handler) {
  const form = document.getElementById('dynamic-form')
  if (form) form.addEventListener('submit', handler)
}

export function renderEmailForm(remetente, usuario, onSubmit) {
  if (!formContainer) return
  showApplicationLayer()
  formContainer.innerHTML = `
    <form id="dynamic-form" class="dynamic-form">
      <h3>Novo E-mail</h3>
      <div class="form-group">
        <input type="text" id="remetente" value="${remetente}" readonly placeholder=" ">
        <label>Remetente</label>
      </div>
      <div class="form-group">
        <input type="email" id="destinatario" required placeholder=" ">
        <label>Destinatário</label>
      </div>
      <div class="form-group">
        <input type="text" id="assunto" required placeholder=" ">
        <label>Assunto</label>
      </div>
      <div class="form-group">
        <textarea id="corpo" required placeholder=" "></textarea>
        <label>Corpo da mensagem</label>
      </div>
      <div class="form-group">
        <input type="text" id="usuario" value="${usuario}" readonly placeholder=" ">
        <label>Usuário</label>
      </div>
      <div class="form-group">
        <input type="text" id="protocolo" value="SMTP" readonly placeholder=" ">
        <label>Protocolo</label>
      </div>
      <button type="submit" class="form-submit-btn">Enviar</button>
    </form>
  `

  attachFormSubmit(function (e) {
    e.preventDefault()
    onSubmit({
      destinatario: document.getElementById('destinatario').value,
      assunto: document.getElementById('assunto').value,
      corpo: document.getElementById('corpo').value
    })
  })
}

export function renderHttpForm(hostIP, usuario, onSubmit) {
  if (!formContainer) return
  showApplicationLayer()
  formContainer.innerHTML = `
    <form id="dynamic-form" class="dynamic-form">
      <h3>Requisição de Site</h3>
      <div class="form-group">
        <input type="text" id="metodo" value="GET" readonly placeholder=" ">
        <label>Método</label>
      </div>
      <div class="form-group">
        <input type="text" id="hostIP" value="${hostIP}" readonly placeholder=" ">
        <label>Host/IP</label>
      </div>
      <div class="form-group">
        <input type="text" id="protocolo" value="HTTP/HTTPS" readonly placeholder=" ">
        <label>Protocolo</label>
      </div>
      <div class="form-group">
        <input type="text" id="usuario" value="${usuario}" readonly placeholder=" ">
        <label>Usuário</label>
      </div>
      <button type="submit" class="form-submit-btn">Salvar Pacote</button>
    </form>
  `

  attachFormSubmit(function (e) {
    e.preventDefault()
    onSubmit()
  })
}

export function renderChatForm(mensagem, usuario, onSubmit) {
  if (!formContainer) return
  showApplicationLayer()
  formContainer.innerHTML = `
    <form id="dynamic-form" class="dynamic-form">
      <h3>Mensagem de Chat</h3>
      <div class="form-group">
        <input type="text" id="usuario" value="${usuario}" readonly placeholder=" ">
        <label>Usuário</label>
      </div>
      <div class="form-group">
        <input type="text" id="mensagem" value="${mensagem}" readonly placeholder=" ">
        <label>Mensagem</label>
      </div>
      <div class="form-group">
        <input type="text" id="protocolo" value="WebSocket" readonly placeholder=" ">
        <label>Protocolo</label>
      </div>
      <button type="submit" class="form-submit-btn">Salvar Pacote</button>
    </form>
  `

  attachFormSubmit(function (e) {
    e.preventDefault()
    onSubmit()
  })
}

export function renderFileForm(file, usuario, onSubmit) {
  if (!formContainer || !file) return
  showApplicationLayer()
  const fileName = file.name
  const fileExt = fileName.includes('.') ? fileName.split('.').pop().toUpperCase() : 'DESCONHECIDO'

  formContainer.innerHTML = `
    <form id="dynamic-form" class="dynamic-form">
      <h3>Envio de Arquivo</h3>
      <div class="form-group">
        <input type="text" id="nomeArquivo" value="${fileName}" readonly placeholder=" ">
        <label>Nome do Arquivo</label>
      </div>
      <div class="form-group">
        <input type="text" id="formato" value="${fileExt}" readonly placeholder=" ">
        <label>Formato</label>
      </div>
      <div class="form-group">
        <input type="text" id="remetente" value="${usuario}" readonly placeholder=" ">
        <label>Remetente</label>
      </div>
      <div class="form-group">
        <input type="text" id="protocolo" value="FTP" readonly placeholder=" ">
        <label>Protocolo</label>
      </div>
      <button type="submit" class="form-submit-btn">Salvar Pacote</button>
    </form>
  `

  attachFormSubmit(function (e) {
    e.preventDefault()
    onSubmit({
      nomeArquivo: document.getElementById('nomeArquivo').value,
      formato: document.getElementById('formato').value,
      remetente: document.getElementById('remetente').value
    })
  })
}

export function onRequestClick(handler) {
  if (reqBtn) reqBtn.addEventListener('click', handler)
}

export function onFileChange(handler) {
  if (inputFile) inputFile.addEventListener('change', handler)
}

/* ===== Camada de Apresentação — JWT ===== */

const SENSITIVE_FIELDS = {
  chat: ['usuario', 'mensagem'],
  site: ['hostIP', 'usuario'],
  email: ['remetente', 'destinatario', 'assunto', 'corpo'],
  arquivo: ['nomeArquivo', 'remetente']
}

const DISPLAY_FIELDS = {
  chat: ['tipo', 'usuario', 'mensagem', 'protocolo', 'timestamp'],
  site: ['tipo', 'metodo', 'hostIP', 'protocolo', 'usuario', 'timestamp'],
  email: ['remetente', 'destinatario', 'assunto', 'corpo', 'protocolo', 'timestamp'],
  arquivo: ['nomeArquivo', 'formato', 'remetente', 'protocolo', 'timestamp']
}

const TYPE_LABELS = {
  chat: { number: 1, label: 'CHAT', varName: 'chat' },
  site: { number: 2, label: 'SITES', varName: 'requisicaoSite' },
  email: { number: 3, label: 'E-MAIL', varName: 'email' },
  arquivo: { number: 4, label: 'ARQUIVOS', varName: 'arquivo' }
}

/* --- JWT helpers --- */

let _joseModule = null

async function loadJose() {
  if (!_joseModule) {
    _joseModule = await import('https://cdn.jsdelivr.net/npm/jose@6/+esm')
  }
  return _joseModule
}

async function generateJWT(packet, sensitiveFields) {
  const { SignJWT } = await loadJose()

  const secret = new TextEncoder().encode('chave-secreta-didatica-osi')

  const payload = {}
  for (const field of sensitiveFields) {
    if (packet[field] !== undefined) {
      payload[field] = packet[field]
    }
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(secret)

  return token
}

function decodeJWTParts(token) {
  try {
    const parts = token.split('.')
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))
    return { header, payload }
  } catch {
    return { header: {}, payload: {} }
  }
}

/* --- Rendering helpers --- */

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function buildPresentationCodeLine(prop, value, isLast) {
  const comma = isLast ? '' : '<span class="syn-comma">,</span>'
  const displayValue = escapeHtml(String(value))

  const isJWT = prop === 'dadosProtegidosJWT'
  const stringClass = isJWT ? 'syn-string-encrypted' : 'syn-string'
  const badge = isJWT ? ' <span class="jwt-badge">🔒 Token JWT</span>' : ''

  return `  <span class="syn-prop">${escapeHtml(prop)}</span>: <span class="${stringClass}">'${displayValue}'</span>${badge}${comma}`
}

export async function renderPresentationLayer(packet) {
  if (!presentationContainer) return null

  const tipo = packet.tipo
  const meta = TYPE_LABELS[tipo]
  if (!meta) return null

  const sensitiveList = SENSITIVE_FIELDS[tipo] || []

  // Generate JWT with sensitive fields
  const tokenJWT = await generateJWT(packet, sensitiveList)
  const { header, payload } = decodeJWTParts(tokenJWT)

  // Build the presentation object to display
  const apresentacao = {
    tipo: packet.tipo,
    protocolo: packet.protocolo,
    dadosProtegidosJWT: tokenJWT,
    timestamp: packet.timestamp
  }

  const fields = Object.keys(apresentacao)
  const lines = fields.map((prop, i) => {
    const isLast = i === fields.length - 1
    const value = prop === 'dadosProtegidosJWT'
      ? tokenJWT.substring(0, 40) + '...'
      : apresentacao[prop]
    return buildPresentationCodeLine(prop, value, isLast)
  })

  const codeHTML = `<span class="syn-keyword">const</span> <span class="syn-var-name">apresentacao</span> <span class="syn-brace">=</span> <span class="syn-brace">{</span>
${lines.join('\n')}
<span class="syn-brace">}</span><span class="syn-semicolon">;</span>`

  const cardHTML = `
    <div class="presentation-card">
      <div class="presentation-card-header">
        <span class="presentation-card-number">${meta.number}</span>
        <span class="presentation-card-type">${escapeHtml(meta.label)}</span>
      </div>
      <pre class="presentation-code-block">${codeHTML}</pre>

      <div class="jwt-details-section">
        <div class="jwt-detail-block">
          <div class="jwt-detail-label">
            <span class="jwt-detail-icon">📋</span> Header do JWT
          </div>
          <pre class="jwt-detail-code">${escapeHtml(JSON.stringify(header, null, 2))}</pre>
        </div>

        <div class="jwt-detail-block">
          <div class="jwt-detail-label">
            <span class="jwt-detail-icon">📦</span> Payload decodificado <span class="jwt-didactic-tag">didático</span>
          </div>
          <pre class="jwt-detail-code">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
        </div>

        <div class="jwt-detail-block">
          <div class="jwt-detail-label">
            <span class="jwt-detail-icon">🔐</span> Token JWT completo
          </div>
          <div class="jwt-token-display"><code>${escapeHtml(tokenJWT)}</code></div>
        </div>
      </div>

      <div class="jwt-note">
        <span class="jwt-note-icon">🛡️</span>
        Os dados sensíveis foram encapsulados em um JWT assinado, simulando a preparação dos dados na Camada de Apresentação.
      </div>
    </div>
  `

  presentationContainer.innerHTML = cardHTML
  if (presentationSection) presentationSection.classList.remove('hidden')

  // Return the presentation packet for the next layer
  const presentationPacket = {
    tipo: packet.tipo,
    protocolo: packet.protocolo,
    tokenJWT: tokenJWT,
    timestamp: packet.timestamp,
    origem: packet.usuario || packet.remetente || 'Pedro Henrique',
    dadosOriginais: packet
  }

  return presentationPacket
}

export function clearPresentationLayer() {
  if (presentationContainer) presentationContainer.innerHTML = ''
  if (presentationSection) presentationSection.classList.add('hidden')
}
