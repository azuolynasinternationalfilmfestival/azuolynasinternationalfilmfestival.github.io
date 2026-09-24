/**
 * Ąžuolynas International Students Film Festival
 * Premium Responsive HTML Email Templates
 * 
 * Compatible with all major email clients:
 * Gmail (Web, iOS, Android), Apple Mail, Outlook (Windows, Mac, Web), Yahoo Mail, Thunderbird.
 */

// HTML entity escaper to protect against broken email rendering
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Visual theme palette
const EMAIL_THEME = {
  bgDark: "#071C18",
  cardBg: "#0D2923",
  boxBg: "#0A221D",
  accent: "#6FA58A",
  accentLight: "#9BC4AE",
  accentGold: "#D4AF37",
  textLight: "#F1F3EE",
  textMuted: "#AABBB2",
  textDim: "#6B8579",
  borderDark: "#153D34",
  borderAccent: "rgba(111, 165, 138, 0.28)",
  logoUrl: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/azuolynasfilmfest.webp?alt=media",
  siteUrl: "https://azuolynasinternationalfilmfestival.github.io/",
  adminUrl: "https://azuolynasinternationalfilmfestival.github.io/admin.html",
  contactEmail: "azuolynasfilmfestival@gmail.com"
};

// Status badges metadata (color, icon, Lithuanian & English labels)
const STATUS_BADGES = {
  submissionReceived: {
    icon: "📋",
    color: "#6FA58A",
    bg: "rgba(111, 165, 138, 0.15)",
    border: "#6FA58A",
    labelLt: "PARAIŠKA GAUTA",
    labelEn: "SUBMISSION RECEIVED"
  },
  accepted: {
    icon: "🎬",
    color: "#78C29D",
    bg: "rgba(120, 194, 157, 0.18)",
    border: "#78C29D",
    labelLt: "PRIIMTA Į KONKURSĄ",
    labelEn: "OFFICIALLY ACCEPTED"
  },
  semiFinalist: {
    icon: "🌟",
    color: "#8AE0BA",
    bg: "rgba(138, 224, 186, 0.18)",
    border: "#8AE0BA",
    labelLt: "PUSFINALIS",
    labelEn: "SEMI-FINALIST"
  },
  finalist: {
    icon: "🏆",
    color: "#F3C969",
    bg: "rgba(243, 201, 105, 0.18)",
    border: "#F3C969",
    labelLt: "FINALAS",
    labelEn: "FESTIVAL FINALIST"
  },
  winner: {
    icon: "👑",
    color: "#FFD700",
    bg: "rgba(255, 215, 0, 0.22)",
    border: "#FFD700",
    labelLt: "FESTIVALIO LAUREATAS",
    labelEn: "FESTIVAL LAUREATE"
  },
  rejected: {
    icon: "🤍",
    color: "#AABBB2",
    bg: "rgba(170, 187, 178, 0.12)",
    border: "#AABBB2",
    labelLt: "ATRANKOS INFORMACIJA",
    labelEn: "SELECTION UPDATE"
  },
  eventReminder: {
    icon: "🍿",
    color: "#8AE0BA",
    bg: "rgba(138, 224, 186, 0.18)",
    border: "#8AE0BA",
    labelLt: "PERŽIŪROS ĮRAŠAS",
    labelEn: "FESTIVAL BROADCAST"
  },
  adminNotification: {
    icon: "⚡",
    color: "#6FA58A",
    bg: "rgba(111, 165, 138, 0.18)",
    border: "#6FA58A",
    labelLt: "NAUJA PARAIŠKA",
    labelEn: "NEW DOSSIER"
  }
};

