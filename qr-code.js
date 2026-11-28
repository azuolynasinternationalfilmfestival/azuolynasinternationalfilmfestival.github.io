/**
 * Ąžuolynas Film Festival - Standalone Client-Side ISO/IEC 18004 QR Code Generator
 * Generates standards-compliant Byte-mode QR Codes (ECC Level M, Versions 1–10)
 * for live stream links with zero external dependencies.
 */
(function (window) {
  "use strict";

  // EC Level M tables (ISO/IEC 18004 Tables 7 & 9) for Versions 1..10
  // [totalCodewords, ecPerBlock, g1Blocks, g1DataCw, g2Blocks, g2DataCw, alignCenters]
  const VERSION_SPECS = [
    null,
    [26, 10, 1, 16, 0, 0, []],
    [44, 16, 1, 28, 0, 0, [6, 18]],
    [70, 26, 1, 44, 0, 0, [6, 22]],
    [100, 18, 2, 32, 0, 0, [6, 26]],
    [134, 24, 2, 43, 0, 0, [6, 30]],
    [172, 16, 4, 27, 0, 0, [6, 34]],
    [196, 18, 4, 31, 0, 0, [6, 22, 38]],
    [242, 22, 2, 38, 2, 39, [6, 24, 42]],
    [292, 22, 3, 36, 2, 37, [6, 26, 46]],
    [346, 26, 4, 43, 1, 44, [6, 28, 50]]
  ];

  // GF(256) arithmetic tables (primitive polynomial 0x11d)
  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  (() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
      GF_EXP[i] = GF_EXP[i - 255];
    }
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const root = GF_EXP[i];
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], root);
      }
      poly = next;
    }
    return poly;
  }

  function rsComputeRemainder(data, ecCount) {
    const gen = rsGeneratorPoly(ecCount);
    const res = new Uint8Array(ecCount);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ res[0];
      res.copyWithin(0, 1);
      res[ecCount - 1] = 0;
      if (factor !== 0) {
        for (let j = 0; j < ecCount; j++) {
          res[j] ^= gfMul(gen[j + 1], factor);
        }
      }
    }
    return res;
  }

  function toUtf8Bytes(str) {
    const input = String(str ?? "");
    if (typeof TextEncoder !== "undefined") {
      return Array.from(new TextEncoder().encode(input));
    }
    const bytes = [];
    for (let i = 0; i < input.length; i++) {
      let c = input.charCodeAt(i);
      if (c < 0x80) {
        bytes.push(c);
      } else if (c < 0x800) {
        bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else {
        bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return bytes;
  }

  function pickVersion(byteLength) {
    for (let v = 1; v < VERSION_SPECS.length; v++) {
      const spec = VERSION_SPECS[v];
      const dataCodewords = spec[2] * spec[3] + spec[4] * spec[5];
      const headerBits = v >= 10 ? 20 : 12; // 4-bit mode + 8/16-bit length
      if (headerBits + byteLength * 8 <= dataCodewords * 8) {
        return v;
      }
    }
    return VERSION_SPECS.length - 1;
  }

  function buildCodewords(bytes, version) {
    const spec = VERSION_SPECS[version];
    const [, ecPerBlock, g1Blocks, g1DataCw, g2Blocks, g2DataCw] = spec;
    const totalDataCw = g1Blocks * g1DataCw + g2Blocks * g2DataCw;
    const countBits = version >= 10 ? 16 : 8;
    const maxBytes = Math.floor((totalDataCw * 8 - (4 + countBits)) / 8);
    const payload = bytes.slice(0, Math.max(0, maxBytes));

    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) {
        bits.push((val >>> i) & 1);
      }
    };

    pushBits(0b0100, 4); // Byte mode
    pushBits(payload.length, countBits);
    for (let i = 0; i < payload.length; i++) {
      pushBits(payload[i], 8);
    }

    const totalDataBits = totalDataCw * 8;
    const termLen = Math.min(4, totalDataBits - bits.length);
    for (let i = 0; i < termLen; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const dataCw = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      dataCw.push(b);
    }
    const padBytes = [0xec, 0x11];
    let padIdx = 0;
    while (dataCw.length < totalDataCw) {
      dataCw.push(padBytes[padIdx % 2]);
      padIdx++;
    }

    // Split into blocks and compute RS error correction codewords
    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let i = 0; i < g1Blocks; i++) {
      const blk = dataCw.slice(offset, offset + g1DataCw);
      offset += g1DataCw;
      dataBlocks.push(blk);
      ecBlocks.push(rsComputeRemainder(blk, ecPerBlock));
    }
    for (let i = 0; i < g2Blocks; i++) {
      const blk = dataCw.slice(offset, offset + g2DataCw);
      offset += g2DataCw;
      dataBlocks.push(blk);
      ecBlocks.push(rsComputeRemainder(blk, ecPerBlock));
    }

    // Interleave data codewords, then EC codewords
    const result = [];
    const maxDataLen = Math.max(g1DataCw, g2DataCw || 0);
    for (let i = 0; i < maxDataLen; i++) {
      for (let b = 0; b < dataBlocks.length; b++) {
        if (i < dataBlocks[b].length) result.push(dataBlocks[b][i]);
      }
    }
    for (let i = 0; i < ecPerBlock; i++) {
      for (let b = 0; b < ecBlocks.length; b++) {
        result.push(ecBlocks[b][i]);
      }
    }
    return result;
  }

  function bchFormatBits(maskPattern) {
    // EC Level M = 00
    const data = (0b00 << 3) | (maskPattern & 7);
    let rem = data << 10;
    for (let i = 4; i >= 0; i--) {
      if (rem & (1 << (i + 10))) rem ^= 0x537 << i;
    }
    return ((data << 10) | rem) ^ 0x5412;
  }

  function bchVersionBits(version) {
    let rem = version << 12;
    for (let i = 5; i >= 0; i--) {
      if (rem & (1 << (i + 12))) rem ^= 0x1f25 << i;
    }
    return (version << 12) | rem;
  }

  function createBaseMatrix(version) {
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => new Uint8Array(size));
    const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

    const setFunc = (r, c, dark) => {
      if (r < 0 || r >= size || c < 0 || c >= size) return;
      modules[r][c] = dark ? 1 : 0;
      isFunc[r][c] = 1;
    };

    const drawFinderWithSeparator = (topR, leftC) => {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = topR + dr;
          const c = leftC + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
          const isBorder = inOuter && (dr === 0 || dr === 6 || dc === 0 || dc === 6);
          const isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          setFunc(r, c, isBorder || isCenter);
        }
      }
    };

    drawFinderWithSeparator(0, 0);
    drawFinderWithSeparator(0, size - 7);
    drawFinderWithSeparator(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    // Dark module
    setFunc(4 * version + 9, 8, true);

    // Alignment patterns
    const centers = VERSION_SPECS[version][6];
    for (let i = 0; i < centers.length; i++) {
      for (let j = 0; j < centers.length; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === centers.length - 1) || (i === centers.length - 1 && j === 0)) {
          continue;
        }
        const cr = centers[i];
        const cc = centers[j];
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            setFunc(cr + dr, cc + dc, dark);
          }
        }
      }
    }

    // Reserve format info cells
    for (let i = 0; i <= 8; i++) {
      if (i !== 6) {
        isFunc[8][i] = 1;
        isFunc[i][8] = 1;
      }
    }
    for (let i = 0; i < 8; i++) {
      isFunc[8][size - 1 - i] = 1;
      if (i < 7) isFunc[size - 1 - i][8] = 1;
    }

    // Version info for >= 7
    if (version >= 7) {
      const vBits = bchVersionBits(version);
      for (let i = 0; i < 18; i++) {
        const bit = (vBits >>> i) & 1;
        const r = Math.floor(i / 3);
        const c = size - 11 + (i % 3);
        setFunc(r, c, bit === 1);
        setFunc(c, r, bit === 1);
      }
    }

    return { size, modules, isFunc };
  }

  function applyFormatInfo(modules, size, maskPattern) {
    const fmt = bchFormatBits(maskPattern);
    for (let i = 0; i < 15; i++) {
      const bit = (fmt >>> i) & 1;
      // Vertical strip
      if (i < 6) modules[i][8] = bit;
      else if (i < 8) modules[i + 1][8] = bit;
      else modules[size - 15 + i][8] = bit;
      // Horizontal strip
      if (i < 8) modules[8][size - 1 - i] = bit;
      else if (i < 9) modules[8][15 - i] = bit;
      else modules[8][14 - i] = bit;
    }
  }

  function placeCodewords(modules, isFunc, size, codewords) {
    let bitIdx = 0;
    const totalBits = codewords.length * 8;
    let upward = true;

    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let step = 0; step < size; step++) {
        const r = upward ? size - 1 - step : step;
        for (let j = 0; j < 2; j++) {
          const c = right - j;
          if (isFunc[r][c]) continue;
          let dark = 0;
          if (bitIdx < totalBits) {
            dark = (codewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          modules[r][c] = dark;
        }
      }
      upward = !upward;
    }
  }

  const MASK_FNS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
    (r, c) => (((r * c) % 2 + (r * c) % 3) % 2) === 0,
    (r, c) => (((r + c) % 2 + (r * c) % 3) % 2) === 0
  ];

  function evaluatePenalty(modules, size) {
    let penalty = 0;
    // N1: adjacent same color in rows/cols
    for (let r = 0; r < size; r++) {
      let runColor = modules[r][0];
      let runLen = 1;
      for (let c = 1; c < size; c++) {
        if (modules[r][c] === runColor) {
          runLen++;
          if (runLen === 5) penalty += 3;
          else if (runLen > 5) penalty += 1;
        } else {
          runColor = modules[r][c];
          runLen = 1;
        }
      }
    }
    for (let c = 0; c < size; c++) {
      let runColor = modules[0][c];
      let runLen = 1;
      for (let r = 1; r < size; r++) {
        if (modules[r][c] === runColor) {
          runLen++;
          if (runLen === 5) penalty += 3;
          else if (runLen > 5) penalty += 1;
        } else {
          runColor = modules[r][c];
          runLen = 1;
        }
      }
    }
    // N2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = modules[r][c];
        if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) {
          penalty += 3;
        }
      }
    }
    // N4: dark ratio balance
    let darkCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (modules[r][c]) darkCount++;
      }
    }
    const percent = Math.floor((darkCount * 100) / (size * size));
    const prev5 = Math.abs(Math.floor(percent / 5) * 5 - 50) / 5;
    const next5 = Math.abs(Math.ceil(percent / 5) * 5 - 50) / 5;
    penalty += Math.min(prev5, next5) * 10;
    return penalty;
  }

  function encodeMatrix(text) {
    const bytes = toUtf8Bytes(text);
    const version = pickVersion(bytes.length);
    const codewords = buildCodewords(bytes, version);
    const base = createBaseMatrix(version);
    placeCodewords(base.modules, base.isFunc, base.size, codewords);

    let bestPenalty = Infinity;
    let bestModules = null;
    for (let m = 0; m < 8; m++) {
      const candidate = base.modules.map(row => new Uint8Array(row));
      const maskFn = MASK_FNS[m];
      for (let r = 0; r < base.size; r++) {
        for (let c = 0; c < base.size; c++) {
          if (!base.isFunc[r][c] && maskFn(r, c)) {
            candidate[r][c] ^= 1;
          }
        }
      }
      applyFormatInfo(candidate, base.size, m);
      const p = evaluatePenalty(candidate, base.size);
      if (p < bestPenalty) {
        bestPenalty = p;
        bestModules = candidate;
      }
    }

    return {
      version,
      size: base.size,
      modules: bestModules
    };
  }

  function renderQrCode(text, container, options = {}) {
    if (!container) return;
    const size = options.size || 220;
    container.innerHTML = "";

    const qr = encodeMatrix(text);
    const quietModules = 4;
    const totalModules = qr.size + quietModules * 2;
    const cellSize = Math.max(2, Math.floor(size / totalModules));
    const canvasSize = totalModules * cellSize;

    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.imageRendering = "pixelated";
    canvas.style.borderRadius = "4px";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "QR kodas tiesioginės transliacijos nuorodai");

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = options.colorDark || "#041310";
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.modules[r][c]) {
          ctx.fillRect((quietModules + c) * cellSize, (quietModules + r) * cellSize, cellSize, cellSize);
        }
      }
    }

    container.appendChild(canvas);
    return qr;
  }

  window.FestivalQR = {
    render: renderQrCode,
    encodeMatrix
  };
})(window);
