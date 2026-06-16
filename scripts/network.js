/* ===== Camada 3 — Rede (Roteamento + Visualização Canvas) ===== */

import { points } from './points.js'

const networkContainer = document.querySelector('.network-container')
const networkSection = document.querySelector('.network-layer-section')
const networkComparison = document.querySelector('.network-comparison')
const networkCanvasWrapper = document.querySelector('.network-canvas-wrapper')

/* ===== Utilidades ===== */

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Cria um mapa de ID → roteador para acesso rápido
 */
function buildPointsMap(pontosArray) {
  const map = {}
  for (const p of pontosArray) {
    map[p.id] = p
  }
  return map
}

/**
 * Calcula a distância euclidiana entre dois roteadores
 */
function distanciaEuclidiana(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/* ===== Algoritmo de Dijkstra ===== */

/**
 * Encontra o caminho de menor custo (distância euclidiana) entre dois roteadores.
 * Considera apenas roteadores com ativo: true.
 * @returns {{ rota: string[], custoTotal: number, visitados: string[], naoUtilizados: string[] }}
 */
export function dijkstra(origemId, destinoId, pontosArray) {
  const mapa = buildPointsMap(pontosArray)
  const origem = mapa[origemId]
  const destino = mapa[destinoId]

  if (!origem || !destino) return { rota: [], custoTotal: 0, visitados: [], naoUtilizados: [] }

  // Inicialização
  const dist = {}       // menor distância conhecida até cada nó
  const anterior = {}   // nó anterior no caminho ótimo
  const visitados = new Set()
  const naoVisitados = new Set()

  for (const p of pontosArray) {
    if (p.ativo) {
      dist[p.id] = Infinity
      naoVisitados.add(p.id)
    }
  }
  dist[origemId] = 0

  while (naoVisitados.size > 0) {
    // Seleciona o nó não visitado com menor distância
    let atual = null
    let menorDist = Infinity
    for (const id of naoVisitados) {
      if (dist[id] < menorDist) {
        menorDist = dist[id]
        atual = id
      }
    }

    // Se não encontrou nó acessível ou chegou ao destino
    if (atual === null || atual === destinoId) break

    naoVisitados.delete(atual)
    visitados.add(atual)

    const pAtual = mapa[atual]
    if (!pAtual) continue

    // Relaxa as arestas dos vizinhos ativos
    for (const vizinhoId of pAtual.conexoes) {
      const vizinho = mapa[vizinhoId]
      if (!vizinho || !vizinho.ativo || !naoVisitados.has(vizinhoId)) continue

      const peso = distanciaEuclidiana(pAtual, vizinho)
      const novaDist = dist[atual] + peso

      if (novaDist < dist[vizinhoId]) {
        dist[vizinhoId] = novaDist
        anterior[vizinhoId] = atual
      }
    }
  }

  // Reconstrói a rota
  const rota = []
  let step = destinoId
  while (step !== undefined) {
    rota.unshift(step)
    step = anterior[step]
  }

  // Se a rota não começa na origem, não há caminho
  if (rota[0] !== origemId) {
    return { rota: [], custoTotal: 0, visitados: Array.from(visitados), naoUtilizados: [] }
  }

  visitados.add(destinoId)

  // Nós visitados que não fazem parte da rota final
  const rotaSet = new Set(rota)
  const naoUtilizados = Array.from(visitados).filter(id => !rotaSet.has(id))

  return {
    rota,
    custoTotal: Math.round((dist[destinoId] || 0) * 100) / 100,
    visitados: Array.from(visitados),
    naoUtilizados
  }
}

/* ===== Algoritmo Greedy (Guloso — Best-First) ===== */

/**
 * A cada passo, escolhe o vizinho ativo cuja coordenada está mais próxima
 * (em linha reta) do destino. Não garante caminho ótimo.
 * @returns {{ rota: string[], custoTotal: number, visitados: string[], naoUtilizados: string[] }}
 */
export function greedy(origemId, destinoId, pontosArray) {
  const mapa = buildPointsMap(pontosArray)
  const destino = mapa[destinoId]

  if (!mapa[origemId] || !destino) return { rota: [], custoTotal: 0, visitados: [], naoUtilizados: [] }

  const rota = [origemId]
  const visitados = new Set([origemId])
  let custoTotal = 0
  let atual = origemId

  while (atual !== destinoId) {
    const pAtual = mapa[atual]
    if (!pAtual) break

    // Filtra vizinhos ativos e não visitados
    const vizinhosDisponiveis = pAtual.conexoes
      .filter(id => {
        const v = mapa[id]
        return v && v.ativo && !visitados.has(id)
      })

    if (vizinhosDisponiveis.length === 0) break // Sem saída (beco sem saída)

    // Escolhe o vizinho mais próximo do destino (heurística gulosa)
    let melhorVizinho = null
    let menorDistancia = Infinity

    for (const vizId of vizinhosDisponiveis) {
      const vizinho = mapa[vizId]
      const dist = distanciaEuclidiana(vizinho, destino)
      if (dist < menorDistancia) {
        menorDistancia = dist
        melhorVizinho = vizId
      }
    }

    if (!melhorVizinho) break

    // Calcula custo real da aresta
    custoTotal += distanciaEuclidiana(pAtual, mapa[melhorVizinho])
    visitados.add(melhorVizinho)
    rota.push(melhorVizinho)
    atual = melhorVizinho
  }

  // Se não chegou ao destino
  if (atual !== destinoId) {
    return { rota: [], custoTotal: 0, visitados: Array.from(visitados), naoUtilizados: [] }
  }

  return {
    rota,
    custoTotal: Math.round(custoTotal * 100) / 100,
    visitados: Array.from(visitados), // No Greedy, visitados === rota
    naoUtilizados: [] // No Greedy puro, não explora nós extras
  }
}

/* ===== Visualização Canvas ===== */

const SVG_INATIVO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <!-- antena -->
  <line x1="10" y1="1" x2="10" y2="5" stroke="rgba(100,100,100,0.5)" stroke-width="1.5" stroke-linecap="round"/>
  <!-- corpo retangular simples -->
  <rect x="1" y="5" width="18" height="10" rx="2" fill="rgba(60,60,60,0.2)" stroke="rgba(100,100,100,0.5)" stroke-width="1"/>
  <!-- 3 bolinhas de porta -->
  <circle cx="5" cy="10" r="1.2" fill="rgba(100,100,100,0.5)"/>
  <circle cx="10" cy="10" r="1.2" fill="rgba(100,100,100,0.5)"/>
  <circle cx="15" cy="10" r="1.2" fill="rgba(100,100,100,0.5)"/>
</svg>`;

const SVG_ORIGEM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <!-- antena -->
  <line x1="10" y1="1" x2="10" y2="5" stroke="#39ff14" stroke-width="1.5" stroke-linecap="round"/>
  <!-- corpo retangular simples -->
  <rect x="1" y="5" width="18" height="10" rx="2" fill="rgba(57,255,20,0.25)" stroke="#39ff14" stroke-width="1"/>
  <!-- 3 bolinhas de porta -->
  <circle cx="5" cy="10" r="1.2" fill="#39ff14"/>
  <circle cx="10" cy="10" r="1.2" fill="#39ff14"/>
  <circle cx="15" cy="10" r="1.2" fill="#39ff14"/>
</svg>`;

const SVG_DESTINO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <!-- antena -->
  <line x1="10" y1="1" x2="10" y2="5" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round"/>
  <!-- corpo retangular simples -->
  <rect x="1" y="5" width="18" height="10" rx="2" fill="rgba(244,63,94,0.25)" stroke="#f43f5e" stroke-width="1"/>
  <!-- 3 bolinhas de porta -->
  <circle cx="5" cy="10" r="1.2" fill="#f43f5e"/>
  <circle cx="10" cy="10" r="1.2" fill="#f43f5e"/>
  <circle cx="15" cy="10" r="1.2" fill="#f43f5e"/>
</svg>`;

const SVG_NAO_UTILIZADO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <!-- antena -->
  <line x1="10" y1="1" x2="10" y2="5" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/>
  <!-- corpo retangular simples -->
  <rect x="1" y="5" width="18" height="10" rx="2" fill="rgba(249,115,22,0.2)" stroke="#f97316" stroke-width="1"/>
  <!-- 3 bolinhas de porta -->
  <circle cx="5" cy="10" r="1.2" fill="#f97316"/>
  <circle cx="10" cy="10" r="1.2" fill="#f97316"/>
  <circle cx="15" cy="10" r="1.2" fill="#f97316"/>
</svg>`;

const SVG_ROTA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <!-- antena -->
  <line x1="10" y1="1" x2="10" y2="5" stroke="#00f0ff" stroke-width="1.5" stroke-linecap="round"/>
  <!-- corpo retangular simples -->
  <rect x="1" y="5" width="18" height="10" rx="2" fill="rgba(0,240,255,0.25)" stroke="#00f0ff" stroke-width="1"/>
  <!-- 3 bolinhas de porta -->
  <circle cx="5" cy="10" r="1.2" fill="#00f0ff"/>
  <circle cx="10" cy="10" r="1.2" fill="#00f0ff"/>
  <circle cx="15" cy="10" r="1.2" fill="#00f0ff"/>
</svg>`;

const SVG_NORMAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <!-- antena -->
  <line x1="10" y1="1" x2="10" y2="5" stroke="rgba(0,240,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
  <!-- corpo retangular simples -->
  <rect x="1" y="5" width="18" height="10" rx="2" fill="rgba(0,240,255,0.08)" stroke="rgba(0,240,255,0.4)" stroke-width="1"/>
  <!-- 3 bolinhas de porta -->
  <circle cx="5" cy="10" r="1.2" fill="rgba(0,240,255,0.4)"/>
  <circle cx="10" cy="10" r="1.2" fill="rgba(0,240,255,0.4)"/>
  <circle cx="15" cy="10" r="1.2" fill="rgba(0,240,255,0.4)"/>
</svg>`;

let iconesCache = null;

async function carregarIcones() {
  if (iconesCache) return iconesCache;

  function svgParaImagem(svgStr) {
    return new Promise((resolve) => {
      const blob = new Blob([svgStr], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
      img.src = url
    })
  }

  iconesCache = Promise.all([
    svgParaImagem(SVG_INATIVO),
    svgParaImagem(SVG_ORIGEM),
    svgParaImagem(SVG_DESTINO),
    svgParaImagem(SVG_NAO_UTILIZADO),
    svgParaImagem(SVG_ROTA),
    svgParaImagem(SVG_NORMAL)
  ]).then(([inativo, origem, destino, naoUtilizado, rota, normal]) => {
    return { inativo, origem, destino, naoUtilizado, rota, normal }
  });

  return iconesCache;
}

let animationFrameId = null;
let currentAnimationId = 0;

/**
 * Desenha a rede de roteadores no canvas e anima o pacote pela rota.
 */
async function desenharCanvas(resultado, origemId, destinoId, pontosArray) {
  const icones = await carregarIcones()
  
  const canvas = document.getElementById('network-canvas')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const wrapper = canvas.parentElement

  // Ajusta tamanho do canvas ao wrapper
  const canvasWidth = wrapper.clientWidth || 900
  const canvasHeight = 520
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // Calcula escala para mapear coordenadas dos roteadores ao canvas
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of pontosArray) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  const padding = 40
  const scaleX = (canvasWidth - padding * 2) / (maxX - minX || 1)
  const scaleY = (canvasHeight - padding * 2) / (maxY - minY || 1)
  const scale = Math.min(scaleX, scaleY)

  const offsetX = (canvasWidth - (maxX - minX) * scale) / 2
  const offsetY = (canvasHeight - (maxY - minY) * scale) / 2

  function toCanvas(p) {
    return {
      cx: (p.x - minX) * scale + offsetX,
      cy: (p.y - minY) * scale + offsetY
    }
  }

  const mapa = buildPointsMap(pontosArray)
  const rotaSet = new Set(resultado.rota)
  const naoUtilizadosSet = new Set(resultado.naoUtilizados)

  // Cancela animação anterior se existir
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  const animId = ++currentAnimationId

  function desenharBase() {
    // Fundo
    ctx.fillStyle = '#070312'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Grade sutil
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvasWidth; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasHeight)
      ctx.stroke()
    }
    for (let y = 0; y < canvasHeight; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasWidth, y)
      ctx.stroke()
    }

    // Desenha conexões (linhas entre roteadores)
    ctx.lineWidth = 0.5
    const desenhadas = new Set()
    for (const p of pontosArray) {
      const posA = toCanvas(p)
      for (const vizId of p.conexoes) {
        const chave = [p.id, vizId].sort().join('-')
        if (desenhadas.has(chave)) continue
        desenhadas.add(chave)

        const viz = mapa[vizId]
        if (!viz) continue
        const posB = toCanvas(viz)

        // Destaca conexões da rota
        const ambosNaRota = rotaSet.has(p.id) && rotaSet.has(vizId)
        const idxA = resultado.rota.indexOf(p.id)
        const idxB = resultado.rota.indexOf(vizId)
        const conexaoNaRota = ambosNaRota && Math.abs(idxA - idxB) === 1

        if (conexaoNaRota) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)'
          ctx.lineWidth = 2.5
          ctx.shadowColor = 'rgba(0, 240, 255, 0.4)'
          ctx.shadowBlur = 8
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
          ctx.lineWidth = 0.5
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        }

        ctx.beginPath()
        ctx.moveTo(posA.cx, posA.cy)
        ctx.lineTo(posB.cx, posB.cy)
        ctx.stroke()
      }
    }
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Desenha roteadores com ícones SVG
    for (const p of pontosArray) {
      const pos = toCanvas(p)

      if (!p.ativo) {
        // Roteador inativo — cinza apagado + X vermelho
        ctx.drawImage(icones.inativo, pos.cx - 10, pos.cy - 10, 20, 20)

        // Desenha X vermelho
        ctx.strokeStyle = '#f43f5e'
        ctx.lineWidth = 1.5
        const s = 5
        ctx.beginPath()
        ctx.moveTo(pos.cx - s, pos.cy - s)
        ctx.lineTo(pos.cx + s, pos.cy + s)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(pos.cx + s, pos.cy - s)
        ctx.lineTo(pos.cx - s, pos.cy + s)
        ctx.stroke()
      } else if (p.id === origemId) {
        // Roteador de origem — verde
        ctx.shadowColor = '#39ff14'
        ctx.shadowBlur = 12
        ctx.drawImage(icones.origem, pos.cx - 10, pos.cy - 10, 20, 20)
        ctx.shadowBlur = 0

        // Label
        ctx.fillStyle = '#39ff14'
        ctx.font = 'bold 9px "Courier New"'
        ctx.textAlign = 'center'
        ctx.fillText(p.id, pos.cx, pos.cy - 12)
      } else if (p.id === destinoId) {
        // Roteador de destino — vermelho
        ctx.shadowColor = '#f43f5e'
        ctx.shadowBlur = 12
        ctx.drawImage(icones.destino, pos.cx - 10, pos.cy - 10, 20, 20)
        ctx.shadowBlur = 0

        // Label
        ctx.fillStyle = '#f43f5e'
        ctx.font = 'bold 9px "Courier New"'
        ctx.textAlign = 'center'
        ctx.fillText(p.id, pos.cx, pos.cy - 12)
      } else if (naoUtilizadosSet.has(p.id)) {
        // Roteador visitado mas não na rota — ícone laranja + X vermelho
        ctx.drawImage(icones.naoUtilizado, pos.cx - 10, pos.cy - 10, 20, 20)

        // Desenha X vermelho
        ctx.strokeStyle = '#f43f5e'
        ctx.lineWidth = 2
        const s = 5
        ctx.beginPath()
        ctx.moveTo(pos.cx - s, pos.cy - s)
        ctx.lineTo(pos.cx + s, pos.cy + s)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(pos.cx + s, pos.cy - s)
        ctx.lineTo(pos.cx - s, pos.cy + s)
        ctx.stroke()
      } else if (rotaSet.has(p.id)) {
        // Roteador na rota — ciano
        ctx.shadowColor = 'rgba(0, 240, 255, 0.5)'
        ctx.shadowBlur = 8
        ctx.drawImage(icones.rota, pos.cx - 10, pos.cy - 10, 20, 20)
        ctx.shadowBlur = 0

        // Label
        ctx.fillStyle = 'rgba(0, 240, 255, 0.8)'
        ctx.font = '8px "Courier New"'
        ctx.textAlign = 'center'
        ctx.fillText(p.id, pos.cx, pos.cy - 12)
      } else {
        // Roteador normal ativo
        ctx.drawImage(icones.normal, pos.cx - 10, pos.cy - 10, 20, 20)
      }
    }
  }

  // Animação do pacote percorrendo a rota
  if (resultado.rota.length < 2) {
    desenharBase()
    return
  }

  const rotaPontos = resultado.rota.map(id => {
    const p = mapa[id]
    return toCanvas(p)
  })

  // Calcula distâncias cumulativas para interpolação
  const distancias = [0]
  for (let i = 1; i < rotaPontos.length; i++) {
    const dx = rotaPontos[i].cx - rotaPontos[i - 1].cx
    const dy = rotaPontos[i].cy - rotaPontos[i - 1].cy
    distancias.push(distancias[i - 1] + Math.sqrt(dx * dx + dy * dy))
  }
  const distTotal = distancias[distancias.length - 1]

  const velocidade = 150 // pixels por segundo
  const duracaoMs = (distTotal / velocidade) * 1000
  const inicio = performance.now()

  function animar(agora) {
    if (animId !== currentAnimationId) return

    const elapsed = agora - inicio
    let progresso = Math.min(elapsed / duracaoMs, 1)

    desenharBase()

    // Calcula posição do pacote por interpolação
    const distAtual = progresso * distTotal
    let segmento = 0
    for (let i = 1; i < distancias.length; i++) {
      if (distAtual <= distancias[i]) {
        segmento = i - 1
        break
      }
    }

    const segLen = distancias[segmento + 1] - distancias[segmento]
    const t = segLen > 0 ? (distAtual - distancias[segmento]) / segLen : 0
    const px = rotaPontos[segmento].cx + (rotaPontos[segmento + 1].cx - rotaPontos[segmento].cx) * t
    const py = rotaPontos[segmento].cy + (rotaPontos[segmento + 1].cy - rotaPontos[segmento].cy) * t

    // Desenha rastro (trail) do pacote
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
    ctx.lineWidth = 3
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let i = 0; i <= segmento; i++) {
      if (i === 0) ctx.moveTo(rotaPontos[i].cx, rotaPontos[i].cy)
      else ctx.lineTo(rotaPontos[i].cx, rotaPontos[i].cy)
    }
    ctx.lineTo(px, py)
    ctx.stroke()
    ctx.setLineDash([])

    // Desenha o pacote (círculo neon brilhante)
    ctx.beginPath()
    ctx.arc(px, py, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#00f0ff'
    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 20
    ctx.fill()
    ctx.shadowBlur = 0

    // Círculo interno branco
    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    if (progresso < 1) {
      animationFrameId = requestAnimationFrame(animar)
    } else {
      // Animação completa — redesenha uma vez mais para estado final
      animationFrameId = null
    }
  }

  animationFrameId = requestAnimationFrame(animar)
}

