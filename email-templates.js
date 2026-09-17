const emailLogoHeader = `
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/azuolynasfilmfest.webp?alt=media" alt="Ąžuolynas Film Fest" style="max-height: 85px; width: auto; display: inline-block;">
    <h2 style="color: #113939; margin: 15px 0 0 0; font-size: 20px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Ąžuolynas International Students Film Festival</h2>
    <p style="color: #617d79; margin: 5px 0 0 0; font-size: 13px;">An unusual view at ordinary things</p>
  </div>
`;

const emailWrapperStart = `
<div style="background-color: #F4F7F6; padding: 40px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; padding: 35px 30px; border-radius: 8px; border-top: 5px solid #113939; box-shadow: 0 6px 24px rgba(0,0,0,0.06);">
    ${emailLogoHeader}
`;

const emailBoxStyle = `border: 1px solid #DCE5E2; padding: 20px; margin: 24px 0; border-radius: 6px; background-color: #F8FAF9;`;

const emailWrapperEnd = `
    <hr style="border: none; border-top: 1px solid #E5ECE9; margin: 35px 0 25px 0;">
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
      <div>
        <p style="font-size: 13px; color: #2A5C5C; margin: 0; line-height: 1.6;">
          <b>ĄŽUOLYNAS INTERNATIONAL STUDENTS FILM FESTIVAL</b><br>
          El. paštas / Email: <a href="mailto:azuolynasfilmfest@gmail.com" style="color: #113939; font-weight: bold; text-decoration: none;">azuolynasfilmfest@gmail.com</a><br>
          Transliacija / Event Broadcast: May 27th, 15:00 (EEST) @ YouTube
        </p>
      </div>
    </div>
  </div>
</div>
`;

const emailTexts = {
  lt: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Jūsų filmas sėkmingai gautas!",
      heading: "Sveiki, {{name}}!",
      body: "Patvirtiname, kad sėkmingai gavome jūsų filmo paraišką Ąžuolyno tarptautiniam mokinių filmų festivaliui. Mūsų atrankos komisija peržiūrės pateiktą medžiagą ir įvertins jos atitiktį taisyklėms.",
      detailsTitle: "Pateiktos paraiškos informacija:",
      note: "Oficiali festivalio peržiūra ir nugalėtojų apdovanojimai vyks gegužės 27 d. 15:00 val. YouTube platformoje."
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Sveikiname! Jūsų filmas priimtas į festivalį",
      heading: "Sveikiname, {{name}}!",
      body: "Džiaugiamės galėdami pranešti, kad jūsų filmas atitiko visus festivalio reikalavimus ir yra oficialiai atrinktas į festivalio programą!",
      detailsTitle: "Atrankos informacija:",
      note: "Netrukus atsiųsime oficialią nuorodą į tiesioginę transliaciją gegužės 27 d. 15:00."
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Jūsų filmas pateko į PUSFINALĮ!",
      heading: "Nuostabios žinios, {{name}}!",
      body: "Komisija itin aukštai įvertino jūsų kūrybiškumą. Jūsų darbas oficialiai patenka tarp festivalio PUSFINALININKŲ!",
      detailsTitle: "Dalyvio statusas:",
      note: "Pusfinalio filmai bus peržiūrimi gegužės 27 d. renginyje. Sekite naujienas!"
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | Jūs esate FINALE!",
      heading: "Sveikiname patekus į FINALĄ, {{name}}!",
      body: "Su didžiuliu džiaugsmu pranešame, kad jūsų filmas pateko į Ąžuolyno kino festivalio finalinį etapą ir pretenduoja į prizines vietas!",
      detailsTitle: "Finalininko informacija:",
      note: "1-os, 2-os, 3-ios vietos ir Žiūrovų simpatijų prizo laimėtojai bus paskelbti gegužės 27 d. 15:00 tiesioginės YouTube transliacijos metu."
    },
    winner: {
      sub: "Ąžuolynas Film Fest | Sveikiname tapus festivalio laureatu!",
      heading: "Valio, {{name}}!",
      body: "Nuoširdžiai sveikiname tapus Ąžuolyno tarptautinio mokinių filmų festivalio laureatu! Dėkojame už jūsų išskirtinį talentą ir neįprastą žvilgsnį į įprastus dalykus.",
      detailsTitle: "Apdovanojimo informacija:",
      note: "Dėl diplomo ir apdovanojimo perdavimo su jumis susisieksime asmeniškai šiuo el. paštu."
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Informacija apie jūsų paraišką",
      heading: "Sveiki, {{name}},",
      body: "Dėkojame, kad domitės Ąžuolyno tarptautiniu mokinių filmų festivaliu ir atsiuntėte savo darbą. Deja, šį kartą jūsų darbas neatitiko festivalio reglamentų arba nepateko į kitą atrankos etapą.",
      detailsTitle: "Sprendimo informacija:",
      note: "Nenuleiskite rankų, kurkite toliau ir lauksime jūsų kitų metų festivalyje!"
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | Nuoroda į tiesioginę transliaciją gegužės 27 d.",
      heading: "Sveiki, {{name}}!",
      body: "Primename, kad festivalio peržiūra ir nugalėtojų paskelbimas prasideda gegužės 27 d. 15:00 Lietuvos laiku.",
      detailsTitle: "Renginio informacija:",
      note: "Spustelėkite žemiau esantį mygtuką ir prisijunkite prie YouTube transliacijos."
    }
  },
  en: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Submission Received Successfully!",
      heading: "Hello {{name}}!",
      body: "We have successfully received your film submission for the Ąžuolynas International Students Film Festival. Our selection jury will review your submission shortly.",
      detailsTitle: "Submission details:",
      note: "The festival live screening and awards ceremony will take place on May 27th at 15:00 (Lithuanian time) on YouTube."
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Congratulations! Film Accepted",
      heading: "Congratulations {{name}}!",
      body: "We are thrilled to inform you that your film meets all criteria and has been officially accepted into the festival program!",
      detailsTitle: "Selection details:",
      note: "We will send your official YouTube streaming link prior to May 27th."
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Your film is a SEMI-FINALIST!",
      heading: "Exciting news, {{name}}!",
      body: "The jury was highly impressed by your creative approach. Your film has officially advanced to the SEMI-FINALS!",
      detailsTitle: "Participant status:",
      note: "Semi-finalist films will be featured during our May 27th event."
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | You are a FINALIST!",
      heading: "Congratulations Finalist, {{name}}!",
      body: "We are proud to announce that your film has entered the FINALS and is in the running for the festival awards!",
      detailsTitle: "Finalist details:",
      note: "1st, 2nd, 3rd places and the Audience Choice Award will be unveiled live on May 27th at 15:00."
    },
    winner: {
      sub: "Ąžuolynas Film Fest | Congratulations Festival Winner!",
      heading: "Congratulations {{name}}!",
      body: "You are an official laureate of the Ąžuolynas International Students Film Festival! Thank you for sharing your unique perspective on ordinary things.",
      detailsTitle: "Award information:",
      note: "Our team will reach out via this email regarding your certificate and awards."
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Update regarding your submission",
      heading: "Hello {{name}},",
      body: "Thank you for submitting your work to the Ąžuolynas International Students Film Festival. Regrettably, your entry was not selected for this edition.",
      detailsTitle: "Review summary:",
      note: "Keep creating and telling stories through your lens! We hope to see your work again next year."
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | Live Stream Link - May 27th",
      heading: "Hello {{name}}!",
      body: "The festival screening and award ceremony is streaming live on May 27th at 15:00 (Lithuanian time).",
      detailsTitle: "Broadcast details:",
      note: "Click the link below to tune in to the official YouTube broadcast."
    }
  }
};

