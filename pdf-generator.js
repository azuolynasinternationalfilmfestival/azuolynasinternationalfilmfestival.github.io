import PDFDocument from 'pdfkit';
import fs from 'node:fs';

const FONT_REGULAR_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const FONT_BOLD_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

const TRANSLIT_MAP = {
  'ą': 'a', 'Ą': 'A',
  'č': 'c', 'Č': 'C',
  'ę': 'e', 'Ę': 'E',
  'ė': 'e', 'Ė': 'E',
  'į': 'i', 'Į': 'I',
  'š': 's', 'Š': 'S',
  'ų': 'u', 'Ų': 'U',
  'ū': 'u', 'Ū': 'U',
  'ž': 'z', 'Ž': 'Z',
  'ł': 'l', 'Ł': 'L',
  'ń': 'n', 'Ń': 'N',
  'ó': 'o', 'Ó': 'O',
  'ś': 's', 'Ś': 'S',
  'ź': 'z', 'Ź': 'Z',
  'ż': 'z', 'Ż': 'Z'
};

export function transliterateToAsciiSlug(input, maxLen = 44) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  let mapped = '';
  for (const ch of raw) {
    mapped += TRANSLIT_MAP[ch] || ch;
  }
  return mapped
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLen)
    .replace(/_+$/g, '');
}

export function buildSubmissionPdfFilename(submissionData = {}) {
  const first = String(submissionData.directorFirstName || '').trim();
  const last = String(submissionData.directorLastName || '').trim();
  const combinedName = `${first} ${last}`.trim() || String(submissionData.name || submissionData.directorName || '').trim();
  const filmTitle = String(submissionData.filmTitle || '').trim();

  const pupilSlug = transliterateToAsciiSlug(combinedName, 40);
  const filmSlug = transliterateToAsciiSlug(filmTitle, 48);

  if (pupilSlug && filmSlug) {
    return `${pupilSlug}_-_${filmSlug}.pdf`;
  }
  if (pupilSlug) {
    return `${pupilSlug}.pdf`;
  }
  if (filmSlug) {
    return `${filmSlug}.pdf`;
  }
  return 'AISFF_Submission.pdf';
}

function splitRoleNames(first, last, combined) {
  const f = String(first || '').trim();
  const l = String(last || '').trim();
  if (f || l) {
    return { first: f || '—', last: l || '—' };
  }
  const full = String(combined || '').trim();
  if (!full) return { first: '—', last: '—' };
  const parts = full.split(/\s+/);
  return {
    first: parts[0] || '—',
    last: parts.slice(1).join(' ') || '—'
  };
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n || isNaN(n) || n <= 0) return '—';
  const mb = n / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function formatSubmittedTimestamp(raw) {
  if (!raw) return '—';
  if (typeof raw === 'object' && typeof raw.toDate === 'function') {
    try {
      return raw.toDate().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    } catch {
      return '—';
    }
  }
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    }
  } catch {
    // fallback below
  }
  return String(raw);
}

/**
 * Generates an executive A4 PDF dossier containing ALL submitted film,
 * separated crew roles, contact profile, synopsis, video technical specs,
 * ceremony RSVP, and timestamps using Unicode DejaVu Sans fonts.
 */