/**
 * Renderiza a legenda do canvas
 */
function renderizarLegenda() {
  const legend = document.querySelector('.canvas-legend')
  if (!legend) return

  legend.innerHTML = `
    <div class="legend-item"><span class="legend-dot legend-origin"></span>Origem</div>
    <div class="legend-item"><span class="legend-dot legend-destination"></span>Destino</div>
    <div class="legend-item"><span class="legend-dot legend-route"></span>Rota</div>
    <div class="legend-item"><span class="legend-dot legend-visited"></span>Visitado (não usado)</div>
    <div class="legend-item"><span class="legend-dot legend-inactive"></span>Inativo</div>
    <div class="legend-item"><span class="legend-dot legend-normal"></span>Ativo</div>
  `
}

/* ===== Renderização do Card de Código ===== */

function buildNetworkCodeLine(prop, value, isHighlight, isLast) {
  const comma = isLast ? '' : '<span class="syn-comma">,</span>'
  const displayValue = escapeHtml(String(value))
  const stringClass = isHighlight ? 'syn-string-network' : 'syn-string'
  const badge = isHighlight ? ' <span class="network-badge">🌐 Rede</span>' : ''

  const isNumeric = typeof value === 'number'
  const isArray = Array.isArray(value)

  let valueHTML
  if (isArray) {
    const items = value.map(v => `<span class="syn-string">'${escapeHtml(String(v))}'</span>`).join(', ')
    valueHTML = `[${items}]`
  } else if (isNumeric) {
    valueHTML = `<span class="syn-number">${displayValue}</span>`
  } else {
    valueHTML = `<span class="${stringClass}">'${displayValue}'</span>`
  }

  return `  <span class="syn-prop">${escapeHtml(prop)}</span>: ${valueHTML}${badge}${comma}`
}

