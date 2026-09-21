const emailWrapperStart = `
<div style="background-color: #071C18; padding: 35px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #0D2923; padding: 35px 26px; border-radius: 8px; border-top: 3px solid #6FA58A; border-left: 1px solid rgba(111,165,138,0.18); border-right: 1px solid rgba(111,165,138,0.18); border-bottom: 1px solid rgba(111,165,138,0.18); box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
    <div style="text-align: center; margin-bottom: 26px;">
      <img src="https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/azuolynasfilmfest.webp?alt=media" alt="Ąžuolynas Film Fest" style="max-height: 72px; width: auto; display: inline-block;">
      <h2 style="color: #F1F3EE; margin: 16px 0 4px 0; font-size: 20px; font-family: Georgia, serif; font-weight: 600;">Ąžuolynas Film Festival</h2>
      <p style="color: #AABBB2; margin: 0; font-size: 13px;">An unusual view at ordinary things</p>
    </div>
`;

const emailBoxStyle = `border: 1px solid rgba(111,165,138,0.2); padding: 20px; margin: 22px 0; border-radius: 6px; background-color: #0A221D;`;

const emailWrapperEnd = `
    <hr style="border: none; border-top: 1px solid rgba(111,165,138,0.18); margin: 30px 0 20px 0;">
    <div style="text-align: center;">
      <p style="font-size: 13px; color: #AABBB2; margin: 0 0 6px 0; line-height: 1.6;">
        <b>ĄŽUOLYNAS INTERNATIONAL STUDENTS FILM FESTIVAL</b><br>
        Email: <a href="mailto:azuolynasfilmfestival@gmail.com" style="color: #9BC4AE; text-decoration: none;">azuolynasfilmfestival@gmail.com</a>
      </p>
      <p style="font-size: 12px; color: #5C756B; margin: 0;">Oficiali platforma: azuolynasinternationalfilmfestival.github.io</p>
    </div>
  </div>
</div>
`;

