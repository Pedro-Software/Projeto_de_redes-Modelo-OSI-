/* ===== Utilitário MD5 — Hash puro em JavaScript ===== */

/**
 * Implementação pura do algoritmo MD5 (RFC 1321) em JavaScript.
 * Não depende de nenhuma biblioteca externa, CDN ou framework.
 * Retorna um hash hexadecimal de 32 caracteres em minúsculo.
 *
 * Uso:
 *   import { md5 } from './md5.js'
 *   const hash = md5('texto qualquer')
 *
 * @param {string} input — string de entrada a ser hashada
 * @returns {string} — hash MD5 hexadecimal (32 caracteres, minúsculo)
 */
export function md5(input) {
  /**
   * Funções auxiliares de rotação e operações bitwise.
   * Todas operam com inteiros de 32 bits (simulados via operador >>> 0).
   */
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }

  function bitRotateLeft(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt))
  }

  // Funções F, G, H, I — lógica central do MD5
  function md5cmn(q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  }

  function md5ff(a, b, c, d, x, s, t) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t)
  }

  function md5gg(a, b, c, d, x, s, t) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
  }

  function md5hh(a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t)
  }

  function md5ii(a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t)
  }

  /**
   * Converte a string de entrada para um array de words de 32 bits
   * usando codificação UTF-8, aplica o padding conforme RFC 1321.
   */
  function str2binl(str) {
    // Converte para bytes UTF-8
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
      if (code < 0x80) {
        bytes.push(code)
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6))
        bytes.push(0x80 | (code & 0x3f))
      } else if (code < 0x10000) {
        bytes.push(0xe0 | (code >> 12))
        bytes.push(0x80 | ((code >> 6) & 0x3f))
        bytes.push(0x80 | (code & 0x3f))
      } else {
        bytes.push(0xf0 | (code >> 18))
        bytes.push(0x80 | ((code >> 12) & 0x3f))
        bytes.push(0x80 | ((code >> 6) & 0x3f))
        bytes.push(0x80 | (code & 0x3f))
      }
    }

    const bitLength = bytes.length * 8
    // Converte bytes para words little-endian
    const words = []
    for (let i = 0; i < bytes.length; i++) {
      words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << ((i % 4) * 8))
    }

    // Padding: adiciona bit '1' seguido de zeros
    words[bytes.length >> 2] = (words[bytes.length >> 2] || 0) | (0x80 << ((bytes.length % 4) * 8))

    // Preenche até 2 words antes do final do bloco de 16 words
    const totalWords = (((bytes.length + 8) >> 6) + 1) * 16
    for (let i = (bytes.length >> 2) + 1; i < totalWords; i++) {
      words[i] = 0
    }

    // Adiciona o comprimento original em bits (64 bits, little-endian)
    words[totalWords - 2] = bitLength & 0xffffffff
    words[totalWords - 1] = Math.floor(bitLength / 0x100000000)

    return words
  }

  /**
   * Processa os blocos de 16 words e retorna o hash final como array de 4 words.
   */
  function binl2md5(x) {
    let a = 0x67452301
    let b = 0xefcdab89
    let c = 0x98badcfe
    let d = 0x10325476

    for (let i = 0; i < x.length; i += 16) {
      const olda = a
      const oldb = b
      const oldc = c
      const oldd = d

      // Rodada 1 (FF)
      a = md5ff(a, b, c, d, x[i],      7, -680876936)
      d = md5ff(d, a, b, c, x[i + 1],  12, -389564586)
      c = md5ff(c, d, a, b, x[i + 2],  17, 606105819)
      b = md5ff(b, c, d, a, x[i + 3],  22, -1044525330)
      a = md5ff(a, b, c, d, x[i + 4],  7, -176418897)
      d = md5ff(d, a, b, c, x[i + 5],  12, 1200080426)
      c = md5ff(c, d, a, b, x[i + 6],  17, -1473231341)
      b = md5ff(b, c, d, a, x[i + 7],  22, -45705983)
      a = md5ff(a, b, c, d, x[i + 8],  7, 1770035416)
      d = md5ff(d, a, b, c, x[i + 9],  12, -1958414417)
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

      // Rodada 2 (GG)
      a = md5gg(a, b, c, d, x[i + 1],  5, -165796510)
      d = md5gg(d, a, b, c, x[i + 6],  9, -1069501632)
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
      b = md5gg(b, c, d, a, x[i],      20, -373897302)
      a = md5gg(a, b, c, d, x[i + 5],  5, -701558691)
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
      b = md5gg(b, c, d, a, x[i + 4],  20, -405537848)
      a = md5gg(a, b, c, d, x[i + 9],  5, 568446438)
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
      c = md5gg(c, d, a, b, x[i + 3],  14, -187363961)
      b = md5gg(b, c, d, a, x[i + 8],  20, 1163531501)
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
      d = md5gg(d, a, b, c, x[i + 2],  9, -51403784)
      c = md5gg(c, d, a, b, x[i + 7],  14, 1735328473)
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

      // Rodada 3 (HH)
      a = md5hh(a, b, c, d, x[i + 5],  4, -378558)
      d = md5hh(d, a, b, c, x[i + 8],  11, -2022574463)
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
      a = md5hh(a, b, c, d, x[i + 1],  4, -1530992060)
      d = md5hh(d, a, b, c, x[i + 4],  11, 1272893353)
      c = md5hh(c, d, a, b, x[i + 7],  16, -155497632)
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
      d = md5hh(d, a, b, c, x[i + 0],  11, -358537222)
      c = md5hh(c, d, a, b, x[i + 3],  16, -722521979)
      b = md5hh(b, c, d, a, x[i + 6],  23, 76029189)
      a = md5hh(a, b, c, d, x[i + 9],  4, -640364487)
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
      b = md5hh(b, c, d, a, x[i + 2],  23, -995338651)

      // Rodada 4 (II)
      a = md5ii(a, b, c, d, x[i],      6, -198630844)
      d = md5ii(d, a, b, c, x[i + 7],  10, 1126891415)
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
      b = md5ii(b, c, d, a, x[i + 5],  21, -57434055)
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
      d = md5ii(d, a, b, c, x[i + 3],  10, -1894986606)
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
      b = md5ii(b, c, d, a, x[i + 1],  21, -2054922799)
      a = md5ii(a, b, c, d, x[i + 8],  6, 1873313359)
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
      c = md5ii(c, d, a, b, x[i + 6],  15, -1560198380)
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
      a = md5ii(a, b, c, d, x[i + 4],  6, -145523070)
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
      c = md5ii(c, d, a, b, x[i + 2],  15, 718787259)
      b = md5ii(b, c, d, a, x[i + 9],  21, -343485551)

      a = safeAdd(a, olda)
      b = safeAdd(b, oldb)
      c = safeAdd(c, oldc)
      d = safeAdd(d, oldd)
    }

    return [a, b, c, d]
  }

  /**
   * Converte o array de 4 words de 32 bits para string hexadecimal.
   */
  function binl2hex(binarray) {
    const hexTab = '0123456789abcdef'
    let str = ''
    for (let i = 0; i < binarray.length * 32; i += 8) {
      str += hexTab.charAt((binarray[i >> 5] >>> (i % 32)) & 0xf)
      str += hexTab.charAt((binarray[i >> 5] >>> (i % 32 + 4)) & 0xf)
    }
    return str
  }

  // Executa o pipeline completo: string → words → MD5 → hex
  return binl2hex(binl2md5(str2binl(input)))
}