export async function generateSubmissionPdf(submissionData = {}) {
  const isLt = submissionData.submissionLang !== 'en';
  const filename = buildSubmissionPdfFilename(submissionData);

  const doc = new PDFDocument({
    size: 'A4',
    bufferPages: true,
    margins: { top: 42, bottom: 48, left: 46, right: 46 },
    info: {
      Title: `${submissionData.filmTitle || 'Film Entry'} — ${submissionData.name || 'AISFF'}`,
      Author: 'Azuolynas International Students Film Festival',
      Subject: 'AISFF Official Film Submission Dossier'
    }
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const hasDejaVuRegular = fs.existsSync(FONT_REGULAR_PATH);
  const hasDejaVuBold = fs.existsSync(FONT_BOLD_PATH);
  if (hasDejaVuRegular) doc.registerFont('BodyFont', FONT_REGULAR_PATH);
  if (hasDejaVuBold) doc.registerFont('HeadingFont', FONT_BOLD_PATH);

  const fRegular = hasDejaVuRegular ? 'BodyFont' : 'Helvetica';
  const fBold = hasDejaVuBold ? 'HeadingFont' : 'Helvetica-Bold';

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;
  const maxY = doc.page.height - doc.page.margins.bottom - 18;

  const palette = {
    emeraldDark: '#09211B',
    emeraldAccent: '#113939',
    mintAccent: '#6FA58A',
    tintLight: '#F3F7F5',
    rowAlt: '#F8FAFC',
    border: '#CBD5E1',
    textDark: '#0F172A',
    textMuted: '#475569',
    textFaint: '#64748B',
    passBg: '#ECFDF5',
    passText: '#065F46'
  };

  const ensureSpace = (neededHeight) => {
    if (doc.y + neededHeight > maxY) {
      doc.addPage();
    }
  };

  const subId = String(submissionData.id || '—');
  const submittedFormatted = formatSubmittedTimestamp(submissionData.submittedAt || new Date().toISOString());
  const directorRoles = splitRoleNames(
    submissionData.directorFirstName,
    submissionData.directorLastName,
    submissionData.directorName || submissionData.name
  );
  const pupilFullName = `${directorRoles.first} ${directorRoles.last !== '—' ? directorRoles.last : ''}`.trim();

  // Top Header Banner
  const bannerTop = 34;
  const bannerHeight = 78;
  doc.rect(startX, bannerTop, pageWidth, bannerHeight).fill(palette.emeraldDark);
  doc.rect(startX, bannerTop + bannerHeight - 3, pageWidth, 3).fill(palette.mintAccent);

  doc.fillColor(palette.mintAccent).font(fBold).fontSize(8.5)
    .text('AISFF  •  ĄŽUOLYNAS INTERNATIONAL STUDENTS FILM FESTIVAL', startX + 16, bannerTop + 13, { width: pageWidth - 165 });

  doc.fillColor('#FFFFFF').font(fBold).fontSize(15.5)
    .text(isLt ? 'OFICIALI FILMO PARAIŠKOS BYLA' : 'OFFICIAL FILM SUBMISSION DOSSIER', startX + 16, bannerTop + 28, { width: pageWidth - 165 });

  const filmSubtitle = String(submissionData.filmTitle || (isLt ? 'Konkursinis filmas' : 'Competition Film'));
  doc.fillColor('#CBD5E1').font(fRegular).fontSize(9.5)
    .text(`${filmSubtitle}  •  ${pupilFullName}`, startX + 16, bannerTop + 51, { width: pageWidth - 165, ellipsis: true });

  // Right ID / Status box inside header
  const badgeW = 138;
  const badgeX = startX + pageWidth - badgeW - 14;
  doc.roundedRect(badgeX, bannerTop + 14, badgeW, 48, 3).fill('#103128');
  doc.fillColor(palette.mintAccent).font(fBold).fontSize(7.5)
    .text(isLt ? 'PARAIŠKOS ID' : 'SUBMISSION ID', badgeX + 10, bannerTop + 21, { width: badgeW - 20 });
  doc.fillColor('#FFFFFF').font(fBold).fontSize(8.5)
    .text(subId.length > 20 ? subId.slice(0, 20) + '…' : subId, badgeX + 10, bannerTop + 33, { width: badgeW - 20 });
  doc.fillColor('#A7F3D0').font(fRegular).fontSize(7.5)
    .text(isLt ? 'Kalba: LT' : 'Language: EN', badgeX + 10, bannerTop + 47, { width: badgeW - 20 });

  doc.y = bannerTop + bannerHeight + 14;

  // Quick Metadata Strip (3 balanced cards)
  const colGap = 8;
  const cardW = (pageWidth - colGap * 2) / 3;
  const metaCards = [
    {
      label: isLt ? 'PATEIKIMO DATA IR LAIKAS' : 'SUBMITTED TIMESTAMP',
      value: submittedFormatted
    },
    {
      label: isLt ? 'DALYVAVIMAS CEREMONIJOJE' : 'CEREMONY ATTENDANCE',
      value: submissionData.attendanceType === 'remote'
        ? (isLt ? 'Nuotoliniu būdu' : 'Remote Stream')
        : (isLt ? 'Gyvai Kaune' : 'In Person (Kaunas)')
    },
    {
      label: isLt ? 'ATSAKYMO TERMINAS' : 'RESPONSE WINDOW',
      value: submissionData.responseTimeText || (isLt ? 'Per 5 darbo dienas' : 'Within 5 business days')
    }
  ];

  const stripY = doc.y;
  metaCards.forEach((item, idx) => {
    const cx = startX + idx * (cardW + colGap);
    doc.rect(cx, stripY, cardW, 40).fillAndStroke(palette.tintLight, palette.border);
    doc.fillColor(palette.emeraldAccent).font(fBold).fontSize(7.2)
      .text(item.label, cx + 9, stripY + 8, { width: cardW - 18 });
    doc.fillColor(palette.textDark).font(fBold).fontSize(8.5)
      .text(item.value, cx + 9, stripY + 21, { width: cardW - 18, ellipsis: true });
  });
  doc.y = stripY + 52;

  const drawSectionTitle = (title) => {
    ensureSpace(44);
    doc.y += 4;
    doc.fillColor(palette.emeraldAccent).font(fBold).fontSize(10)
      .text(title.toUpperCase(), startX, doc.y);
    const ruleY = doc.y + 3;
    doc.moveTo(startX, ruleY).lineTo(startX + pageWidth, ruleY).lineWidth(1.2).stroke(palette.mintAccent);
    doc.y = ruleY + 8;
  };

  const drawTwoColumnRows = (rows) => {
    const labelW = 158;
    const valW = pageWidth - labelW - 22;
    rows.forEach((row, idx) => {
      const cleanVal = String(row.value === undefined || row.value === null || row.value === '' ? '—' : row.value);
      doc.font(fRegular).fontSize(9);
      const valHeight = doc.heightOfString(cleanVal, { width: valW });
      doc.font(fBold).fontSize(8.5);
      const lblHeight = doc.heightOfString(row.label, { width: labelW });
      const rowH = Math.max(22, Math.max(valHeight, lblHeight) + 10);

      ensureSpace(rowH + 4);
      const y = doc.y;
      const bg = idx % 2 === 0 ? '#FFFFFF' : palette.rowAlt;
      doc.rect(startX, y, pageWidth, rowH).fillAndStroke(bg, palette.border);

      doc.fillColor(palette.textMuted).font(fBold).fontSize(8.5)
        .text(row.label, startX + 10, y + 6, { width: labelW });
      doc.fillColor(row.accent ? palette.passText : palette.textDark).font(row.boldValue ? fBold : fRegular).fontSize(9)
        .text(cleanVal, startX + labelW + 14, y + 5.5, { width: valW });

      doc.y = y + rowH;
    });
    doc.y += 10;
  };

  // SECTION 1: KŪRYBINĖ KOMANDA (Vardas / Pavardė table + Contact grid)
  drawSectionTitle(isLt ? '1. Kūrybinė komanda ir autoriaus kontaktai' : '1. Creative Team & Author Profile');

  const crewRoles = [
    { role: isLt ? 'Režisierius / Autorius' : 'Director / Author', ...directorRoles },
    { role: isLt ? 'Operatorius' : 'Camera Operator', ...splitRoleNames(submissionData.cameraOperatorFirstName, submissionData.cameraOperatorLastName, submissionData.cameraOperator) },
    { role: isLt ? 'Idėjos autorius' : 'Author of the Idea', ...splitRoleNames(submissionData.ideaAuthorFirstName, submissionData.ideaAuthorLastName, submissionData.ideaAuthor) },
    { role: isLt ? 'Scenarijaus autorius' : 'Screenwriter', ...splitRoleNames(submissionData.screenwriterFirstName, submissionData.screenwriterLastName, submissionData.screenwriter) }
  ];

  const col1W = 165;
  const col2W = (pageWidth - col1W) / 2;
  const col3W = pageWidth - col1W - col2W;

  ensureSpace(24 + crewRoles.length * 22);
  const tblHeaderY = doc.y;
  doc.rect(startX, tblHeaderY, pageWidth, 21).fill(palette.emeraldAccent);
  doc.fillColor('#FFFFFF').font(fBold).fontSize(8)
    .text(isLt ? 'VAIDMUO' : 'ROLE', startX + 10, tblHeaderY + 6.5, { width: col1W - 14 });
  doc.text(isLt ? 'VARDAS' : 'FIRST NAME', startX + col1W + 8, tblHeaderY + 6.5, { width: col2W - 12 });
  doc.text(isLt ? 'PAVARDĖ' : 'LAST NAME', startX + col1W + col2W + 8, tblHeaderY + 6.5, { width: col3W - 12 });
  doc.y = tblHeaderY + 21;

  crewRoles.forEach((cr, idx) => {
    const rY = doc.y;
    const h = 21;
    const bg = idx % 2 === 0 ? '#FFFFFF' : palette.rowAlt;
    doc.rect(startX, rY, pageWidth, h).fillAndStroke(bg, palette.border);
    doc.fillColor(palette.textMuted).font(fBold).fontSize(8.5)
      .text(cr.role, startX + 10, rY + 6, { width: col1W - 14, ellipsis: true });
    doc.fillColor(palette.textDark).font(fRegular).fontSize(9)
      .text(cr.first, startX + col1W + 8, rY + 5.5, { width: col2W - 12, ellipsis: true });
    doc.fillColor(palette.textDark).font(fRegular).fontSize(9)
      .text(cr.last, startX + col1W + col2W + 8, rY + 5.5, { width: col3W - 12, ellipsis: true });
    doc.y = rY + h;
  });
  doc.y += 8;

  drawTwoColumnRows([
    { label: isLt ? 'El. pašto adresas:' : 'Email Address:', value: submissionData.email, boldValue: true },
    { label: isLt ? 'Amžius ir kategorija:' : 'Age & Category:', value: `${submissionData.age || '—'} ${isLt ? 'm.' : 'y/o'}  |  ${submissionData.category || '—'}` },
    { label: isLt ? 'Šalis ir miestas:' : 'Location (Country / City):', value: submissionData.location || submissionData.countryCity || '—' },
    { label: isLt ? 'Mokykla / Kino studija:' : 'School / Film Studio:', value: submissionData.institution || '—' }
  ]);

  // SECTION 2: FILMO DUOMENYS, CEREMONIJA IR SINOPSIS
  drawSectionTitle(isLt ? '2. Filmo informacija, sinopsis ir ceremonija' : '2. Film Details, Synopsis & Ceremony');

  const filmRows = [
    { label: isLt ? 'Filmo pavadinimas:' : 'Film Title:', value: submissionData.filmTitle, boldValue: true },
    { label: isLt ? 'Filmavimo įrenginys:' : 'Filming Device:', value: submissionData.deviceModel },
    { label: isLt ? 'Paraiškos statusas:' : 'Application Status:', value: submissionData.status || 'submitted' }
  ];
  if (submissionData.liveToken) {
    filmRows.push({ label: isLt ? 'Transliacijos žetonas:' : 'Live Stream Token:', value: submissionData.liveToken, boldValue: true });
    filmRows.push({ label: isLt ? 'Transliacijos nuoroda:' : 'Live Stream URL:', value: submissionData.liveStreamUrl || '—' });
  }
  drawTwoColumnRows(filmRows);

  // Synopsis box with dynamic height calculation
  const synopsisText = String(submissionData.synopsis || '—').trim() || '—';
  doc.font(fRegular).fontSize(9);
  const synTextHeight = doc.heightOfString(synopsisText, { width: pageWidth - 26 });
  const synBoxHeight = Math.max(46, synTextHeight + 30);
  ensureSpace(synBoxHeight + 10);

  const synY = doc.y;
  doc.rect(startX, synY, pageWidth, synBoxHeight).fillAndStroke(palette.tintLight, palette.border);
  doc.rect(startX, synY, 3.5, synBoxHeight).fill(palette.emeraldAccent);
  doc.fillColor(palette.emeraldAccent).font(fBold).fontSize(8)
    .text(isLt ? 'FILMO SINOPSIS / IDĖJA' : 'FILM SYNOPSIS / CONCEPT', startX + 12, synY + 8, { width: pageWidth - 24 });
  doc.fillColor(palette.textDark).font(fRegular).fontSize(9)
    .text(synopsisText, startX + 12, synY + 21, { width: pageWidth - 26 });
  doc.y = synY + synBoxHeight + 12;

  // SECTION 3: VAIZDO ĮRAŠO TECHNINĖ INFORMACIJA IR PATIKRA
  drawSectionTitle(isLt ? '3. Vaizdo įrašo techninė specifikacija ir patikra' : '3. Video Technical Specs & Validation');

  const sourceLabel = submissionData.videoSourceType === 'link'
    ? (isLt ? 'Išorinė vaizdo nuoroda (URL)' : 'External Video Link (URL)')
    : (isLt ? 'Įkeltas vaizdo failas' : 'Uploaded Video File');
  const fileSizeBytes = submissionData.videoSizeBytes || submissionData.videoFileSizeBytes || 0;
  const validationLabel = submissionData.videoValidationStatus || (isLt ? 'ATITINKA REIKALAVIMUS (PASSED)' : 'PASSED');

  drawTwoColumnRows([
    { label: isLt ? 'Pateikimo būdas:' : 'Submission Method:', value: sourceLabel },
    { label: isLt ? 'Taisyklių patikra:' : 'Validation Result:', value: `✓ ${validationLabel}`, accent: true, boldValue: true },
    { label: isLt ? 'Failo pavadinimas:' : 'File Name:', value: submissionData.videoFileName || '—' },
    { label: isLt ? 'Failo dydis ir formatas:' : 'File Size & Format:', value: `${formatBytes(fileSizeBytes)}${submissionData.videoMimeType ? `  (${submissionData.videoMimeType})` : ''}` },
    { label: isLt ? 'Trukmė ir raiška:' : 'Duration & Resolution:', value: `${submissionData.videoDurationSeconds ? `${submissionData.videoDurationSeconds} s` : '—'}  |  ${submissionData.videoResolution || '—'}` },
    { label: isLt ? 'Vaizdo įrašo nuoroda:' : 'Video URL:', value: submissionData.videoUrl || submissionData.videoLink || '—' },
    { label: isLt ? 'PDF bylos pavadinimas:' : 'Generated PDF Filename:', value: filename }
  ]);

  // Render clean page footers across all generated pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 32;
    doc.moveTo(startX, footerY - 6).lineTo(startX + pageWidth, footerY - 6).lineWidth(0.6).stroke(palette.border);
    doc.fillColor(palette.textFaint).font(fRegular).fontSize(7.8)
      .text(
        isLt
          ? 'Sugeneruota automatiškai AISFF sistemos • Dokumentas skirtas paraiškos autoriui ir festivalio organizatoriams'
          : 'Automatically generated by AISFF • Sent to submitting filmmaker and festival organizers',
        startX,
        footerY,
        { width: pageWidth - 60 }
      );
    doc.fillColor(palette.textMuted).font(fBold).fontSize(7.8)
      .text(`${i + 1} / ${range.count}`, startX + pageWidth - 55, footerY, { width: 55, align: 'right' });
  }

  doc.end();
  const buffer = await done;
  return {
    buffer,
    filename,
    sizeBytes: buffer.length
  };
}

export default { generateSubmissionPdf, buildSubmissionPdfFilename, transliterateToAsciiSlug };