const emailTexts = {
  lt: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Filmo paraiška sėkmingai gauta!",
      heading: "Sveiki, {{name}}!",
      body: "Nuoširdžiai dėkojame! Jūsų filmas sėkmingai pasiekė Ąžuolyno tarptautinio mokinių filmų festivalio organizacinę komandą. Atrankos komisija netrukus peržiūrės filmą.",
      detailsTitle: "Pateiktos paraiškos suvestinė:",
      note: "Festivalio peržiūros įrašas ir nugalėtojų paskelbimas bus patalpintas oficialioje festivalio svetainėje 2026 m. balandžio 17 d."
    },
    adminNotification: {
      sub: "Nauja paraiška festivaliui!",
      heading: "Gauta nauja filmo paraiška",
      body: "Sistemoje užregistruota nauja dalyvio paraiška. Žemiau pateikiami visi kūrėjo ir filmo duomenys.",
      detailsTitle: "Paraiškos byla:"
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Sveikiname! Jūsų filmas priimtas",
      heading: "Puikios žinios, {{name}}!",
      body: "Džiaugiamės galėdami pranešti, kad jūsų filmas atitiko visus reikalavimus ir yra oficialiai priimtas į festivalio konkursinę programą!",
      detailsTitle: "Priėmimo informacija:",
      note: "Balandžio 17 d. festivalio įrašas bus pasiekiamas oficialioje festivalio svetainėje."
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Jūsų darbas pateko į PUSFINALĮ!",
      heading: "Sveikiname, {{name}}!",
      body: "Komisija itin aukštai įvertino jūsų kūrybiškumą. Jūsų darbas oficialiai patenka tarp festivalio pusfinalininkų!",
      detailsTitle: "Rezultatai:",
      note: "Pusfinalio filmai bus pristatomi festivalio peržiūros įraše balandžio 17 d."
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | Jūs esate FINALE!",
      heading: "Ypatingas pasiekimas, {{name}}!",
      body: "Jūsų filmas oficialiai pateko į Ąžuolyno kino festivalio FINALĄ ir pretenduoja į prizines vietas bei Žiūrovų simpatijų prizą!",
      detailsTitle: "Finalo informacija:",
      note: "Nugalėtojai bus atskleisti oficialiame festivalio vaizdo įraše balandžio 17 d."
    },
    winner: {
      sub: "Ąžuolynas Film Fest | SVEIKINAME TAPUS FESTIVALIO LAUREATU!",
      heading: "Nuoširdūs sveikinimai, {{name}}!",
      body: "Komisijos sprendimu jūsų filmas pelnė apdovanojimą Ąžuolyno tarptautiniame mokinių filmų festivalyje! Dėkojame už jūsų talentą.",
      detailsTitle: "Apdovanojimo informacija:",
      note: "Netrukus susisieksime asmeniškai dėl diplomo ir prizo perdavimo."
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Informacija apie jūsų paraišką",
      heading: "Sveiki, {{name}},",
      body: "Dėkojame už jūsų dalyvavimą. Nors šį kartą jūsų darbas nepateko į kitą etapą, labai vertiname jūsų kūrybiškumą ir pastangas.",
      detailsTitle: "Atrankos rezultatas:",
      note: "Kurkite toliau ir lauksime jūsų kitų metų festivalyje!"
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | Festivalio įrašas jau prieinamas svetainėje!",
      heading: "Sveiki, {{name}}!",
      body: "Informuojame, kad oficialus festivalio filmų ir nugalėtojų vaizdo įrašas jau patalpintas tiesiogiai festivalio svetainėje.",
      detailsTitle: "Peržiūros informacija:",
      note: "Spustelėkite žemiau esantį mygtuką ir peržiūrėkite festivalio įrašą."
    }
  },
  en: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Submission Received Successfully!",
      heading: "Hello, {{name}}!",
      body: "Thank you for participating! We have safely received your film entry for the Ąžuolynas International Students Film Festival.",
      detailsTitle: "Submission summary:",
      note: "The festival screening recording and winners announcement will be published on our official website on April 17th, 2026."
    },
    adminNotification: {
      sub: "New Film Festival Submission!",
      heading: "New Film Entry Submitted",
      body: "A new participant submission has been recorded in the festival system. Details below.",
      detailsTitle: "Submission Dossier:"
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Congratulations! Your Film is Accepted",
      heading: "Congratulations, {{name}}!",
      body: "We are pleased to inform you that your work has met all criteria and is officially accepted into the festival competition!",
      detailsTitle: "Acceptance details:",
      note: "The full event recording will premiere directly on our website on April 17th, 2026."
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Your Film is a SEMI-FINALIST!",
      heading: "Exciting news, {{name}}!",
      body: "Our jury was profoundly moved by your work. Your film has officially reached the SEMI-FINALS!",
      detailsTitle: "Status update:",
      note: "Semi-final entries will be featured in the official festival recording on April 17th, 2026."
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | You have reached the FINALS!",
      heading: "Tremendous achievement, {{name}}!",
      body: "Your film has officially advanced to the FINALS and is in direct contention for the festival awards!",
      detailsTitle: "Finalist info:",
      note: "Award winners will be unveiled in the official screening video on April 17th, 2026."
    },
    winner: {
      sub: "Ąžuolynas Film Fest | CONGRATULATIONS FESTIVAL LAUREATE!",
      heading: "Bravo, {{name}}!",
      body: "We are honoured to declare your film an official winner of the Ąžuolynas International Students Film Festival!",
      detailsTitle: "Award record:",
      note: "Our team will reach out directly regarding diplomas and awards."
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Update regarding your film entry",
      heading: "Hello, {{name}},",
      body: "Thank you for submitting your work. While your entry did not make the final selection this season, we truly value your storytelling spirit.",
      detailsTitle: "Review conclusion:",
      note: "Keep creating and we look forward to seeing your films next year!"
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | Festival Recording Now Available On Site!",
      heading: "Hello, {{name}}!",
      body: "The official festival recording and award ceremony is now published directly on our website.",
      detailsTitle: "Viewing details:",
      note: "Click the link below to watch the event recording."
    }
  }
};

