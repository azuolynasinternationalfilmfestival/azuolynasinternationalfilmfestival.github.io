const emailWrapperStart = `
<div style="background-color: #040d0c; padding: 35px 15px; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <div style="max-width: 580px; margin: 0 auto; background-color: #0a1716; padding: 35px 26px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.25); box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
    <div style="text-align: center; margin-bottom: 26px;">
      <img src="https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/azuolynasfilmfest.webp?alt=media" alt="Ąžuolynas Film Fest" style="max-height: 72px; width: auto; display: inline-block;">
      <h2 style="color: #ECFDF5; margin: 16px 0 4px 0; font-size: 19px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">Ąžuolynas Film Festival</h2>
      <p style="color: #6ee7b7; margin: 0; font-size: 13px; font-family: 'Space Grotesk', sans-serif; opacity: 0.9;">An unusual view at ordinary things</p>
    </div>
`;

const emailBoxStyle = `border: 1px solid rgba(16,185,129,0.25); padding: 20px; margin: 22px 0; border-radius: 8px; background-color: #0f2220;`;

const emailWrapperEnd = `
    <hr style="border: none; border-top: 1px solid rgba(16,185,129,0.15); margin: 30px 0 20px 0;">
    <div style="text-align: center; font-family: 'Space Grotesk', sans-serif;">
      <p style="font-size: 13px; color: #8faea8; margin: 0 0 6px 0; line-height: 1.6;">
        <b style="color: #a7f3d0; letter-spacing: 0.5px;">ĄŽUOLYNAS INTERNATIONAL STUDENTS FILM FESTIVAL</b><br>
        Email: <a href="mailto:azuolynasfilmfestival@gmail.com" style="color: #10B981; text-decoration: none; font-weight: 600;">azuolynasfilmfestival@gmail.com</a>
      </p>
      <p style="font-size: 12px; color: #52706a; margin: 0;">Renginio įrašas svetainėje: May 27th, 15:00 (EEST)</p>
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
      note: "Festivalio peržiūros įrašas ir nugalėtojų paskelbimas bus patalpintas oficialioje festivalio svetainėje gegužės 27 d. 15:00 val."
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Sveikiname! Jūsų filmas priimtas",
      heading: "Puikios žinios, {{name}}!",
      body: "Džiaugiamės galėdami pranešti, kad jūsų filmas atitiko visus reikalavimus ir yra oficialiai priimtas į festivalio konkursinę programą!",
      detailsTitle: "Priėmimo informacija:",
      note: "Gegužės 27 d. festivalio įrašas bus pasiekiamas oficialioje festivalio svetainėje."
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Jūsų darbas pateko į PUSFINALĮ!",
      heading: "Sveikiname, {{name}}!",
      body: "Komisija itin aukštai įvertino jūsų kūrybiškumą. Jūsų darbas oficialiai patenka tarp festivalio pusfinalininkų!",
      detailsTitle: "Rezultatai:",
      note: "Pusfinalio filmai bus pristatomi festivalio peržiūros įraše gegužės 27 d."
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | Jūs esate FINALE!",
      heading: "Ypatingas pasiekimas, {{name}}!",
      body: "Jūsų filmas oficialiai pateko į Ąžuolyno kino festivalio FINALĄ ir pretenduoja į prizines vietas bei Žiūrovų simpatijų prizą!",
      detailsTitle: "Finalo informacija:",
      note: "Nugalėtojai bus atskleisti oficialiame festivalio vaizdo įraše gegužės 27 d. 15:00."
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
      note: "The festival screening recording and winners announcement will be published on our official website on May 27th at 15:00 (Lithuanian time)."
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Congratulations! Your Film is Accepted",
      heading: "Congratulations, {{name}}!",
      body: "We are pleased to inform you that your work has met all criteria and is officially accepted into the festival competition!",
      detailsTitle: "Acceptance details:",
      note: "The full event recording will premiere directly on our website on May 27th."
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Your Film is a SEMI-FINALIST!",
      heading: "Exciting news, {{name}}!",
      body: "Our jury was profoundly moved by your work. Your film has officially reached the SEMI-FINALS!",
      detailsTitle: "Status update:",
      note: "Semi-final entries will be featured in the official festival recording on May 27th."
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | You have reached the FINALS!",
      heading: "Tremendous achievement, {{name}}!",
      body: "Your film has officially advanced to the FINALS and is in direct contention for the festival awards!",
      detailsTitle: "Finalist info:",
      note: "Award winners will be unveiled in the official screening video on May 27th at 15:00."
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
  const siteUrl = data.streamLink || "https://azuolynasinternationalfilmfestival.github.io/site/";

  let detailsContent = "";
  if (data.filmTitle) {
    detailsContent += `<p style="margin: 0 0 8px 0; font-size: 15px; color: #ECFDF5; font-family: 'Space Grotesk', sans-serif;"><b style="color: #95b3ad; font-weight: 500;">${lang === "lt" ? "Filmas:" : "Film Title:"}</b> ${data.filmTitle}</p>`;
  }
  if (data.category) {
    detailsContent += `<p style="margin: 0 0 8px 0; font-size: 15px; color: #ECFDF5; font-family: 'Space Grotesk', sans-serif;"><b style="color: #95b3ad; font-weight: 500;">${lang === "lt" ? "Kategorija:" : "Category:"}</b> ${data.category}</p>`;
  }
  if (data.customMessage) {
    detailsContent += `<p style="margin: 12px 0 0 0; font-size: 14px; color: #a7f3d0; line-height: 1.6; border-left: 2px solid #10B981; padding-left: 10px; font-family: 'Space Grotesk', sans-serif;">${data.customMessage}</p>`;
  }

  detailsContent += `
    <div style="text-align: center; margin-top: 22px;">
      <a href="${siteUrl}" target="_blank" style="background-color: #10B981; color: #040d0c; border: none; text-decoration: none; padding: 12px 26px; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.5px;">
        ${lang === "lt" ? "Peržiūrėti Renginį Svetainėje" : "Watch Event on Website"}
      </a>
    </div>
  `;

  return `
    ${emailWrapperStart}
      <h3 style="color: #ffffff; margin: 0 0 14px 0; font-size: 20px; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">${greeting}</h3>
      <p style="font-size: 15px; color: #a7f3d0; line-height: 1.65; margin: 0 0 15px 0; font-family: 'Space Grotesk', sans-serif; opacity: 0.9;">${t.body}</p>
      
      <div style="${emailBoxStyle}">
        <p style="margin: 0 0 12px 0; font-weight: 700; color: #10B981; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; font-family: 'Space Grotesk', sans-serif;">${t.detailsTitle}</p>
        ${detailsContent}
      </div>

      <p style="font-size: 13px; color: #72938c; line-height: 1.6; margin: 16px 0 0 0; font-family: 'Space Grotesk', sans-serif;">${t.note}</p>
    ${emailWrapperEnd}
  `;
}
