/**
 * Client-side executive A4 PDF submission dossier generator.
 * Ensures participant PDF downloads work cleanly on static hosting
 * without requiring a backend POST /api/admin/submissions/pdf server.
 */

const TRANSLIT_MAP = {
  "ą": "a", "Ą": "A",
  "č": "c", "Č": "C",
  "ę": "e", "Ę": "E",
  "ė": "e", "Ė": "E",
  "į": "i", "Į": "I",
  "š": "s", "Š": "S",
  "ų": "u", "Ų": "U",
  "ū": "u", "Ū": "U",
  "ž": "z", "Ž": "Z",
  "ł": "l", "Ł": "L",
  "ń": "n", "Ń": "N",
  "ó": "o", "Ó": "O",
  "ś": "s", "Ś": "S",
  "ź": "z", "Ź": "Z",
  "ż": "z", "Ż": "Z"
};

export function transliteratePdfSlug(input, maxLen = 44) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  let mapped = "";
  for (const ch of raw) {
    mapped += TRANSLIT_MAP[ch] || ch;
  }
  return mapped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLen)
    .replace(/_+$/g, "");
}

export function buildReadablePdfFilename(entry = {}) {
  if (entry.pdfFilename && /\.pdf$/i.test(String(entry.pdfFilename).trim())) {
    return String(entry.pdfFilename).trim();
  }
  const first = String(entry.directorFirstName || "").trim();
  const last = String(entry.directorLastName || "").trim();
  const combinedName = `${first} ${last}`.trim() || String(entry.name || entry.directorName || "").trim();
  const filmTitle = String(entry.filmTitle || "").trim();

  const pupilSlug = transliteratePdfSlug(combinedName, 40);
  const filmSlug = transliteratePdfSlug(filmTitle, 48);

  if (pupilSlug && filmSlug) return `${pupilSlug}_-_${filmSlug}.pdf`;
  if (pupilSlug) return `${pupilSlug}.pdf`;
  if (filmSlug) return `${filmSlug}.pdf`;
  return `AISFF_${entry.id || "Submission"}.pdf`;
}

function splitRoleNames(first, last, combined) {
  const f = String(first || "").trim();
  const l = String(last || "").trim();
  if (f || l) return { first: f || "—", last: l || "—" };
  const full = String(combined || "").trim();
  if (!full) return { first: "—", last: "—" };
  const parts = full.split(/\s+/);
  return { first: parts[0] || "—", last: parts.slice(1).join(" ") || "—" };
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n || isNaN(n) || n <= 0) return "—";
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatSubmittedTimestamp(raw) {
  if (!raw) return "—";
  if (typeof raw === "object" && typeof raw.toDate === "function") {
    try {
      return raw.toDate().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    } catch {
      return "—";
    }
  }
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
    }
  } catch {
    // ignore
  }
  return String(raw);
}

