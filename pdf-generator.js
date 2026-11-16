import PDFDocument from 'pdfkit';
import fs from 'node:fs';

const FONT_REGULAR_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const FONT_BOLD_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

function formatRoleName(first, last, fallback) {
  const f = String(first || '').trim();
  const l = String(last || '').trim();
  if (f || l) {
    return `${f} ${l}`.trim();
  }
  return String(fallback || '—').trim() || '—';
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n || isNaN(n) || n <= 0) return '—';
  const mb = n / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

/**
 * Generates an A4 PDF containing ALL submitted film, author-role, email,
 * video validation, RSVP, and timestamp details using Unicode DejaVu Sans fonts.
 */
export async function generateSubmissionPdf(submissionData = {}) {
  const isLt = submissionData.submissionLang !== 'en';
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 44, bottom: 44, left: 48, right: 48 },
    info: {
      Title: `AISFF Submission - ${submissionData.filmTitle || 'Film Entry'}`,
      Author: 'Azuolynas International Students Film Festival',
      Subject: 'Film Festival Submission Dossier'
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

  // Header band
  doc.rect(startX, 36, pageWidth, 64).fill('#0B241E');
  doc.fillColor('#6FA58A').font(fBold).fontSize(9)
    .text('AISFF — ĄŽUOLYNAS INTERNATIONAL STUDENTS FILM FESTIVAL', startX + 16, 48);
  doc.fillColor('#FFFFFF').font(fBold).fontSize(16)
    .text(isLt ? 'OFICIALI FILMO PARAIŠKOS BYLA' : 'OFFICIAL FILM SUBMISSION DOSSIER', startX + 16, 63);

  doc.y = 114;

  const subId = submissionData.id || '—';
  const submittedAtRaw = submissionData.submittedAt || new Date().toISOString();
  let submittedFormatted = String(submittedAtRaw);
  try {
    const parsedDate = new Date(submittedAtRaw);
    if (!isNaN(parsedDate.getTime())) {
      submittedFormatted = parsedDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    }
  } catch {}

  const drawSectionHeading = (title) => {
    if (doc.y > 700) doc.addPage();
    doc.moveDown(0.5);
    doc.fillColor('#113939').font(fBold).fontSize(11).text(title.toUpperCase(), startX);
    const lineY = doc.y + 2;
    doc.moveTo(startX, lineY).lineTo(startX + pageWidth, lineY).lineWidth(1).stroke('#CBD5E1');
    doc.y = lineY + 8;
  };

  const drawField = (label, value) => {
    if (doc.y > 745) doc.addPage();
    const y = doc.y;
    const labelW = 175;
    const valW = pageWidth - labelW - 10;
    const cleanVal = String(value === undefined || value === null || value === '' ? '—' : value);

    doc.fillColor('#475569').font(fBold).fontSize(9.5).text(label, startX, y, { width: labelW });
    const labelBottom = doc.y;
    doc.fillColor('#0F172A').font(fRegular).fontSize(9.5).text(cleanVal, startX + labelW + 10, y, { width: valW });
    const valBottom = doc.y;
    doc.y = Math.max(labelBottom, valBottom) + 5;
  };

  drawSectionHeading(isLt ? '1. Paraiškos informacija ir laikas' : '1. Submission Metadata');
  drawField(isLt ? 'Paraiškos ID:' : 'Submission ID:', subId);
  drawField(isLt ? 'Pateikimo data ir laikas:' : 'Submitted At:', submittedFormatted);
  drawField(isLt ? 'Paraiškos kalba:' : 'Language:', isLt ? 'Lietuvių (LT)' : 'English (EN)');
  drawField(isLt ? 'Atsakymo terminas:' : 'Response Notice:', submissionData.responseTimeText || (isLt ? 'per 5 darbo dienas' : 'within 5 business days'));

  drawSectionHeading(isLt ? '2. Kūrybinė komanda ir kontaktai' : '2. Author & Crew Information');
  drawField(
    isLt ? 'Režisierius / Autorius (Vardas):' : 'Director / Author (First Name):',
    submissionData.directorFirstName || (String(submissionData.name || '').trim().split(/\s+/)[0] || '—')
  );
  drawField(
    isLt ? 'Režisierius / Autorius (Pavardė):' : 'Director / Author (Last Name):',
    submissionData.directorLastName || (String(submissionData.name || '').trim().split(/\s+/).slice(1).join(' ') || '—')
  );
  drawField(
    isLt ? 'Operatorius (Vardas Pavardė):' : 'Camera Operator:',
    formatRoleName(submissionData.cameraOperatorFirstName, submissionData.cameraOperatorLastName)
  );
  drawField(
    isLt ? 'Idėjos autorius (Vardas Pavardė):' : 'Author of the Idea:',
    formatRoleName(submissionData.ideaAuthorFirstName, submissionData.ideaAuthorLastName)
  );
  drawField(
    isLt ? 'Scenarijaus autorius (Vardas Pavardė):' : 'Screenwriter:',
    formatRoleName(submissionData.screenwriterFirstName, submissionData.screenwriterLastName)
  );
  drawField(isLt ? 'El. pašto adresas:' : 'Email Address:', submissionData.email);
  drawField(isLt ? 'Amžius ir Kategorija:' : 'Age & Category:', `${submissionData.age || '—'} ${isLt ? 'm.' : 'y/o'} | ${submissionData.category || '—'}`);
  drawField(isLt ? 'Šalis ir miestas:' : 'Country & City:', submissionData.location || submissionData.countryCity || '—');
  drawField(isLt ? 'Mokykla / Studija:' : 'School / Studio:', submissionData.institution || '—');

  drawSectionHeading(isLt ? '3. Filmo duomenys ir ceremonija' : '3. Film Details & Ceremony');
  drawField(isLt ? 'Filmo pavadinimas:' : 'Film Title:', submissionData.filmTitle);
  drawField(isLt ? 'Filmavimo įrenginys:' : 'Filming Device:', submissionData.deviceModel);
  drawField(
    isLt ? 'Dalyvavimas ceremonijoje (RSVP):' : 'Ceremony Attendance (RSVP):',
    submissionData.attendanceType === 'remote'
      ? (isLt ? 'Nuotolinis stebėtojas (su asmeniniu žetonu)' : 'Remote participant (with personal stream token)')
      : (isLt ? 'Dalyvaus gyvai vietoje (Kaune)' : 'Attending in person (Kaunas)')
  );
  if (submissionData.liveToken) {
    drawField(isLt ? 'Transliacijos žetonas:' : 'Stream Token:', submissionData.liveToken);
    drawField(isLt ? 'Transliacijos nuoroda:' : 'Live Stream URL:', submissionData.liveStreamUrl || '—');
  }
  drawField(isLt ? 'Sinopsis / Idėja:' : 'Synopsis / Concept:', submissionData.synopsis);

  drawSectionHeading(isLt ? '4. Vaizdo įrašo techninė informacija' : '4. Video Technical Information & Validation');
  const sourceLabel = submissionData.videoSourceType === 'link'
    ? (isLt ? 'Pateikta nuoroda' : 'External Video Link')
    : (isLt ? 'Įkeltas vaizdo failas' : 'Uploaded Video File');
  drawField(isLt ? 'Pateikimo būdas:' : 'Submission Method:', sourceLabel);
  drawField(isLt ? 'Failo pavadinimas:' : 'File Name:', submissionData.videoFileName || '—');
  drawField(isLt ? 'Vaizdo įrašo URL:' : 'Video URL:', submissionData.videoUrl || submissionData.videoLink || '—');
  drawField(isLt ? 'Trukmė:' : 'Duration:', submissionData.videoDurationSeconds ? `${submissionData.videoDurationSeconds} s` : (isLt ? 'Nuoroda (patvirtinta)' : 'External link'));
  drawField(isLt ? 'Failo dydis:' : 'File Size:', formatBytes(submissionData.videoFileSizeBytes));
  drawField(isLt ? 'Raiška (Rezoliucija):' : 'Resolution:', submissionData.videoResolution || '—');
  drawField(isLt ? 'Taisyklių patikra:' : 'Validation Status:', submissionData.videoValidationStatus || 'PASSED');

  doc.moveDown(1);
  doc.fillColor('#64748B').font(fRegular).fontSize(8.5)
    .text(
      isLt
        ? 'Sugeneruota automatiškai AISFF sistemos. Dokumentas išsiųstas pateikusiam autoriui ir festivalio organizatoriams.'
        : 'Automatically generated by the AISFF submission system. Sent to both the submitting filmmaker and festival organizers.',
      startX,
      doc.y,
      { width: pageWidth, align: 'center' }
    );

  doc.end();
  const buffer = await done;
  const safeTitle = String(submissionData.filmTitle || 'submission')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'submission';
  return {
    buffer,
    filename: `AISFF_${safeTitle}_${subId}.pdf`,
    sizeBytes: buffer.length
  };
}

export default { generateSubmissionPdf };
