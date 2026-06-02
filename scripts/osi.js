import * as application from './application.js'
import * as presentation from './presentation.js'

function processPacket(packet) {
  presentation.renderPresentationLayer(packet)
  const savedKey = application.loadLastPacketKey()
  if (savedKey) {
    console.log('Packet key saved in localStorage:', savedKey)
  }
}

function handleRequest(event) {
  event.preventDefault()

  const requestText = presentation.getRequestText()
  const file = presentation.getSelectedFile()
  const protocolType = application.detectProtocol(requestText, !!file)

  if (!protocolType) {
    presentation.showAlert('Por favor, digite algo ou selecione um arquivo.')
    return
  }

  presentation.clearPresentationLayer()
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
    })
    return
  }
}

presentation.initializeUI(application.USER_NAME)
presentation.onRequestClick(handleRequest)