function generateEmailHtml(lang, templateKey, data) {
  const t = emailTexts[lang][templateKey];
  const greeting = t.heading.replace("{{name}}", data.name || "Filmmaker");
  const siteUrl = data.streamLink || "https://azuolynasinternationalfilmfestival.github.io/";

  let detailsContent = "";
  if (data.filmTitle) {
    detailsContent += `<p style="margin: 0 0 8px 0; font-size: 14px; color: #F1F3EE;"><b>${lang === "lt" ? "Filmas:" : "Film Title:"}</b> ${data.filmTitle}</p>`;
  }
  if (data.category) {
    detailsContent += `<p style="margin: 0 0 8px 0; font-size: 14px; color: #F1F3EE;"><b>${lang === "lt" ? "Kategorija:" : "Category:"}</b> ${data.category}</p>`;
  }
  if (data.customMessage) {
    detailsContent += `<p style="margin: 12px 0 0 0; font-size: 14px; color: #9BC4AE; line-height: 1.6; border-left: 2px solid #6FA58A; padding-left: 10px;">${data.customMessage}</p>`;
  }

  detailsContent += `
    <div style="text-align: center; margin-top: 20px;">
      <a href="${siteUrl}" target="_blank" style="background-color: #12372F; color: #F1F3EE; border: 1px solid #6FA58A; text-decoration: none; padding: 11px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
        ${lang === "lt" ? "Atverti Festivalio Svetainę" : "Open Festival Website"}
      </a>
    </div>
  `;

  return `
    ${emailWrapperStart}
      <h3 style="color: #F1F3EE; margin: 0 0 14px 0; font-size: 19px; font-weight: 600; font-family: Georgia, serif;">${greeting}</h3>
      <p style="font-size: 14px; color: #AABBB2; line-height: 1.65; margin: 0 0 15px 0;">${t.body}</p>
      
      <div style="${emailBoxStyle}">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #9BC4AE; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${t.detailsTitle}</p>
        ${detailsContent}
      </div>

      <p style="font-size: 13px; color: #5C756B; line-height: 1.6; margin: 16px 0 0 0;">${t.note || ''}</p>
    ${emailWrapperEnd}
  `;
}

function generateAdminNotificationHtml(lang, data) {
  const t = emailTexts[lang].adminNotification;
  const adminUrl = "https://azuolynasinternationalfilmfestival.github.io/admin.html";

  return `
    ${emailWrapperStart}
      <h3 style="color: #F1F3EE; margin: 0 0 14px 0; font-size: 19px; font-weight: 600; font-family: Georgia, serif;">${t.heading}</h3>
      <p style="font-size: 14px; color: #AABBB2; line-height: 1.65; margin: 0 0 15px 0;">${t.body}</p>
      
      <div style="${emailBoxStyle}">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #9BC4AE; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${t.detailsTitle}</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #F1F3EE;"><b>Autorius:</b> ${data.name || '-'} (${data.email || '-'})</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #F1F3EE;"><b>Filmas:</b> ${data.filmTitle || '-'}</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #F1F3EE;"><b>Kategorija / Amžius:</b> ${data.category || '-'} (${data.age || '-'} m.)</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #F1F3EE;"><b>Vieta:</b> ${data.location || '-'}</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #F1F3EE;"><b>Įstaiga:</b> ${data.institution || '-'}</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #F1F3EE;"><b>Įrenginys:</b> ${data.deviceModel || '-'}</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #F1F3EE;"><b>Trukmė:</b> ${data.videoDurationSeconds || '-'} s</p>
        <p style="margin: 10px 0 4px 0; font-size: 12px; color: #9BC4AE; font-weight: 600; text-transform: uppercase;">Sinopsis:</p>
        <p style="margin: 0 0 14px 0; font-size: 13px; color: #AABBB2; font-style: italic;">${data.synopsis || '-'}</p>
        ${data.videoUrl ? `<p style="margin: 0;"><a href="${data.videoUrl}" target="_blank" style="color:#6FA58A; font-weight:600; text-decoration:underline;">Atsisiųsti / Peržiūrėti vaizdo įrašą</a></p>` : ''}
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${adminUrl}" target="_blank" style="background-color: #12372F; color: #F1F3EE; border: 1px solid #6FA58A; text-decoration: none; padding: 11px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          Atverti Admin Valdymo Skydą
        </a>
      </div>
    ${emailWrapperEnd}
  `;
}