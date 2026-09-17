const emailWrapperStart = `
<div style="background-color: #0c1010; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #141919; padding: 40px 32px; border-radius: 12px; border-top: 4px solid #d4af37; border-left: 1px solid #1f2727; border-right: 1px solid #1f2727; border-bottom: 1px solid #1f2727; box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/azuolynasfilmfest.webp?alt=media" alt="Ąžuolynas Film Fest" style="max-height: 80px; width: auto; display: inline-block;">
      <h2 style="color: #e5c378; margin: 18px 0 4px 0; font-size: 19px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700;">Ąžuolynas Film Festival</h2>
      <p style="color: #8c9e9b; margin: 0; font-size: 13px; letter-spacing: 0.5px;">An unusual view at ordinary things</p>
    </div>
`;

const emailBoxStyle = `border: 1px solid #232c2c; padding: 22px; margin: 24px 0; border-radius: 8px; background-color: #181f1f;`;

const emailWrapperEnd = `
    <hr style="border: none; border-top: 1px solid #232d2d; margin: 36px 0 24px 0;">
    <div style="text-align: center;">
      <p style="font-size: 13px; color: #879b98; margin: 0 0 6px 0; line-height: 1.6;">
        <b>ĄŽUOLYNAS INTERNATIONAL STUDENTS FILM FESTIVAL</b><br>
        Email: <a href="mailto:azuolynasfilmfestival@gmail.com" style="color: #d4af37; text-decoration: none;">azuolynasfilmfestival@gmail.com</a>
      </p>
      <p style="font-size: 12px; color: #526360; margin: 0;">May 27th, 15:00 (Lithuanian Time) • Live on YouTube</p>
    </div>
  </div>
</div>
`;

const emailTexts = {
  lt: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Filmo paraiška sėkmingai gauta!",
      heading: "Sveiki, {{name}}!",
      body: "Nuoširdžiai dėkojame! Jūsų filmas sėkmingai pasiekė Ąžuolyno tarptautinio mokinių filmų festivalio organizacinę komandą. Mūsų atrankos komisija peržiūrės filmą.",
      detailsTitle: "Pateiktos paraiškos suvestinė:",
      note: "Oficialus festivalio renginys ir apdovanojimų ceremonija vyks gegužės 27 d. 15:00 val. YouTube platformoje."
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Sveikiname! Jūsų filmas priimtas",
      heading: "Puikios žinios, {{name}}!",
      body: "Su džiaugsmu pranešame, kad jūsų filmas sėkmingai įveikė techninę atranką ir yra oficialiai priimtas į festivalio konkursinę programą!",
      detailsTitle: "Priėmimo informacija:",
      note: "Artėjant renginiui atsiųsime tiesioginę nuorodą į festivalio transliaciją."
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Jūsų darbas pateko į PUSFINALĮ!",
      heading: "Sveikiname, {{name}}!",
      body: "Komisija liko sužavėta jūsų kūrybiniu požiūriu. Džiaugiamės galėdami pranešti, kad jūsų filmas pateko tarp oficialių festivalio pusfinalininkų!",
      detailsTitle: "Rezultatai:",
      note: "Pusfinalininkų darbai bus pristatomi gegužės 27 d. festivalio metu."
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | Jūs esate FINALE!",
      heading: "Ypatingas pasiekimas, {{name}}!",
      body: "Jūsų filmas oficialiai pateko į Ąžuolyno kino festivalio FINALĄ ir pretenduoja į 1, 2, 3 vietas bei Žiūrovų simpatijų prizą!",
      detailsTitle: "Finalo informacija:",
      note: "Nugalėtojai bus paskelbti tiesioginės YouTube transliacijos metu gegužės 27 d. 15:00."
    },
    winner: {
      sub: "Ąžuolynas Film Fest | SVEIKINAME TAPUS FESTIVALIO LAUREATU!",
      heading: "Nuoširdūs sveikinimai, {{name}}!",
      body: "Komisijos sprendimu jūsų filmas pelnė apdovanojimą Ąžuolyno tarptautiniame mokinių filmų festivalyje! Dėkojame už jūsų talentą bei išskirtinę viziją.",
      detailsTitle: "Apdovanojimo informacija:",
      note: "Netrukus susisieksime asmeniškai dėl diplomo ir prizo perdavimo."
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Informacija apie jūsų paraišką",
      heading: "Sveiki, {{name}},",
      body: "Dėkojame, kad atsiuntėte savo filmą. Nors šį kartą jūsų kūrinys nepateko į kitą festivalio etapą, labai vertiname jūsų kūrybą ir pastangas.",
      detailsTitle: "Atrankos rezultatas:",
      note: "Nenustokite kurti ir perteikti savo pasaulio matymo! Lauksime jūsų dalyvaujant kitais metais."
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | Transliacija prasideda gegužės 27 d. 15:00!",
      heading: "Sveiki, {{name}}!",
      body: "Primename, kad jau gegužės 27 d. 15:00 (Lietuvos laiku) startuoja oficiali Ąžuolyno filmų festivalio peržiūra ir laureatų paskelbimas.",
      detailsTitle: "Prisijungimo duomenys:",
      note: "Prisijunkite ir palaikykite jaunuosius kino kūrėjus iš viso pasaulio!"
    }
  },
  en: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Submission Received Successfully!",
      heading: "Hello, {{name}}!",
      body: "Thank you for participating! We have safely received your film entry for the Ąžuolynas International Students Film Festival. Our jury has begun review procedures.",
      detailsTitle: "Submission summary:",
      note: "The official live festival screening and awards premiere will take place on May 27th at 15:00 (Lithuanian time) on YouTube."
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Congratulations! Your Film is Accepted",
      heading: "Congratulations, {{name}}!",
      body: "We are pleased to inform you that your work has met all festival guidelines and is officially accepted into the competition program!",
      detailsTitle: "Acceptance details:",
      note: "We will email you the official live broadcast access link prior to the event."
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Your Film is a SEMI-FINALIST!",
      heading: "Exciting news, {{name}}!",
      body: "Our jury was profoundly moved by your cinematic execution. We are thrilled to share that your film has officially reached the SEMI-FINALS!",
      detailsTitle: "Status update:",
      note: "Semi-final entries will be celebrated during the live showcase on May 27th."
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | You have reached the FINALS!",
      heading: "Tremendous achievement, {{name}}!",
      body: "Your film has officially advanced to the festival FINALS and is in direct contention for the top awards and Audience Choice prize!",
      detailsTitle: "Finalist info:",
      note: "Award winners will be officially announced live on YouTube on May 27th at 15:00."
    },
    winner: {
      sub: "Ąžuolynas Film Fest | CONGRATULATIONS FESTIVAL LAUREATE!",
      heading: "Bravo, {{name}}!",
      body: "We are honoured to declare your film an official winner of the Ąžuolynas International Students Film Festival! Thank you for sharing your perspective with our global audience.",
      detailsTitle: "Award record:",
      note: "Our team will reach out directly through this email thread regarding prizes and official diplomas."
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Update regarding your film entry",
      heading: "Hello, {{name}},",
      body: "Thank you for submitting your work to our festival. While your entry did not make the final selection this season, we truly value your unique storytelling spirit.",
      detailsTitle: "Review conclusion:",
      note: "Never put down the camera. Continue creating and we look forward to reviewing your future films!"
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | YouTube Live Stream Link (May 27th)",
      heading: "Hello, {{name}}!",
      body: "Our festival live screening begins on May 27th at 15:00 (Lithuanian time). Tune in to celebrate youth cinema across the globe!",
      detailsTitle: "Viewing details:",
      note: "Click the access link below to launch the live stream."
    }
  }
};

