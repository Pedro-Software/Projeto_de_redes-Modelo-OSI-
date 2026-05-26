const user = document.querySelector('.user')
const reqBtn = document.querySelector('.request-btn')
const reqText = document.querySelector('.text-input')
const inputFile = document.querySelector('#arquivo')
const protocolName = document.querySelector('.protocol-name')
const formContainer = document.querySelector('.form-container')

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
  if (reqText) reqText.value = ''
  if (inputFile) inputFile.value = ''
  renderProtocolName('')
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
