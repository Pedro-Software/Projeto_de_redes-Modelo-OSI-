import * as application from './application.js'
import * as presentation from './presentation.js'
import * as session from './session.js'
import * as transport from './transport.js'
import * as network from './network.js'
import * as datalink from './datalink.js'
import * as physical from './physical.js'
import { initTheme } from './theme.js'

async function processPacket(packet) {
  const presentationPacket = await presentation.renderPresentationLayer(packet)
  if (presentationPacket) {
    const sessionPacket = session.renderSessionLayer(presentationPacket)

    // Camada 4 — Transporte
    if (sessionPacket) {
      const transportPacket = transport.renderTransportLayer(sessionPacket)

      // Camada 3 — Rede (mostra a seção e popula os selects)
      if (transportPacket) {
        const networkSection = document.querySelector('.network-layer-section')
        if (networkSection) networkSection.classList.remove('hidden')
        network.popularControles()

        // Configura o botão de calcular rota
        const btnCalcRota = document.getElementById('btn-calcular-rota')
        if (btnCalcRota) {
          // Remove listeners antigos clonando o botão
          const novoBotao = btnCalcRota.cloneNode(true)
          btnCalcRota.parentNode.replaceChild(novoBotao, btnCalcRota)

          novoBotao.addEventListener('click', () => {
            const origemId = document.getElementById('select-origem').value
            const destinoId = document.getElementById('select-destino').value
            const algoritmo = document.getElementById('select-algoritmo').value

            if (origemId === destinoId) {
              alert('Selecione roteadores de origem e destino diferentes.')
              return
            }

            const networkPacket = network.renderNetworkLayer(transportPacket, origemId, destinoId, algoritmo)

            if (networkPacket && Array.isArray(networkPacket.rota) && networkPacket.rota.length > 0) {
              const frame = datalink.renderDataLinkLayer(networkPacket)
              if (frame) {
                physical.renderPhysicalLayer(frame)
              }
            } else {
              datalink.clearDataLinkLayer()
              physical.clearPhysicalLayer()
            }
          })
        }
      }
    }
  }
  const savedKey = application.loadLastPacketKey()
  if (savedKey) {
    console.log('Packet key saved in localStorage:', savedKey)
  }
}

function handleRequest(event) {
  event.preventDefault()

  const isFileChange = event.target && event.target.id === 'arquivo'
  if (isFileChange) {
    const textInput = document.querySelector('.text-input')
    if (textInput) textInput.value = ''
  }

  const requestText = presentation.getRequestText()
  const file = presentation.getSelectedFile()
  const protocolType = isFileChange ? 'file' : application.detectProtocol(requestText, !!file)

  if (!protocolType) {
    presentation.showAlert('Por favor, digite algo ou selecione um arquivo.')
    return
  }

  presentation.clearPresentationLayer()
  session.clearSessionLayer()
  transport.clearTransportLayer()
  network.clearNetworkLayer()
  datalink.clearDataLinkLayer()
  physical.clearPhysicalLayer()
  presentation.renderProtocolName(application.getProtocolLabel(protocolType))

  if (protocolType === 'email') {
    presentation.renderEmailForm(requestText, application.USER_NAME, formData => {
      const packet = application.createEmailPacket(requestText, formData.destinatario, formData.assunto, formData.corpo)
      processPacket(packet)
    })
    return
  }

  if (protocolType === 'http') {
    presentation.renderHttpForm(requestText, application.USER_NAME, () => {
      const packet = application.createHttpPacket(requestText, application.USER_NAME)
      processPacket(packet)
    })
    return
  }

  if (protocolType === 'chat') {
    presentation.renderChatForm(requestText, application.USER_NAME, () => {
      const packet = application.createChatPacket(requestText, application.USER_NAME)
      processPacket(packet)
    })
    return
  }

  if (protocolType === 'file' && file) {
    presentation.renderFileForm(file, application.USER_NAME, formData => {
      const packet = application.createFilePacket(formData.nomeArquivo, formData.formato, formData.remetente)
      processPacket(packet)
      const fileInput = document.querySelector('#arquivo')
      if (fileInput) fileInput.value = ''
    })

    const form = document.getElementById('dynamic-form')
    if (form) {
      form.requestSubmit()
    }
    return
  }
}

initTheme()
presentation.initializeUI(application.USER_NAME)
presentation.onRequestClick(handleRequest)
presentation.onFileChange(handleRequest)