function generateEmailHtml(lang, templateKey, data) {
  const t = emailTexts[lang][templateKey];
  const greeting = t.heading.replace("{{name}}", data.name || "Filmmaker");

  let detailsContent = "";
  if (data.filmTitle) {
    detailsContent += `<p style="margin: 0 0 8px 0; font-size: 14px; color: #dcdede;"><b>${lang === "lt" ? "Filmas:" : "Film Title:"}</b> ${data.filmTitle}</p>`;
  }
  if (data.category) {
    detailsContent += `<p style="margin: 0 0 8px 0; font-size: 14px; color: #dcdede;"><b>${lang === "lt" ? "Kategorija:" : "Category:"}</b> ${data.category}</p>`;
  }
  if (data.customMessage) {
    detailsContent += `<p style="margin: 12px 0 0 0; font-size: 14px; color: #e5c378; line-height: 1.6; border-left: 2px solid #d4af37; padding-left: 12px;">${data.customMessage}</p>`;
  }
  if (data.streamLink) {
    detailsContent += `
      <div style="text-align: center; margin-top: 22px;">
        <a href="${data.streamLink}" target="_blank" style="background: linear-space; background-color: #d4af37; color: #0c1010; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; letter-spacing: 0.5px;">
          ${lang === "lt" ? "Atidaryti YouTube Transliaciją" : "Watch on YouTube"}
        </a>
      </div>
    `;
  }

  return `
    ${emailWrapperStart}
      <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">${greeting}</h3>
      <p style="font-size: 15px; color: #afbfbc; line-height: 1.65; margin: 0 0 15px 0;">${t.body}</p>
      
      <div style="${emailBoxStyle}">
        <p style="margin: 0 0 14px 0; font-weight: 700; color: #e5c378; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${t.detailsTitle}</p>
        ${detailsContent}
      </div>

      <p style="font-size: 13px; color: #758a87; line-height: 1.6; margin: 16px 0 0 0;">${t.note}</p>
    ${emailWrapperEnd}
  `;
}