/**
 * Renderiza a tabela comparativa entre Dijkstra e Greedy
 */
function renderizarComparacao(resDijkstra, resGreedy) {
  if (!networkComparison) return

  const dijkstraOk = resDijkstra.rota.length > 0
  const greedyOk = resGreedy.rota.length > 0

  networkComparison.innerHTML = `
    <div class="comparison-card">
      <div class="comparison-header">
        <span class="comparison-icon">📊</span>
        <span class="comparison-title">COMPARAÇÃO DE ALGORITMOS</span>
      </div>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Métrica</th>
            <th>Dijkstra</th>
            <th>Greedy (Guloso)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Status</td>
            <td class="${dijkstraOk ? 'status-ok' : 'status-fail'}">${dijkstraOk ? '✅ Rota encontrada' : '❌ Sem rota'}</td>
            <td class="${greedyOk ? 'status-ok' : 'status-fail'}">${greedyOk ? '✅ Rota encontrada' : '❌ Sem rota'}</td>
          </tr>
          <tr>
            <td>Custo Total</td>
            <td>${dijkstraOk ? resDijkstra.custoTotal.toFixed(2) : '—'}</td>
            <td>${greedyOk ? resGreedy.custoTotal.toFixed(2) : '—'}</td>
          </tr>
          <tr>
            <td>Nº de Saltos</td>
            <td>${dijkstraOk ? (resDijkstra.rota.length - 1) : '—'}</td>
            <td>${greedyOk ? (resGreedy.rota.length - 1) : '—'}</td>
          </tr>
          <tr>
            <td>Nós Visitados</td>
            <td>${resDijkstra.visitados.length}</td>
            <td>${resGreedy.visitados.length}</td>
          </tr>
          <tr>
            <td>Nós Descartados</td>
            <td>${resDijkstra.naoUtilizados.length}</td>
            <td>${resGreedy.naoUtilizados.length}</td>
          </tr>
          <tr>
            <td>Rota</td>
            <td class="rota-cell">${dijkstraOk ? resDijkstra.rota.join(' → ') : '—'}</td>
            <td class="rota-cell">${greedyOk ? resGreedy.rota.join(' → ') : '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
}

/* ===== Controles da Interface ===== */

/**
 * Popula os selects de origem e destino com roteadores ativos
 */
export function popularControles() {
  const selectOrigem = document.getElementById('select-origem')
  const selectDestino = document.getElementById('select-destino')

  if (!selectOrigem || !selectDestino) return

  const ativos = points.filter(p => p.ativo).sort((a, b) => {
    const numA = parseInt(a.id.replace('R', ''))
    const numB = parseInt(b.id.replace('R', ''))
    return numA - numB
  })

  for (const p of ativos) {
    const optO = document.createElement('option')
    optO.value = p.id
    optO.textContent = `${p.id} — ${p.nome} (${p.ip})`
    selectOrigem.appendChild(optO)

    const optD = document.createElement('option')
    optD.value = p.id
    optD.textContent = `${p.id} — ${p.nome} (${p.ip})`
    selectDestino.appendChild(optD)
  }

  // Seleciona valores padrão diferentes
  if (ativos.length >= 2) {
    selectOrigem.value = ativos[0].id
    selectDestino.value = ativos[ativos.length - 1].id
  }
}

/* ===== Função Principal de Renderização ===== */

/**
 * Renderiza a Camada de Rede.
 * Monta o objeto de rede, exibe o card formatado, desenha o canvas e compara algoritmos.
 */
export function renderNetworkLayer(transportPacket, origemId, destinoId, algoritmo) {
  if (!networkContainer) return null

  // Executa ambos os algoritmos para comparação
  const resDijkstra = dijkstra(origemId, destinoId, points)
  const resGreedy = greedy(origemId, destinoId, points)

  // Seleciona o resultado do algoritmo escolhido
  const resultado = algoritmo === 'greedy' ? resGreedy : resDijkstra

  const mapa = buildPointsMap(points)
  const origemRouter = mapa[origemId]
  const destinoRouter = mapa[destinoId]

  const networkObj = {
    ipOrigem: origemRouter ? origemRouter.ip : '10.0.0.?',
    ipDestino: destinoRouter ? destinoRouter.ip : '10.0.0.?',
    algoritmo: algoritmo,
    rota: resultado.rota,
    custoTotal: resultado.custoTotal,
    ttl: resultado.rota.length > 0 ? resultado.rota.length - 1 : 0
  }

  const highlightFields = ['ipOrigem', 'ipDestino', 'algoritmo']

  const fields = Object.keys(networkObj)
  const lines = fields.map((prop, i) => {
    const isHighlight = highlightFields.includes(prop)
    const isLast = i === fields.length - 1
    return buildNetworkCodeLine(prop, networkObj[prop], isHighlight, isLast)
  })

  const codeHTML = `<span class="syn-keyword">const</span> <span class="syn-var-name">rede</span> <span class="syn-brace">=</span> <span class="syn-brace">{</span>
${lines.join('\n')}
<span class="syn-brace">}</span><span class="syn-semicolon">;</span>`

  const statusRota = resultado.rota.length > 0
    ? `<span class="network-status-ok">✅ ${resultado.rota.length - 1} saltos</span>`
    : '<span class="network-status-fail">❌ Sem rota</span>'

  const cardHTML = `
    <div class="network-card">
      <div class="network-card-header">
        <span class="network-card-icon">🌐</span>
        <span class="network-card-type">PACOTE IP — ${escapeHtml(algoritmo.toUpperCase())}</span>
        <span class="network-status-indicator">
          <span class="network-pulse"></span>
          ROTEADO
        </span>
      </div>
      <pre class="network-code-block">${codeHTML}</pre>
      <div class="network-route-section">
        <div class="network-route-label">Resultado do Roteamento (${escapeHtml(algoritmo.toUpperCase())})</div>
        <div class="network-route-detail">
          <span class="network-route-item">
            <span class="network-route-icon">📍</span>
            Origem: <strong>${escapeHtml(origemId)}</strong> (${escapeHtml(origemRouter?.ip || '?')})
          </span>
          <span class="network-route-item">
            <span class="network-route-icon">🎯</span>
            Destino: <strong>${escapeHtml(destinoId)}</strong> (${escapeHtml(destinoRouter?.ip || '?')})
          </span>
          <span class="network-route-item">
            <span class="network-route-icon">📏</span>
            Custo: <strong>${networkObj.custoTotal}</strong> | TTL: <strong>${networkObj.ttl}</strong> | ${statusRota}
          </span>
        </div>
      </div>
      <div class="network-note">
        <span class="network-note-icon">⚡</span>
        Pacote IP montado com sucesso. O algoritmo <span style="color:#f43f5e;font-weight:bold;">${escapeHtml(algoritmo)}</span> calculou a rota entre os roteadores, determinando o caminho ${algoritmo === 'dijkstra' ? 'ótimo (menor custo)' : 'guloso (mais próximo do destino a cada passo)'}. O pacote será transmitido através de ${networkObj.ttl} saltos na rede.
      </div>
    </div>
  `

  networkContainer.innerHTML = cardHTML
  if (networkSection) networkSection.classList.remove('hidden')

  // Desenha o canvas com a visualização da rede
  if (networkCanvasWrapper) networkCanvasWrapper.style.display = 'block'
  desenharCanvas(resultado, origemId, destinoId, points)
  renderizarLegenda()

  // Renderiza a comparação dos dois algoritmos
  renderizarComparacao(resDijkstra, resGreedy)

  return networkObj
}

export function clearNetworkLayer() {
  if (networkContainer) networkContainer.innerHTML = ''
  if (networkSection) networkSection.classList.add('hidden')
  if (networkComparison) networkComparison.innerHTML = ''
  if (networkCanvasWrapper) networkCanvasWrapper.style.display = 'none'

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}