function generateEmailHtml(lang, templateKey, data) {
  const t = emailTexts[lang][templateKey];
  const greeting = t.heading.replace("{{name}}", data.name || "Participant");
  
  let customFieldsHtml = "";
  if (data.filmTitle) {
    customFieldsHtml += `<p style="margin: 0 0 8px 0; font-size: 14px; color: #113939;"><b>${lang === "lt" ? "Filmo pavadinimas:" : "Film title:"}</b> ${data.filmTitle}</p>`;
  }
  if (data.category) {
    customFieldsHtml += `<p style="margin: 0 0 8px 0; font-size: 14px; color: #113939;"><b>${lang === "lt" ? "Kategorija:" : "Category:"}</b> ${data.category}</p>`;
  }
  if (data.customMessage) {
    customFieldsHtml += `<p style="margin: 10px 0 0 0; font-size: 14px; color: #333333; line-height: 1.5;">${data.customMessage}</p>`;
  }
  if (data.streamLink) {
    customFieldsHtml += `
      <div style="text-align: center; margin: 20px 0 10px 0;">
        <a href="${data.streamLink}" target="_blank" style="background-color: #113939; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 14px;">
          ${lang === "lt" ? "Žiūrėti transliaciją YouTube" : "Watch Live on YouTube"}
        </a>
      </div>
    `;
  }

  return `
    ${emailWrapperStart}
      <h3 style="color: #113939; margin: 0 0 16px 0; font-size: 20px;">${greeting}</h3>
      <p style="font-size: 15px; color: #2B3A3A; line-height: 1.6; margin: 0 0 15px 0;">${t.body}</p>
      
      <div style="${emailBoxStyle}">
        <p style="margin: 0 0 12px 0; font-weight: bold; color: #113939; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${t.detailsTitle}</p>
        ${customFieldsHtml}
      </div>

      <p style="font-size: 14px; color: #4B6363; line-height: 1.5; margin: 15px 0 0 0;">${t.note}</p>
    ${emailWrapperEnd}
  `;
}