function base64ToUint8Array(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function concatUint8Arrays(arrays) {
  const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/**
 * Packs one or more JPEG-encoded canvas pages into a valid binary PDF 1.4 document (A4 portrait).
 * Each page entry is { jpegBytes: Uint8Array, pixelWidth: number, pixelHeight: number }.
 */
export function buildPdfFromJpegPages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error("PDF generator requires at least one page.");
  }

  const encoder = new TextEncoder();
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;

  // Object layout:
  // 1: Catalog
  // 2: Pages
  // For page i (0..N-1): base = 3 + i * 3
  //   base + 0: Page object
  //   base + 1: Image XObject (/DCTDecode)
  //   base + 2: Content stream drawing Image full A4 page
  const pageIds = pages.map((_, idx) => 3 + idx * 3);
  const totalObjects = 2 + pages.length * 3;
  const chunks = [];
  const offsets = new Array(totalObjects + 1).fill(0);
  let bytePos = 0;

  const pushStr = (str) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    bytePos += bytes.length;
  };
  const pushBytes = (bytes) => {
    chunks.push(bytes);
    bytePos += bytes.length;
  };

  pushStr("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  const writeObject = (id, bodyParts) => {
    offsets[id] = bytePos;
    pushStr(`${id} 0 obj\n`);
    for (const part of bodyParts) {
      if (typeof part === "string") pushStr(part);
      else pushBytes(part);
    }
    pushStr("\nendobj\n");
  };

  writeObject(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  writeObject(2, [`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`]);

  pages.forEach((p, idx) => {
    const pageId = 3 + idx * 3;
    const imgId = pageId + 1;
    const contentId = pageId + 2;
    const imgName = `/Im${idx + 1}`;
    const streamCmd = `q\n${PAGE_W.toFixed(2)} 0 0 ${PAGE_H.toFixed(2)} 0 0 cm\n${imgName} Do\nQ\n`;
    const streamBytes = encoder.encode(streamCmd);

    writeObject(pageId, [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] ` +
      `/Resources << /XObject << ${imgName} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`
    ]);

    writeObject(imgId, [
      `<< /Type /XObject /Subtype /Image /Width ${p.pixelWidth} /Height ${p.pixelHeight} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\nstream\n`,
      p.jpegBytes,
      "\nendstream"
    ]);

    writeObject(contentId, [
      `<< /Length ${streamBytes.length} >>\nstream\n`,
      streamBytes,
      "\nendstream"
    ]);
  });

  const xrefOffset = bytePos;
  pushStr(`xref\n0 ${totalObjects + 1}\n`);
  pushStr("0000000000 65535 f \n");
  for (let id = 1; id <= totalObjects; id += 1) {
    pushStr(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return concatUint8Arrays(chunks);
}

function wrapTextLines(ctx, text, maxWidth) {
  const paragraphs = String(text === undefined || text === null || text === "" ? "—" : text).split(/\r?\n/);
  const lines = [];
  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        if (ctx.measureText(word).width <= maxWidth) {
          current = word;
        } else {
          // Hard-break long unspaced URLs or tokens
          let slice = "";
          for (const ch of word) {
            if (ctx.measureText(slice + ch).width > maxWidth && slice) {
              lines.push(slice);
              slice = ch;
            } else {
              slice += ch;
            }
          }
          current = slice;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : ["—"];
}

export async function generateClientSubmissionPdf(submissionData = {}) {
  if (typeof document === "undefined") {
    throw new Error("Client PDF generation requires a browser DOM context.");
  }

  const isLt = submissionData.submissionLang !== "en";
  const filename = buildReadablePdfFilename(submissionData);

  // 150 DPI A4 canvas (595.28pt x 841.89pt scaled ~2.083x)
  const W = 1240;
  const H = 1754;
  const PAD_X = 96;
  const CONTENT_W = W - PAD_X * 2;
  const BOTTOM_LIMIT = H - 108;
  const FONT_STACK = '"Plus Jakarta Sans", "DejaVu Sans", "Segoe UI", Arial, sans-serif';

  const palette = {
    emeraldDark: "#09211B",
    emeraldAccent: "#113939",
    mintAccent: "#6FA58A",
    tintLight: "#F3F7F5",
    rowAlt: "#F8FAFC",
    border: "#CBD5E1",
    textDark: "#0F172A",
    textMuted: "#475569",
    textFaint: "#64748B",
    passText: "#065F46"
  };

  const renderedCanvases = [];
  let canvas = null;
  let ctx = null;
  let curY = 72;

  const createPage = () => {
    canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "top";
    renderedCanvases.push(canvas);
    curY = 72;
  };

  const ensureSpace = (neededH) => {
    if (!ctx || curY + neededH > BOTTOM_LIMIT) {
      createPage();
    }
  };

  createPage();

  const subId = String(submissionData.id || "—");
  const submittedFormatted = formatSubmittedTimestamp(submissionData.submittedAt || new Date().toISOString());
  const directorRoles = splitRoleNames(
    submissionData.directorFirstName,
    submissionData.directorLastName,
    submissionData.directorName || submissionData.name
  );
  const pupilFullName = `${directorRoles.first} ${directorRoles.last !== "—" ? directorRoles.last : ""}`.trim();

  // Top Banner
  const bannerTop = 68;
  const bannerH = 162;
  ctx.fillStyle = palette.emeraldDark;
  ctx.fillRect(PAD_X, bannerTop, CONTENT_W, bannerH);
  ctx.fillStyle = palette.mintAccent;
  ctx.fillRect(PAD_X, bannerTop + bannerH - 6, CONTENT_W, 6);

  ctx.fillStyle = palette.mintAccent;
  ctx.font = `700 18px ${FONT_STACK}`;
  ctx.fillText("AISFF  •  ĄŽUOLYNAS INTERNATIONAL STUDENTS FILM FESTIVAL", PAD_X + 34, bannerTop + 26, CONTENT_W - 350);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 32px ${FONT_STACK}`;
  ctx.fillText(isLt ? "OFICIALI FILMO PARAIŠKOS BYLA" : "OFFICIAL FILM SUBMISSION DOSSIER", PAD_X + 34, bannerTop + 56, CONTENT_W - 350);

  const filmSubtitle = String(submissionData.filmTitle || (isLt ? "Konkursinis filmas" : "Competition Film"));
  ctx.fillStyle = "#CBD5E1";
  ctx.font = `400 20px ${FONT_STACK}`;
  ctx.fillText(`${filmSubtitle}  •  ${pupilFullName}`, PAD_X + 34, bannerTop + 106, CONTENT_W - 350);

  // Right badge
  const badgeW = 286;
  const badgeX = PAD_X + CONTENT_W - badgeW - 28;
  ctx.fillStyle = "#103128";
  ctx.fillRect(badgeX, bannerTop + 28, badgeW, 100);
  ctx.fillStyle = palette.mintAccent;
  ctx.font = `700 15px ${FONT_STACK}`;
  ctx.fillText(isLt ? "PARAIŠKOS ID" : "SUBMISSION ID", badgeX + 20, bannerTop + 42, badgeW - 40);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 18px ${FONT_STACK}`;
  ctx.fillText(subId.length > 20 ? subId.slice(0, 20) + "…" : subId, badgeX + 20, bannerTop + 68, badgeW - 40);
  ctx.fillStyle = "#A7F3D0";
  ctx.font = `400 15px ${FONT_STACK}`;
  ctx.fillText(isLt ? "Kalba: LT" : "Language: EN", badgeX + 20, bannerTop + 96, badgeW - 40);

  curY = bannerTop + bannerH + 28;

  // 3 Metadata summary cards
  const colGap = 16;
  const cardW = (CONTENT_W - colGap * 2) / 3;
  const metaCards = [
    { label: isLt ? "PATEIKIMO DATA IR LAIKAS" : "SUBMITTED TIMESTAMP", value: submittedFormatted },
    {
      label: isLt ? "DALYVAVIMAS CEREMONIJOJE" : "CEREMONY ATTENDANCE",
      value: submissionData.attendanceType === "remote"
        ? (isLt ? "Nuotoliniu būdu" : "Remote Stream")
        : (isLt ? "Gyvai Kaune" : "In Person (Kaunas)")
    },
    {
      label: isLt ? "ATSAKYMO TERMINAS" : "RESPONSE WINDOW",
      value: submissionData.responseTimeText || (isLt ? "Per 5 darbo dienas" : "Within 5 business days")
    }
  ];

  metaCards.forEach((item, idx) => {
    const cx = PAD_X + idx * (cardW + colGap);
    ctx.fillStyle = palette.tintLight;
    ctx.fillRect(cx, curY, cardW, 82);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, curY, cardW, 82);

    ctx.fillStyle = palette.emeraldAccent;
    ctx.font = `700 15px ${FONT_STACK}`;
    ctx.fillText(item.label, cx + 18, curY + 16, cardW - 36);
    ctx.fillStyle = palette.textDark;
    ctx.font = `700 18px ${FONT_STACK}`;
    ctx.fillText(item.value, cx + 18, curY + 44, cardW - 36);
  });
  curY += 108;

  const drawSectionTitle = (title) => {
    ensureSpace(88);
    curY += 8;
    ctx.fillStyle = palette.emeraldAccent;
    ctx.font = `700 21px ${FONT_STACK}`;
    ctx.fillText(title.toUpperCase(), PAD_X, curY, CONTENT_W);
    curY += 32;
    ctx.fillStyle = palette.mintAccent;
    ctx.fillRect(PAD_X, curY, CONTENT_W, 2.5);
    curY += 18;
  };

  const drawTwoColumnRows = (rows) => {
    const labelW = 330;
    const valW = CONTENT_W - labelW - 44;
    const lineH = 26;

    rows.forEach((row, idx) => {
      ctx.font = `${row.boldValue ? 700 : 400} 19px ${FONT_STACK}`;
      const valLines = wrapTextLines(ctx, row.value, valW);
      const rowH = Math.max(46, valLines.length * lineH + 22);
      ensureSpace(rowH + 6);

      ctx.fillStyle = idx % 2 === 0 ? "#FFFFFF" : palette.rowAlt;
      ctx.fillRect(PAD_X, curY, CONTENT_W, rowH);
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(PAD_X, curY, CONTENT_W, rowH);

      ctx.fillStyle = palette.textMuted;
      ctx.font = `700 18px ${FONT_STACK}`;
      ctx.fillText(row.label, PAD_X + 20, curY + 13, labelW - 12);

      ctx.fillStyle = row.accent ? palette.passText : palette.textDark;
      ctx.font = `${row.boldValue ? 700 : 400} 19px ${FONT_STACK}`;
      valLines.forEach((ln, lineIdx) => {
        ctx.fillText(ln, PAD_X + labelW + 26, curY + 13 + lineIdx * lineH);
      });

      curY += rowH;
    });
    curY += 22;
  };

  // Section 1: Creative Team
  drawSectionTitle(isLt ? "1. Kūrybinė komanda ir autoriaus kontaktai" : "1. Creative Team & Author Profile");

  const crewRoles = [
    { role: isLt ? "Režisierius / Autorius" : "Director / Author", ...directorRoles },
    { role: isLt ? "Operatorius" : "Camera Operator", ...splitRoleNames(submissionData.cameraOperatorFirstName, submissionData.cameraOperatorLastName, submissionData.cameraOperator) },
    { role: isLt ? "Idėjos autorius" : "Author of the Idea", ...splitRoleNames(submissionData.ideaAuthorFirstName, submissionData.ideaAuthorLastName, submissionData.ideaAuthor) },
    { role: isLt ? "Scenarijaus autorius" : "Screenwriter", ...splitRoleNames(submissionData.screenwriterFirstName, submissionData.screenwriterLastName, submissionData.screenwriter) }
  ];

  const col1W = 340;
  const col2W = (CONTENT_W - col1W) / 2;
  const col3W = CONTENT_W - col1W - col2W;

  ensureSpace(46 + crewRoles.length * 44);
  ctx.fillStyle = palette.emeraldAccent;
  ctx.fillRect(PAD_X, curY, CONTENT_W, 44);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 17px ${FONT_STACK}`;
  ctx.fillText(isLt ? "VAIDMUO" : "ROLE", PAD_X + 20, curY + 13, col1W - 28);
  ctx.fillText(isLt ? "VARDAS" : "FIRST NAME", PAD_X + col1W + 16, curY + 13, col2W - 24);
  ctx.fillText(isLt ? "PAVARDĖ" : "LAST NAME", PAD_X + col1W + col2W + 16, curY + 13, col3W - 24);
  curY += 44;

  crewRoles.forEach((cr, idx) => {
    const h = 44;
    ctx.fillStyle = idx % 2 === 0 ? "#FFFFFF" : palette.rowAlt;
    ctx.fillRect(PAD_X, curY, CONTENT_W, h);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD_X, curY, CONTENT_W, h);

    ctx.fillStyle = palette.textMuted;
    ctx.font = `700 18px ${FONT_STACK}`;
    ctx.fillText(cr.role, PAD_X + 20, curY + 12, col1W - 28);
    ctx.fillStyle = palette.textDark;
    ctx.font = `400 19px ${FONT_STACK}`;
    ctx.fillText(cr.first, PAD_X + col1W + 16, curY + 12, col2W - 24);
    ctx.fillText(cr.last, PAD_X + col1W + col2W + 16, curY + 12, col3W - 24);
    curY += h;
  });
  curY += 16;

  drawTwoColumnRows([
    { label: isLt ? "El. pašto adresas:" : "Email Address:", value: submissionData.email, boldValue: true },
    { label: isLt ? "Amžius ir kategorija:" : "Age & Category:", value: `${submissionData.age || "—"} ${isLt ? "m." : "y/o"}  |  ${submissionData.category || "—"}` },
    { label: isLt ? "Šalis ir miestas:" : "Location (Country / City):", value: submissionData.location || submissionData.countryCity || "—" },
    { label: isLt ? "Mokykla / Kino studija:" : "School / Film Studio:", value: submissionData.institution || "—" }
  ]);

  // Section 2: Film details & synopsis
  drawSectionTitle(isLt ? "2. Filmo informacija, sinopsis ir ceremonija" : "2. Film Details, Synopsis & Ceremony");

  const filmRows = [
    { label: isLt ? "Filmo pavadinimas:" : "Film Title:", value: submissionData.filmTitle, boldValue: true },
    { label: isLt ? "Filmavimo įrenginys:" : "Filming Device:", value: submissionData.deviceModel },
    { label: isLt ? "Paraiškos statusas:" : "Application Status:", value: submissionData.status || "submitted" }
  ];
  if (submissionData.liveToken) {
    filmRows.push({ label: isLt ? "Transliacijos žetonas:" : "Live Stream Token:", value: submissionData.liveToken, boldValue: true });
    filmRows.push({ label: isLt ? "Transliacijos nuoroda:" : "Live Stream URL:", value: submissionData.liveStreamUrl || "—" });
  }
  drawTwoColumnRows(filmRows);

  // Synopsis box
  const synopsisText = String(submissionData.synopsis || "—").trim() || "—";
  ctx.font = `400 19px ${FONT_STACK}`;
  const synLines = wrapTextLines(ctx, synopsisText, CONTENT_W - 52);
  const synBoxH = Math.max(96, synLines.length * 27 + 60);
  ensureSpace(synBoxH + 18);

  ctx.fillStyle = palette.tintLight;
  ctx.fillRect(PAD_X, curY, CONTENT_W, synBoxH);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD_X, curY, CONTENT_W, synBoxH);
  ctx.fillStyle = palette.emeraldAccent;
  ctx.fillRect(PAD_X, curY, 7, synBoxH);

  ctx.fillStyle = palette.emeraldAccent;
  ctx.font = `700 17px ${FONT_STACK}`;
  ctx.fillText(isLt ? "FILMO SINOPSIS / IDĖJA" : "FILM SYNOPSIS / CONCEPT", PAD_X + 24, curY + 16, CONTENT_W - 48);
  ctx.fillStyle = palette.textDark;
  ctx.font = `400 19px ${FONT_STACK}`;
  synLines.forEach((ln, idx) => {
    ctx.fillText(ln, PAD_X + 24, curY + 46 + idx * 27);
  });
  curY += synBoxH + 26;

  // Section 3: Technical specs
  drawSectionTitle(isLt ? "3. Vaizdo įrašo techninė specifikacija ir patikra" : "3. Video Technical Specs & Validation");

  const sourceLabel = submissionData.videoSourceType === "link"
    ? (isLt ? "Išorinė vaizdo nuoroda (URL)" : "External Video Link (URL)")
    : (isLt ? "Įkeltas vaizdo failas" : "Uploaded Video File");
  const fileSizeBytes = submissionData.videoSizeBytes || submissionData.videoFileSizeBytes || 0;
  const validationLabel = submissionData.videoValidationStatus || (isLt ? "ATITINKA REIKALAVIMUS (PASSED)" : "PASSED");

  drawTwoColumnRows([
    { label: isLt ? "Pateikimo būdas:" : "Submission Method:", value: sourceLabel },
    { label: isLt ? "Taisyklių patikra:" : "Validation Result:", value: validationLabel, accent: true, boldValue: true },
    { label: isLt ? "Failo pavadinimas:" : "File Name:", value: submissionData.videoFileName || "—" },
    { label: isLt ? "Failo dydis ir formatas:" : "File Size & Format:", value: `${formatBytes(fileSizeBytes)}${submissionData.videoMimeType ? `  (${submissionData.videoMimeType})` : ""}` },
    { label: isLt ? "Trukmė ir raiška:" : "Duration & Resolution:", value: `${submissionData.videoDurationSeconds ? `${submissionData.videoDurationSeconds} s` : "—"}  |  ${submissionData.videoResolution || "—"}` },
    { label: isLt ? "Vaizdo įrašo nuoroda:" : "Video URL:", value: submissionData.videoUrl || submissionData.videoLink || "—" },
    { label: isLt ? "PDF bylos pavadinimas:" : "Generated PDF Filename:", value: filename }
  ]);

  // Draw page footers & encode pages to JPEG bytes
  const pageCount = renderedCanvases.length;
  const jpegPages = renderedCanvases.map((pgCanvas, idx) => {
    const pCtx = pgCanvas.getContext("2d");
    const footerY = H - 64;
    pCtx.fillStyle = palette.border;
    pCtx.fillRect(PAD_X, footerY - 12, CONTENT_W, 1.5);

    pCtx.fillStyle = palette.textFaint;
    pCtx.font = `400 16px ${FONT_STACK}`;
    pCtx.fillText(
      isLt
        ? "Sugeneruota automatiškai AISFF sistemos • Dokumentas skirtas paraiškos autoriui ir festivalio organizatoriams"
        : "Automatically generated by AISFF • Document for submitting filmmaker and festival organizers",
      PAD_X,
      footerY,
      CONTENT_W - 120
    );

    pCtx.fillStyle = palette.textMuted;
    pCtx.font = `700 16px ${FONT_STACK}`;
    const pageNumText = `${idx + 1} / ${pageCount}`;
    const numW = pCtx.measureText(pageNumText).width;
    pCtx.fillText(pageNumText, PAD_X + CONTENT_W - numW, footerY);

    const dataUrl = pgCanvas.toDataURL("image/jpeg", 0.92);
    const base64 = dataUrl.split(",")[1];
    return {
      jpegBytes: base64ToUint8Array(base64),
      pixelWidth: W,
      pixelHeight: H
    };
  });

  const pdfBytes = buildPdfFromJpegPages(jpegPages);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return { blob, filename, pageCount };
}