const emailTexts = {
  lt: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Filmo paraiška sėkmingai gauta!",
      preheader: "Dėkojame už paraišką! Jūsų filmas sėkmingai pasiekė festivalio atrankos komisiją.",
      heading: "Sveiki, {{name}}!",
      body: "Nuoširdžiai dėkojame už dalyvavimą! Jūsų filmo paraiška sėkmingai pasiekė Ąžuolyno tarptautinio mokinių filmų festivalio organizacinį komitetą. Mūsų komisija netrukus peržiūrės filmą ir patikrins atitiktį festivalio taisyklėms.",
      detailsTitle: "Pateiktos paraiškos suvestinė",
      note: "Oficialus festivalio filmų peržiūros įrašas bei laureatų paskelbimas įvyks festivalio ceremonijoje Kaune 2026 m. balandžio 17 d.",
      ctaText: "Apsilankyti Festivalio Svetainėje"
    },
    adminNotification: {
      sub: "Nauja paraiška festivaliui!",
      preheader: "Užregistruota nauja dalyvio paraiška festivalio duomenų bazėje.",
      heading: "Gauta nauja filmo paraiška",
      body: "Festivalio sistemoje ką tik sėkmingai užregistruota nauja dalyvio paraiška. Žemiau pateikiami visi autoriaus, techninės įrangos bei filmo duomenys.",
      detailsTitle: "Dalyvio ir filmo byla",
      ctaText: "Atverti Valdymo Skydą"
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Sveikiname! Jūsų filmas priimtas",
      preheader: "Puikios žinios! Jūsų filmas atitiko visus reikalavimus ir priimtas į konkursinę programą.",
      heading: "Puikios žinios, {{name}}!",
      body: "Džiaugiamės galėdami pranešti, kad jūsų filmas atitiko visus festivalio reikalavimus (iki 3 min. trukmė, filmavimas telefonu/planšete, mokinių kūryba) ir yra oficialiai priimtas į oficialią konkursinę programą!",
      detailsTitle: "Priėmimo informacija",
      note: "Balandžio 17 d. festivalio apdovanojimų ceremonija ir įrašas bus pasiekiamas oficialioje festivalio platformoje.",
      ctaText: "Peržiūrėti Konkurso Programą"
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Jūsų darbas pateko į PUSFINALĮ!",
      preheader: "Sveikiname! Vertinimo komisija jūsų kūrinį atrinko tarp oficialių pusfinalininkų.",
      heading: "Sveikiname, {{name}}!",
      body: "Atrankos komisija itin aukštai įvertino jūsų filmo originalumą, kinematografiją bei temos atskleidimą. Jūsų darbas oficialiai patenka tarp festivalio PUSFINALININKŲ!",
      detailsTitle: "Pusfinalio rezultatai",
      note: "Pusfinalio filmai bus pristatomi festivalio peržiūros programoje 2026 m. balandžio 17 d.",
      ctaText: "Sekti Festivalio Naujienas"
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | Jūs esate FINALE!",
      preheader: "Ypatingas pasiekimas! Jūsų filmas pateko į oficialų finalą ir varžosi dėl prizinių vietų.",
      heading: "Ypatingas pasiekimas, {{name}}!",
      body: "Nuoširdžiai sveikiname! Jūsų filmas oficialiai pateko į Ąžuolyno kino festivalio FINALĄ ir pretenduoja į prizines vietas, statulėles bei Žiūrovų simpatijų prizą.",
      detailsTitle: "Finalo informacija",
      note: "Laureatai bus apdovanoti iškilmingoje ceremonijoje Kaune 2026 m. balandžio 17 d.",
      ctaText: "Atverti Finalo Programą"
    },
    winner: {
      sub: "Ąžuolynas Film Fest | SVEIKINAME TAPUS FESTIVALIO LAUREATU!",
      preheader: "Nuostabi pergalė! Jūsų filmas pelnė apdovanojimą Ąžuolyno tarptautiniame filmų festivalyje.",
      heading: "Nuoširdūs sveikinimai, {{name}}!",
      body: "Komisijos ir žiūrovų sprendimu jūsų filmas pelnė oficialų apdovanojimą Ąžuolyno tarptautiniame mokinių filmų festivalyje! Nuoširdžiai dėkojame už jūsų talentą, drąsią viziją ir kino kalbos meistriškumą.",
      detailsTitle: "Apdovanojimo informacija",
      note: "Festivalio organizatoriai netrukus asmeniškai susisieks su jumis dėl diplomų, medalių bei prizų perdavimo.",
      ctaText: "Peržiūrėti Laureatų Garbės Lentą"
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Informacija apie jūsų paraišką",
      preheader: "Dėkojame už jūsų dalyvavimą ir kūrybiškumą Ąžuolyno filmų festivalyje.",
      heading: "Sveiki, {{name}},",
      body: "Nuoširdžiai dėkojame už jūsų dalyvavimą festivalyje ir pasidalintą kūrinį. Šiais metais sulaukėme ypač didelio paraiškų skaičiaus, todėl atranka buvo itin konkurencinga. Nors jūsų darbas šį kartą nepateko į kitą etapą, komisija labai vertina jūsų kūrybinį potencialą ir pastangas.",
      detailsTitle: "Atrankos informacija",
      note: "Niekada nesustokite kurti! Kiekvienas kadras ugdo režisūrinį meistriškumą. Nekantriai lauksime jūsų filmų kitoje festivalio laidoje.",
      ctaText: "Aplankyti Festivalio Svetainę"
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | Festivalio įrašas jau prieinamas svetainėje!",
      preheader: "Oficialus festivalio filmų ir nugalėtojų vaizdo įrašas jau pasiekiamas tiesiogiai svetainėje.",
      heading: "Sveiki, {{name}}!",
      body: "Informuojame, kad oficialus festivalio konkursinių filmų, ceremonijos akimirkų bei nugalėtojų paskelbimo vaizdo įrašas jau patalpintas tiesiogiai festivalio svetainėje!",
      detailsTitle: "Peržiūros informacija",
      note: "Kviečiame patogiai įsitaisyti ir peržiūrėti jaunųjų kino talentų kūrinius.",
      ctaText: "Žiūrėti Festivalio Įrašą"
    }
  },
  en: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Submission Received Successfully!",
      preheader: "Thank you for entering! Your short film has safely reached the festival jury.",
      heading: "Hello, {{name}}!",
      body: "Thank you for participating! We have safely received your film submission for the Ąžuolynas International Students Film Festival. Our selection committee will review your work and verify technical specifications.",
      detailsTitle: "Submission Dossier Summary",
      note: "The official festival screening broadcast and winner announcements will take place on April 17th, 2026.",
      ctaText: "Visit Official Festival Platform"
    },
    adminNotification: {
      sub: "New Film Festival Submission!",
      preheader: "A new participant film submission has been logged into the festival database.",
      heading: "New Film Entry Submitted",
      body: "A new filmmaker has just registered an entry in the festival database. Review full metadata, technical parameters, and media assets below.",
      detailsTitle: "Participant & Film Dossier",
      ctaText: "Open Admin Panel"
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Congratulations! Your Film is Accepted",
      preheader: "Great news! Your work meets all festival criteria and is officially in competition.",
      heading: "Congratulations, {{name}}!",
      body: "We are thrilled to inform you that your work has met all submission criteria (max 3 minutes runtime, captured on mobile phone/tablet, student-directed) and is officially accepted into the festival competition program!",
      detailsTitle: "Acceptance Record",
      note: "The full event broadcast will premiere directly on our platform on April 17th, 2026.",
      ctaText: "Explore Competition Program"
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Your Film is a SEMI-FINALIST!",
      preheader: "Exciting news! The jury has selected your work among the official semi-finalists.",
      heading: "Exciting news, {{name}}!",
      body: "Our jury was profoundly moved by your creative voice, camera work, and narrative approach. Your work has officially advanced to the festival SEMI-FINALS!",
      detailsTitle: "Semi-Final Status",
      note: "Semi-final selections will be highlighted in the official festival broadcast on April 17th, 2026.",
      ctaText: "Follow Festival Updates"
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | You have reached the FINALS!",
      preheader: "Outstanding achievement! Your film has reached the finals and is in contention for awards.",
      heading: "Tremendous achievement, {{name}}!",
      body: "Warmest congratulations! Your film has officially reached the FINALS of the Ąžuolynas Film Festival and is in direct contention for the Grand Prix, category prizes, and the Audience Choice Award.",
      detailsTitle: "Finalist Dossier",
      note: "Award winners will be officially unveiled during the ceremony in Kaunas on April 17th, 2026.",
      ctaText: "View Finalist Showcase"
    },
    winner: {
      sub: "Ąžuolynas Film Fest | CONGRATULATIONS FESTIVAL LAUREATE!",
      preheader: "Incredible victory! Your film has earned an award at the Ąžuolynas International Film Festival.",
      heading: "Bravo, {{name}}!",
      body: "By the decision of our international jury and audience vote, we are deeply honoured to declare your film an official WINNER of the Ąžuolynas International Students Film Festival! Thank you for your inspiring creativity and cinematic boldness.",
      detailsTitle: "Award Record",
      note: "Our organizing team will reach out personally regarding the delivery of your diploma, medal, and festival award.",
      ctaText: "View Winners Hall of Fame"
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Update regarding your film entry",
      preheader: "Thank you for submitting your creative work to the Ąžuolynas Film Festival.",
      heading: "Hello, {{name}},",
      body: "Thank you sincerely for sharing your story with the Ąžuolynas Film Festival. We received a record number of wonderful submissions from across several continents this year. While your film was not selected for this season's shortlist, our jury was genuinely inspired by your creative passion.",
      detailsTitle: "Selection Record",
      note: "Keep experimenting and filming! Every project builds mastery. We warmly encourage you to submit to our next edition.",
      ctaText: "Visit Festival Platform"
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | Festival Recording Now Available On Site!",
      preheader: "The official festival recording and award ceremony is now published directly on our website.",
      heading: "Hello, {{name}}!",
      body: "The official video recording of the Ąžuolynas Film Festival—including student screenings and the gala award ceremony—is now live on our website!",
      detailsTitle: "Broadcast Information",
      note: "Sit back and enjoy the remarkable films crafted by youth creators from around the world.",
      ctaText: "Watch Festival Broadcast"
    }
  }
};

/**
 * Builds the top-level HTML email wrapper with full responsive table architecture,
 * Outlook mso conditions, dark-theme styling, and zero-width preheader.
 */
function buildEmailDocument({ lang, preheader, statusKey, childrenHtml }) {
  const badge = STATUS_BADGES[statusKey] || STATUS_BADGES.submissionReceived;
  const badgeLabel = lang === "lt" ? badge.labelLt : badge.labelEn;
  const isLt = lang === "lt";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${isLt ? 'lt' : 'en'}" xml:lang="${isLt ? 'lt' : 'en'}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>Ąžuolynas Film Festival</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; background-color: #071C18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a { color: #9BC4AE; text-decoration: none; }
    a:hover { text-decoration: underline !important; }
    .btn-primary:hover { background-color: #17453B !important; border-color: #8AE0BA !important; }
    @media screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-card { padding: 24px 18px !important; }
      .meta-grid-label, .meta-grid-value { display: block !important; width: 100% !important; }
      .meta-grid-value { padding-top: 2px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #071C18; color: #F1F3EE;">

  <!-- Invisible Preheader snippet for email inbox list -->
  <div style="display: none; font-size: 1px; color: #071C18; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader || "Ąžuolynas International Students Film Festival")}
    &#847; &zwnj; &nbsp; &#8199; &#847; &zwnj; &nbsp; &#8199; &#847; &zwnj; &nbsp; &#8199;
  </div>

  <!-- Background container -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #071C18; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 12px 40px 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-shell" style="max-width: 600px; margin: 0 auto;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 0 0 22px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${EMAIL_THEME.siteUrl}" target="_blank" style="text-decoration: none;">
                      <img src="${EMAIL_THEME.logoUrl}" alt="Ąžuolynas Film Festival" width="76" height="76" style="display: block; width: 76px; height: 76px; border-radius: 50%; border: 2px solid rgba(111,165,138,0.45); background-color: #0D2923;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 21px; font-weight: 700; letter-spacing: -0.01em; color: #F1F3EE; line-height: 1.25;">
                      Ąžuolynas Film Festival
                    </h1>
                    <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE; font-weight: 600;">
                      ${isLt ? "Tarptautinis Mokinių Filmų Festivalis" : "International Students Film Festival"}
                    </p>
                    <p style="margin: 3px 0 0 0; font-size: 11px; font-style: italic; color: #6B8579;">
                      ${isLt ? "„Neįprastas žvilgsnis į įprastus dalykus“" : "“An unusual view at ordinary things”"}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD CONTAINER -->
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-card" style="background-color: #0D2923; border-radius: 8px; border-top: 3px solid ${badge.color}; border-left: 1px solid rgba(111,165,138,0.22); border-right: 1px solid rgba(111,165,138,0.22); border-bottom: 1px solid rgba(111,165,138,0.22); box-shadow: 0 16px 36px rgba(0,0,0,0.55); padding: 34px 28px;">
                
                <!-- Status Badge -->
                <tr>
                  <td align="left" style="padding-bottom: 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: ${badge.bg}; border: 1px solid ${badge.border}; border-radius: 4px; padding: 5px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${badge.color};">
                          <span style="margin-right: 6px;">${badge.icon}</span> ${escapeHtml(badgeLabel)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Slot -->
                <tr>
                  <td style="color: #F1F3EE; font-size: 14px; line-height: 1.65;">
                    ${childrenHtml}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FESTIVAL ROADMAP / WHAT'S NEXT (Only for non-admin emails) -->
          ${statusKey !== 'adminNotification' ? `
          <tr>
            <td style="padding-top: 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0A221D; border-radius: 6px; border: 1px solid rgba(111,165,138,0.18); padding: 18px 22px;">
                <tr>
                  <td style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE; padding-bottom: 8px;">
                    ${isLt ? "Svarbiausios festivalio gairės:" : "Key Festival Milestones:"}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #AABBB2; line-height: 1.6;">
                    <div style="margin-bottom: 4px;">
                      <strong style="color:#F1F3EE;">1. ${isLt ? "Atranka ir atitiktis" : "Selection & Compliance"}:</strong> ${isLt ? "Filmai tikrinami dėl &le; 180s trukmės ir filmavimo telefonu." : "Entries verified for &le; 180s runtime and phone capture."}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong style="color:#F1F3EE;">2. ${isLt ? "Vertinimas" : "Jury & Voting"}:</strong> ${isLt ? "Tarptautinė komisija vertina idėjos gilumą ir originalumą." : "Jury reviews creative depth and aesthetic perspective."}
                    </div>
                    <div>
                      <strong style="color:#F1F3EE;">3. ${isLt ? "Ceremonija 2026-04-17" : "Ceremony April 17, 2026"}:</strong> ${isLt ? "Oficiali peržiūra Kauno tarptautinėje gimnazijoje ir internete." : "Live screening at Kaunas International Gymnasium & online."}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding: 28px 10px 0 10px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="border-top: 1px solid rgba(111,165,138,0.18); padding-top: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #F1F3EE; letter-spacing: 0.04em;">
                      ĄŽUOLYNAS INTERNATIONAL STUDENTS FILM FESTIVAL
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #AABBB2; line-height: 1.6;">
                      Kauno tarptautinė gimnazija &bull; Kaunas, Lietuva<br>
                      ${isLt ? "Oficialus el. paštas:" : "Official Contact:"} <a href="mailto:${EMAIL_THEME.contactEmail}" style="color: #9BC4AE; font-weight: 600; text-decoration: none;">${EMAIL_THEME.contactEmail}</a>
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #6B8579;">
                      <a href="${EMAIL_THEME.siteUrl}" target="_blank" style="color: #9BC4AE; text-decoration: none; margin: 0 8px;">
                        ${isLt ? "Oficiali platforma" : "Official Website"} &rarr;
                      </a>
                      &bull;
                      <a href="${EMAIL_THEME.siteUrl}#terms" target="_blank" style="color: #9BC4AE; text-decoration: none; margin: 0 8px;">
                        ${isLt ? "Taisyklės" : "Rules & Terms"}
                      </a>
                      &bull;
                      <a href="${EMAIL_THEME.siteUrl}${isLt ? 'lt/' : 'en/'}faq.html" target="_blank" style="color: #9BC4AE; text-decoration: none; margin: 0 8px;">
                        ${isLt ? "DUK Gidas" : "FAQ Knowledge Base"}
                      </a>
                    </p>
                    <p style="margin: 0; font-size: 10px; color: #4A6357; line-height: 1.5;">
                      ${isLt
                        ? "Šis el. laiškas išsiųstas automatiškai, nes jūsų el. pašto adresas susietas su dalyvavimu Ąžuolyno filmų festivalyje."
                        : "You received this email because your contact was provided for the Ąžuolynas International Students Film Festival."}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Builds a stylish, key-value specification row inside the email dossier card.
 */
function buildMetaRow(label, value, isLast = false) {
  if (!value) return "";
  return `
    <tr>
      <td valign="top" style="padding: 7px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(111,165,138,0.12)'}; font-size: 13px; color: #AABBB2; width: 36%; font-weight: 500;">
        ${escapeHtml(label)}
      </td>
      <td valign="top" align="left" style="padding: 7px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(111,165,138,0.12)'}; font-size: 13px; color: #F1F3EE; font-weight: 600;">
        ${value}
      </td>
    </tr>
  `;
}

/**
 * Generates an applicant email (submission confirmation, acceptance, finalist, winner, etc.)
 */
function generateEmailHtml(lang, templateKey, data = {}) {
  const currentLang = (lang === "lt" || lang === "en") ? lang : "lt";
  const t = emailTexts[currentLang][templateKey] || emailTexts[currentLang].submissionReceived;
  const isLt = currentLang === "lt";

  const rawName = data.name || (isLt ? "Kūrėjau" : "Filmmaker");
  const greeting = t.heading.replace("{{name}}", escapeHtml(rawName));
  const siteUrl = data.streamLink || EMAIL_THEME.siteUrl;

  // Build key-value dossier lines
  let dossierRows = "";
  if (data.filmTitle) {
    dossierRows += buildMetaRow(isLt ? "Filmo pavadinimas:" : "Film Title:", `<span style="font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: #9BC4AE; font-weight: 700;">„${escapeHtml(data.filmTitle)}“</span>`);
  }
  if (data.category) {
    dossierRows += buildMetaRow(isLt ? "Amžiaus grupė:" : "Category:", escapeHtml(data.category));
  }
  if (data.institution) {
    dossierRows += buildMetaRow(isLt ? "Mokykla / Studija:" : "School / Studio:", escapeHtml(data.institution));
  }
  if (data.deviceModel) {
    dossierRows += buildMetaRow(isLt ? "Kameros įrenginys:" : "Filming Device:", `📱 ${escapeHtml(data.deviceModel)}`);
  }
  if (data.videoDurationSeconds) {
    dossierRows += buildMetaRow(isLt ? "Patvirtinta trukmė:" : "Verified Runtime:", `⏱️ ${escapeHtml(data.videoDurationSeconds)} s (&le; 180s)`);
  }

  // Custom jury/organizer note block if provided
  let customMessageBlock = "";
  if (data.customMessage) {
    customMessageBlock = `
      <div style="background-color: rgba(18,55,47,0.45); border-left: 3px solid #6FA58A; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9BC4AE;">
          ${isLt ? "Organizatorių žinutė:" : "Organizer's Note:"}
        </p>
        <p style="margin: 0; font-size: 13px; color: #F1F3EE; font-style: italic; line-height: 1.6;">
          ${escapeHtml(data.customMessage)}
        </p>
      </div>
    `;
  }

  // Primary Call-to-action button
  const ctaBtnText = t.ctaText || (isLt ? "Atverti Festivalio Svetainę" : "Open Festival Website");
  const ctaButtonHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 26px auto 14px auto;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: #12372F; border: 1px solid #6FA58A;">
          <a href="${siteUrl}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 32px; font-size: 14px; font-weight: 700; color: #F1F3EE; text-decoration: none; border-radius: 6px; letter-spacing: 0.02em;">
            ${escapeHtml(ctaBtnText)} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  // Assembled inner body content
  const childrenHtml = `
    <h2 style="color: #F1F3EE; margin: 0 0 14px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">
      ${greeting}
    </h2>
    <p style="font-size: 14px; color: #AABBB2; line-height: 1.7; margin: 0 0 18px 0;">
      ${t.body}
    </p>

    ${dossierRows ? `
      <div style="background-color: #0A221D; border: 1px solid rgba(111,165,138,0.24); border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: 700; color: #9BC4AE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;">
          ${t.detailsTitle}
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${dossierRows}
        </table>
      </div>
    ` : ''}

    ${customMessageBlock}

    ${ctaButtonHtml}

    <p style="font-size: 12px; color: #6B8579; line-height: 1.6; margin: 18px 0 0 0; text-align: center;">
      ${t.note || ''}
    </p>
  `;

  return buildEmailDocument({
    lang: currentLang,
    preheader: t.preheader,
    statusKey: templateKey,
    childrenHtml
  });
}

/**
 * Generates an administrative notification email sent to the festival committee.
 */
function generateAdminNotificationHtml(lang, data = {}) {
  const currentLang = (lang === "lt" || lang === "en") ? lang : "lt";
  const t = emailTexts[currentLang].adminNotification;
  const isLt = currentLang === "lt";

  const adminUrl = EMAIL_THEME.adminUrl;
  const filmTitle = data.filmTitle || "-";
  const authorName = data.name || "-";
  const applicantEmail = data.email || "-";
  const duration = data.videoDurationSeconds ? `${data.videoDurationSeconds} s` : "-";

  let dossierRows = "";
  dossierRows += buildMetaRow(isLt ? "Autorius:" : "Applicant:", `<b>${escapeHtml(authorName)}</b> (<a href="mailto:${escapeHtml(applicantEmail)}" style="color:#9BC4AE; text-decoration:none;">${escapeHtml(applicantEmail)}</a>)`);
  dossierRows += buildMetaRow(isLt ? "Filmo pavadinimas:" : "Film Title:", `<span style="color:#9BC4AE; font-weight:700;">„${escapeHtml(filmTitle)}“</span>`);
  dossierRows += buildMetaRow(isLt ? "Kategorija ir amžius:" : "Category & Age:", `${escapeHtml(data.category || '-')} (${escapeHtml(data.age || '-')} m.)`);
  dossierRows += buildMetaRow(isLt ? "Šalis ir miestas:" : "Location:", escapeHtml(data.location || data.countryCity || '-'));
  dossierRows += buildMetaRow(isLt ? "Mokykla / Studija:" : "Institution:", escapeHtml(data.institution || '-'));
  dossierRows += buildMetaRow(isLt ? "Įrenginio modelis:" : "Device Model:", `📱 ${escapeHtml(data.deviceModel || '-')}`);
  dossierRows += buildMetaRow(isLt ? "Vaizdo įrašo trukmė:" : "Video Runtime:", `⏱️ ${escapeHtml(duration)} ${data.videoDurationSeconds <= 180 ? '✅ (Tinka)' : '⚠️ (>180s)'}`);
  
  if (data.storagePath) {
    dossierRows += buildMetaRow(isLt ? "Saugyklos kelias:" : "Storage Path:", `<code style="font-size:11px; color:#AABBB2;">${escapeHtml(data.storagePath)}</code>`);
  }

  // Synopsis block
  let synopsisBlock = "";
  if (data.synopsis) {
    synopsisBlock = `
      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(111,165,138,0.2);">
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #9BC4AE; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
          ${isLt ? "Filmo idėja / Sinopsis:" : "Concept / Synopsis:"}
        </p>
        <p style="margin: 0; font-size: 13px; color: #F1F3EE; font-style: italic; line-height: 1.6; background-color: rgba(7, 28, 24, 0.4); padding: 10px 14px; border-radius: 4px;">
          ${escapeHtml(data.synopsis)}
        </p>
      </div>
    `;
  }

  // Direct video link button if present
  let videoLinkHtml = "";
  if (data.videoUrl) {
    videoLinkHtml = `
      <div style="text-align: center; margin: 18px 0 6px 0;">
        <a href="${escapeHtml(data.videoUrl)}" target="_blank" style="display: inline-block; background-color: transparent; border: 1px solid rgba(111,165,138,0.4); color: #9BC4AE; font-size: 12px; font-weight: 600; padding: 8px 18px; border-radius: 4px; text-decoration: none;">
          ▶️ ${isLt ? "Atsisiųsti / Peržiūrėti originalų vaizdo failą" : "Download / Stream raw video file"}
        </a>
      </div>
    `;
  }

  const childrenHtml = `
    <h2 style="color: #F1F3EE; margin: 0 0 10px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">
      ${t.heading}
    </h2>
    <p style="font-size: 14px; color: #AABBB2; line-height: 1.65; margin: 0 0 18px 0;">
      ${t.body}
    </p>

    <div style="background-color: #0A221D; border: 1px solid rgba(111,165,138,0.24); border-radius: 6px; padding: 18px 20px; margin: 18px 0;">
      <p style="margin: 0 0 12px 0; font-weight: 700; color: #9BC4AE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;">
        ${t.detailsTitle}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${dossierRows}
      </table>
      ${synopsisBlock}
      ${videoLinkHtml}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 24px auto 8px auto;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: #12372F; border: 1px solid #6FA58A;">
          <a href="${adminUrl}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 30px; font-size: 14px; font-weight: 700; color: #F1F3EE; text-decoration: none; border-radius: 6px; letter-spacing: 0.02em;">
            ${escapeHtml(t.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return buildEmailDocument({
    lang: currentLang,
    preheader: `${t.preheader} ${filmTitle} (${authorName})`,
    statusKey: "adminNotification",
    childrenHtml
  });
}

// Global browser and runtime scope compatibility
if (typeof window !== "undefined") {
  window.emailTexts = emailTexts;
  window.generateEmailHtml = generateEmailHtml;
  window.generateAdminNotificationHtml = generateAdminNotificationHtml;
}
if (typeof globalThis !== "undefined") {
  globalThis.emailTexts = emailTexts;
  globalThis.generateEmailHtml = generateEmailHtml;
  globalThis.generateAdminNotificationHtml = generateAdminNotificationHtml;
}

// Node / CommonJS module export compatibility (for backend/tests)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    emailTexts,
    generateEmailHtml,
    generateAdminNotificationHtml
  };
}
