/**
 * Ąžuolynas International Students Film Festival
 * Premium Responsive HTML Email Templates
 * 
 * Compatible with all major email clients:
 * - Gmail (Web, iOS, Android)
 * - Apple Mail (macOS, iOS)
 * - Outlook (Windows desktop, macOS, Outlook.com, Office 365)
 * - Yahoo Mail, ProtonMail, Thunderbird
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
  bgDark: "#051512",
  cardBg: "#0C241F",
  boxBg: "#081B17",
  accent: "#6FA58A",
  accentLight: "#9BC4AE",
  accentGold: "#D4AF37",
  textLight: "#F8FAF7",
  textMuted: "#BAC9C0",
  textDim: "#7A9689",
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
    bg: "rgba(111, 165, 138, 0.16)",
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
    labelLt: "FESTIVALIO FINALAS",
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
    icon: "✉️",
    color: "#BAC9C0",
    bg: "rgba(186, 201, 192, 0.14)",
    border: "#BAC9C0",
    labelLt: "ATRANKOS INFORMACIJA",
    labelEn: "SELECTION UPDATE"
  },
  eventReminder: {
    icon: "🍿",
    color: "#8AE0BA",
    bg: "rgba(138, 224, 186, 0.18)",
    border: "#8AE0BA",
    labelLt: "CEREMONIJOS ĮRAŠAS",
    labelEn: "FESTIVAL BROADCAST"
  },
  userInvite: {
    icon: "🔑",
    color: "#D4AF37",
    bg: "rgba(212, 175, 55, 0.18)",
    border: "#D4AF37",
    labelLt: "KOMANDOS KVIETIMAS",
    labelEn: "TEAM INVITATION"
  },
  adminNotification: {
    icon: "⚡",
    color: "#6FA58A",
    bg: "rgba(111, 165, 138, 0.18)",
    border: "#6FA58A",
    labelLt: "NAUJA DALYVIO PARAIŠKA",
    labelEn: "NEW APPLICANT DOSSIER"
  }
};

const emailTexts = {
  lt: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Filmo paraiška sėkmingai gauta!",
      preheader: "Dėkojame už paraišką! Jūsų filmas sėkmingai pasiekė festivalio atrankos komisiją.",
      heading: "Sveiki, {{name}}!",
      body: "Nuoširdžiai dėkojame už dalyvavimą! Jūsų filmo paraiška sėkmingai pasiekė Ąžuolyno tarptautinio mokinių filmų festivalio organizacinį komitetą. Mūsų komisija netrukus peržiūrės filmą ir patikrins atitiktį festivalio taisyklėms (iki 180 s trukmė, filmavimas telefonu/planšete, mokinių autorystė).",
      detailsTitle: "Pateiktos paraiškos suvestinė",
      note: "Oficiali festivalio filmų peržiūra bei laureatų apdovanojimo ceremonija įvyks Kaune 2026 m. balandžio 17 d.",
      ctaText: "Apsilankyti Festivalio Svetainėje"
    },
    adminNotification: {
      sub: "Nauja paraiška festivaliui!",
      preheader: "Užregistruota nauja dalyvio paraiška festivalio duomenų bazėje.",
      heading: "Gauta nauja filmo paraiška",
      body: "Festivalio sistemoje ką tik sėkmingai užregistruota nauja mokinio paraiška. Žemiau pateikiami visi autoriaus, techninės įrangos, failo trukmės bei filmo duomenys.",
      detailsTitle: "Dalyvio ir filmo byla",
      ctaText: "Atverti Valdymo Skydą"
    },
    accepted: {
      sub: "Ąžuolynas Film Fest | Sveikiname! Jūsų filmas priimtas",
      preheader: "Puikios žinios! Jūsų filmas atitiko visus reikalavimus ir priimtas į oficialią konkursinę programą.",
      heading: "Puikios žinios, {{name}}!",
      body: "Džiaugiamės galėdami pranešti, kad jūsų filmas atitiko visus festivalio reikalavimus ir yra oficialiai priimtas į konkursinę programą! Jūsų kūrinį vertins tarptautinė žiuri komisija.",
      detailsTitle: "Priėmimo informacija",
      note: "Balandžio 17 d. festivalio apdovanojimų ceremonija ir laureatų paskelbimas vyks Kauno tarptautinėje gimnazijoje.",
      ctaText: "Peržiūrėti Konkurso Programą"
    },
    semiFinalist: {
      sub: "Ąžuolynas Film Fest | Jūsų darbas pateko į PUSFINALĮ!",
      preheader: "Sveikiname! Vertinimo komisija jūsų kūrinį atrinko tarp oficialių pusfinalininkų.",
      heading: "Sveikiname, {{name}}!",
      body: "Atrankos komisija itin aukštai įvertino jūsų filmo originalumą, kinematografiją bei temos „Neįprastas žvilgsnis į įprastus dalykus“ atskleidimą. Jūsų darbas oficialiai patenka tarp festivalio PUSFINALININKŲ!",
      detailsTitle: "Pusfinalio rezultatai",
      note: "Pusfinalio filmai bus pristatomi festivalio peržiūros programoje 2026 m. balandžio 17 d.",
      ctaText: "Sekti Festivalio Naujienas"
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | Jūs esate FINALE!",
      preheader: "Ypatingas pasiekimas! Jūsų filmas pateko į oficialų finalą ir varžosi dėl ąžuolo statulėlių.",
      heading: "Ypatingas pasiekimas, {{name}}!",
      body: "Nuoširdžiai sveikiname! Jūsų filmas oficialiai pateko į Ąžuolyno kino festivalio FINALĄ ir pretenduoja į prizines vietas, natūralaus ąžuolo statulėles bei Žiūrovų simpatijų prizą.",
      detailsTitle: "Finalo informacija",
      note: "Laureatai bus apdovanoti iškilmingoje ceremonijoje Kaune 2026 m. balandžio 17 d.",
      ctaText: "Peržiūrėti Finalininkų Programą"
    },
    winner: {
      sub: "Ąžuolynas Film Fest | SVEIKINAME FESTIVALIO LAUREATĄ!",
      preheader: "Puiki pergalė! Jūsų filmas pelnė apdovanojimą Ąžuolyno kino festivalyje.",
      heading: "Nuoširdžiausi sveikinimai, {{name}}!",
      body: "Komisijos sprendimu bei žiūrovų balsavimu, džiaugiamės galėdami paskelbti jūsų filmą oficialiu Ąžuolyno tarptautinio mokinių filmų festivalio LAUREATU! Ačiū už jūsų talentą, drąsią režisūrą ir jaunųjų kūrėjų balso stiprinimą.",
      detailsTitle: "Apdovanojimo informacija",
      note: "Dėl autorinės ąžuolo statulėlės ir diplomų įteikimo bei pristatymo su jumis asmeniškai susisieks organizatoriai.",
      ctaText: "Žiūrėti Laureatų Galeriją"
    },
    rejected: {
      sub: "Ąžuolynas Film Fest | Informacija apie jūsų filmo paraišką",
      preheader: "Dėkojame už jūsų filmą ir kūrybinį darbą Ąžuolyno kino festivalyje.",
      heading: "Sveiki, {{name}},",
      body: "Nuoširdžiai dėkojame už jūsų filmą ir dalyvavimą festivalyje. Šiais metais sulaukėme itin daug talentingų moksleivių darbų. Nors jūsų filmas šįkart nepateko į trumpąjį konkursinį sąrašą, komisija džiaugiasi jūsų kūrybine drąsa ir linki nenustoti filmuoti!",
      detailsTitle: "Atrankos informacija",
      note: "Kiekvienas sukurtas filmas yra svarbi patirtis. Nuoširdžiai lauksime jūsų naujų filmų kitų metų festivalyje!",
      ctaText: "Apsilankyti Svetainėje"
    },
    eventReminder: {
      sub: "Ąžuolynas Film Fest | Festivalio įrašas jau pasiekiamas svetainėje!",
      preheader: "Oficialus festivalio ceremonijos ir laureatų įrašas paskelbtas festivalio platformoje.",
      heading: "Sveiki, {{name}}!",
      body: "Oficialus Ąžuolyno kino festivalio vaizdo įrašas su moksleivių filmų peržiūra ir iškilminga apdovanojimų ceremonija jau paskelbtas mūsų svetainėje!",
      detailsTitle: "Renginio įrašas",
      note: "Kviečiame patogiai peržiūrėti geriausius mokinių darbus ir ceremonijos akimirkas.",
      ctaText: "Žiūrėti Festivalio Įrašą"
    },
    userInvite: {
      sub: "Ąžuolynas Film Fest | Kvietimas prisijungti prie komandos",
      preheader: "Jums suteikta prieiga prie Ąžuolyno kino festivalio valdymo platformos.",
      heading: "Sveiki, {{name}}!",
      body: "Jūs buvote oficialiai pakviestas prisijungti prie Ąžuolyno tarptautinio mokinių filmų festivalio (Kauno Tarptautinė Gimnazija) valdymo sistemos. Žemiau pateikiami jūsų paskyros aktyvavimo duomenys ir saugus patvirtinimo kodas.",
      detailsTitle: "Paskyros aktyvavimo byla",
      note: "Ši nuoroda skirta tik nurodytam asmeniui. Aktyvuokite savo paskyrą nustatydami saugų slaptažodį.",
      ctaText: "Aktyvuoti Paskyrą Dabar"
    }
  },
  en: {
    submissionReceived: {
      sub: "Ąžuolynas Film Fest | Film Submission Successfully Received!",
      preheader: "Thank you for submitting! Your film entry has reached the festival selection committee.",
      heading: "Hello, {{name}}!",
      body: "Thank you sincerely for participating! Your entry has been safely received by the organizing committee of the Ąžuolynas International Students Film Festival. Our jury will review the film to confirm eligibility (max 180s runtime, smartphone/tablet captured, student-led creation).",
      detailsTitle: "Submission Summary",
      note: "The gala screening and awards ceremony will take place in Kaunas on April 17th, 2026.",
      ctaText: "Visit Festival Platform"
    },
    adminNotification: {
      sub: "New film submission received!",
      preheader: "A new student film dossier has been registered in the database.",
      heading: "New Film Submission Registered",
      body: "A new film has just been submitted via the official platform. Full details, device specifications, runtime verification, and creator contact are compiled below.",
      detailsTitle: "Applicant Dossier",
      ctaText: "Open Admin Dashboard"
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
      body: "Our jury was profoundly moved by your creative voice, camera work, and narrative approach to this year's theme. Your work has officially advanced to the festival SEMI-FINALS!",
      detailsTitle: "Semi-Final Status",
      note: "Semi-final selections will be highlighted in the official festival broadcast on April 17th, 2026.",
      ctaText: "Follow Festival Updates"
    },
    finalist: {
      sub: "Ąžuolynas Film Fest | You have reached the FINALS!",
      preheader: "Outstanding achievement! Your film has reached the finals and is in contention for awards.",
      heading: "Tremendous achievement, {{name}}!",
      body: "Warmest congratulations! Your film has officially reached the FINALS of the Ąžuolynas Film Festival and is in direct contention for the Grand Prix, handmade oak statuettes, and the Audience Choice Award.",
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
      body: "Thank you sincerely for sharing your story with the Ąžuolynas Film Festival. We received a record number of wonderful submissions this season. While your film was not selected for this season's shortlist, our jury was genuinely inspired by your creative passion.",
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
    },
    userInvite: {
      sub: "Ąžuolynas Film Fest | Staff Team Invitation",
      preheader: "You have been invited to the Ąžuolynas Film Festival administration portal.",
      heading: "Hello, {{name}}!",
      body: "You have been officially invited to join the staff committee of the Ąžuolynas International Students Film Festival at Kaunas International Gymnasium. Below are your account credentials and secure verification code.",
      detailsTitle: "Account Activation Record",
      note: "This invitation is personal and confidential. Please activate your account by setting a secure password.",
      ctaText: "Activate My Account Now"
    }
  }
};

/**
 * Builds the top-level HTML email wrapper with fluid responsive table architecture,
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; background-color: #051512; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a { color: #9BC4AE; text-decoration: none; }
    a:hover { text-decoration: underline !important; }
    .btn-primary:hover { background-color: #17453B !important; border-color: #8AE0BA !important; }
    @media screen and (max-width: 600px) {
      .email-shell { width: 100% !important; max-width: 100% !important; }
      .email-card { padding: 20px 14px !important; }
      .meta-grid-label, .meta-grid-value { display: block !important; width: 100% !important; }
      .meta-grid-value { padding-top: 2px !important; }
      .footer-cell { padding: 20px 10px !important; }
      .cta-table { width: 100% !important; }
      .btn-primary { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 14px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #051512; color: #F8FAF7;">

  <!-- Invisible Preheader snippet for email inbox preview -->
  <div style="display: none; font-size: 1px; color: #051512; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader || "Ąžuolynas International Students Film Festival")}
    &#847; &zwnj; &nbsp; &#8199; &#847; &zwnj; &nbsp; &#8199; &#847; &zwnj; &nbsp; &#8199;
  </div>

  <!-- Background container -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #051512; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 8px 36px 8px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-shell" style="max-width: 600px; margin: 0 auto;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <a href="${EMAIL_THEME.siteUrl}" target="_blank" style="text-decoration: none;">
                      <img src="${EMAIL_THEME.logoUrl}" alt="Ąžuolynas Film Festival" width="72" height="72" style="display: block; width: 72px; height: 72px; border-radius: 50%; border: 2px solid rgba(111,165,138,0.45); background-color: #0C241F;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 21px; font-weight: 700; letter-spacing: -0.01em; color: #F8FAF7; line-height: 1.25;">
                      Ąžuolynas Film Festival
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE; font-weight: 700;">
                      ${isLt ? "Tarptautinis Mokinių Filmų Festivalis" : "International Students Film Festival"}
                    </p>
                    <p style="margin: 3px 0 0 0; font-size: 11px; font-style: italic; color: #7A9689;">
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
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-card" style="background-color: #0C241F; border-radius: 8px; border-top: 3px solid ${badge.color}; border-left: 1px solid rgba(111,165,138,0.22); border-right: 1px solid rgba(111,165,138,0.22); border-bottom: 1px solid rgba(111,165,138,0.22); box-shadow: 0 16px 36px rgba(0,0,0,0.55); padding: 32px 24px;">
                <tr>
                  <td>
                    <!-- STATUS BANNER PILL -->
                    <div style="margin-bottom: 20px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td style="background-color: ${badge.bg}; border: 1px solid ${badge.border}; border-radius: 20px; padding: 6px 16px;">
                            <span style="font-size: 11px; font-weight: 700; color: ${badge.color}; letter-spacing: 0.08em; text-transform: uppercase;">
                              ${badge.icon}&nbsp;&nbsp;${escapeHtml(badgeLabel)}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- INNER CONTENT INJECTED -->
                    ${childrenHtml}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EMAIL FOOTER -->
          <tr>
            <td align="center" class="footer-cell" style="padding: 24px 16px 12px 16px; color: #7A9689; font-size: 11px; line-height: 1.6; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #BAC9C0; font-weight: 600;">
                Ąžuolynas International Students Film Festival &copy; 2026
              </p>
              <p style="margin: 0 0 10px 0;">
                Kauno „Ąžuolyno“ kino studija &bull; Kauno tarptautinė gimnazija
              </p>
              <p style="margin: 0 0 12px 0;">
                <a href="${EMAIL_THEME.siteUrl}" target="_blank" style="color: #9BC4AE; text-decoration: underline; margin: 0 8px;">${isLt ? "Oficiali svetainė" : "Official Website"}</a> &bull;
                <a href="mailto:${EMAIL_THEME.contactEmail}" style="color: #9BC4AE; text-decoration: underline; margin: 0 8px;">${EMAIL_THEME.contactEmail}</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #557064;">
                ${isLt 
                  ? "Šis pranešimas išsiųstas remiantis jūsų dalyvavimu festivalyje arba pateikta filmo paraiška. BDAR / GDPR atitiktis užtikrinama."
                  : "You are receiving this communication regarding your film submission or festival participation. Fully GDPR compliant."}
              </p>
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
 * Builds a styled metadata row for tables inside the email card.
 */
function buildMetaRow(label, valueHtml) {
  return `
    <tr>
      <td valign="top" class="meta-grid-label" style="padding: 7px 0; color: #7A9689; font-size: 12px; width: 38%; border-bottom: 1px solid rgba(111, 165, 138, 0.12);">
        ${escapeHtml(label)}
      </td>
      <td valign="top" class="meta-grid-value" style="padding: 7px 0; color: #F8FAF7; font-size: 13px; font-weight: 500; border-bottom: 1px solid rgba(111, 165, 138, 0.12);">
        ${valueHtml}
      </td>
    </tr>
  `;
}

/**
 * Generates an applicant-facing notification email HTML string.
 */
function generateEmailHtml(templateKey, lang, data = {}) {
  const currentLang = (lang === "lt" || lang === "en") ? lang : "lt";
  const texts = emailTexts[currentLang] || emailTexts.lt;
  const t = texts[templateKey] || texts.submissionReceived;
  const isLt = currentLang === "lt";

  const applicantName = data.name || (isLt ? "Dalyvi" : "Filmmaker");
  const filmTitle = data.filmTitle || "-";
  const category = data.category || "-";
  const deviceModel = data.deviceModel || "-";
  const duration = data.videoDurationSeconds ? `${data.videoDurationSeconds} s` : null;

  const headingText = t.heading.replace("{{name}}", escapeHtml(applicantName));

  let metaRows = "";
  metaRows += buildMetaRow(isLt ? "Filmo pavadinimas:" : "Film Title:", `<span style="color:#9BC4AE; font-weight:700;">„${escapeHtml(filmTitle)}“</span>`);
  metaRows += buildMetaRow(isLt ? "Autorius:" : "Director / Author:", escapeHtml(applicantName));
  metaRows += buildMetaRow(isLt ? "Kategorija:" : "Category:", escapeHtml(category));
  if (data.age) {
    metaRows += buildMetaRow(isLt ? "Amžius:" : "Age:", `${escapeHtml(data.age)} ${isLt ? 'm.' : 'y/o'}`);
  }
  if (data.location || data.countryCity) {
    metaRows += buildMetaRow(isLt ? "Miestas, Šalis:" : "Location:", escapeHtml(data.location || data.countryCity));
  }
  metaRows += buildMetaRow(isLt ? "Filmavimo įranga:" : "Filming Device:", `📱 ${escapeHtml(deviceModel)}`);
  if (duration) {
    metaRows += buildMetaRow(isLt ? "Trukmė:" : "Runtime:", `⏱️ ${escapeHtml(duration)} (griežtai &le; 180 s)`);
  }

  // Synopsis block if provided
  let synopsisHtml = "";
  if (data.synopsis) {
    synopsisHtml = `
      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(111,165,138,0.22);">
        <p style="margin: 0 0 5px 0; font-size: 11px; color: #9BC4AE; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
          ${isLt ? "Filmo idėja / Sinopsis:" : "Concept / Synopsis:"}
        </p>
        <p style="margin: 0; font-size: 12px; color: #BAC9C0; font-style: italic; line-height: 1.6;">
          „${escapeHtml(data.synopsis)}“
        </p>
      </div>
    `;
  }

  // Custom feedback/note from admin
  let customMessageBlock = "";
  if (data.customMessage) {
    customMessageBlock = `
      <div style="background-color: rgba(111, 165, 138, 0.12); border-left: 3px solid #6FA58A; padding: 14px 16px; margin: 18px 0; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #9BC4AE; text-transform: uppercase; letter-spacing: 0.08em;">
          ${isLt ? "Komisijos pastaba:" : "Note from the Committee:"}
        </p>
        <p style="margin: 0; font-size: 13px; color: #F8FAF7; line-height: 1.6;">
          ${escapeHtml(data.customMessage)}
        </p>
      </div>
    `;
  }

  const ctaUrl = data.ctaUrl || EMAIL_THEME.siteUrl;
  const ctaButtonHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="cta-table" style="margin: 24px auto 14px auto;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: #12372F; border: 1px solid #6FA58A;">
          <a href="${ctaUrl}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 28px; font-size: 13px; font-weight: 700; color: #F8FAF7; text-decoration: none; border-radius: 6px; letter-spacing: 0.02em;">
            ${escapeHtml(t.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  const childrenHtml = `
    <h2 style="color: #F8FAF7; margin: 0 0 12px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">
      ${headingText}
    </h2>
    <p style="font-size: 14px; color: #BAC9C0; line-height: 1.65; margin: 0 0 20px 0;">
      ${t.body}
    </p>

    <div style="background-color: #081B17; border: 1px solid rgba(111,165,138,0.22); border-radius: 6px; padding: 18px 20px; margin: 18px 0;">
      <p style="margin: 0 0 10px 0; font-weight: 700; color: #9BC4AE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;">
        ${t.detailsTitle}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${metaRows}
      </table>
      ${synopsisHtml}
    </div>

    ${customMessageBlock}

    ${ctaButtonHtml}

    <p style="font-size: 12px; color: #7A9689; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
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
  const texts = emailTexts[currentLang] || emailTexts.lt;
  const t = texts.adminNotification;
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
  dossierRows += buildMetaRow(isLt ? "Vaizdo įrašo trukmė:" : "Video Runtime:", `⏱️ ${escapeHtml(duration)} ${data.videoDurationSeconds <= 180 ? '✅ (Tinka &le; 180s)' : '⚠️ (>180s)'}`);
  
  if (data.storagePath) {
    dossierRows += buildMetaRow(isLt ? "Saugyklos kelias:" : "Storage Path:", `<code style="font-size:11px; color:#BAC9C0;">${escapeHtml(data.storagePath)}</code>`);
  }

  // Synopsis block
  let synopsisBlock = "";
  if (data.synopsis) {
    synopsisBlock = `
      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(111,165,138,0.2);">
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #9BC4AE; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
          ${isLt ? "Filmo idėja / Sinopsis:" : "Concept / Synopsis:"}
        </p>
        <p style="margin: 0; font-size: 13px; color: #F8FAF7; font-style: italic; line-height: 1.6; background-color: rgba(5, 21, 18, 0.5); padding: 10px 14px; border-radius: 4px;">
          ${escapeHtml(data.synopsis)}
        </p>
      </div>
    `;
  }

  // Direct video link button if present
  let videoLinkHtml = "";
  if (data.videoUrl) {
    videoLinkHtml = `
      <div style="text-align: center; margin: 16px 0 6px 0;">
        <a href="${escapeHtml(data.videoUrl)}" target="_blank" style="display: inline-block; background-color: transparent; border: 1px solid rgba(111,165,138,0.4); color: #9BC4AE; font-size: 12px; font-weight: 600; padding: 8px 18px; border-radius: 4px; text-decoration: none;">
          ▶️ ${isLt ? "Atsisiųsti / Peržiūrėti originalų vaizdo failą" : "Download / Stream raw video file"}
        </a>
      </div>
    `;
  }

  const childrenHtml = `
    <h2 style="color: #F8FAF7; margin: 0 0 10px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">
      ${t.heading}
    </h2>
    <p style="font-size: 14px; color: #BAC9C0; line-height: 1.65; margin: 0 0 18px 0;">
      ${t.body}
    </p>

    <div style="background-color: #081B17; border: 1px solid rgba(111,165,138,0.24); border-radius: 6px; padding: 18px 20px; margin: 18px 0;">
      <p style="margin: 0 0 12px 0; font-weight: 700; color: #9BC4AE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;">
        ${t.detailsTitle}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${dossierRows}
      </table>
      ${synopsisBlock}
      ${videoLinkHtml}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="cta-table" style="margin: 24px auto 8px auto;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: #12372F; border: 1px solid #6FA58A;">
          <a href="${adminUrl}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 28px; font-size: 13px; font-weight: 700; color: #F8FAF7; text-decoration: none; border-radius: 6px; letter-spacing: 0.02em;">
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

/**
 * Generates an automated dark-themed team invitation email with verification code and activation link.
 */
function generateInviteEmailHtml(lang, data = {}) {
  const currentLang = (lang === "lt" || lang === "en") ? lang : "lt";
  const texts = emailTexts[currentLang] || emailTexts.lt;
  const t = texts.userInvite;
  const isLt = currentLang === "lt";

  const inviteeName = [data.name || "", data.surname || ""].filter(Boolean).join(" ") || (isLt ? "Būsimas komandos narys" : "New Team Member");
  const email = data.email || "-";
  const role = data.role || "moderator";
  const code = data.code || Math.floor(100000 + Math.random() * 900000).toString();
  const token = data.token || "";
  const inviteUrl = data.inviteUrl || `${EMAIL_THEME.adminUrl}?invite_token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`;

  const roleLabels = {
    admin: isLt ? "Administratorius (Super Admin)" : "Administrator (Full Access)",
    moderator: isLt ? "Moderatorius (Paraiškos ir turinys)" : "Moderator (Content & Submissions)",
    judge: isLt ? "Žiuri / Teisėjas (Vertinimas)" : "Jury / Judge (Scoring)",
    accountant: isLt ? "Buhalteris / Sąskaitos" : "Accountant / Finance",
    viewer: isLt ? "Žiūrovas (Tik peržiūra)" : "Viewer (Read Only)"
  };

  const roleDisplay = roleLabels[role] || role;

  let metaRows = "";
  metaRows += buildMetaRow(isLt ? "Gavėjas:" : "Invitee:", `<b>${escapeHtml(inviteeName)}</b> (<a href="mailto:${escapeHtml(email)}" style="color:#9BC4AE; text-decoration:none;">${escapeHtml(email)}</a>)`);
  metaRows += buildMetaRow(isLt ? "Priskirta rolė:" : "Assigned Role:", `<span style="color:#D4AF37; font-weight:700; text-transform:uppercase; letter-spacing:0.04em;">🛡️ ${escapeHtml(roleDisplay)}</span>`);
  if (data.invitedBy) {
    metaRows += buildMetaRow(isLt ? "Pakvietė:" : "Invited By:", escapeHtml(data.invitedBy));
  }
  metaRows += buildMetaRow(isLt ? "Galiojimas:" : "Valid Until:", isLt ? "7 dienas nuo išsiuntimo" : "7 days from dispatch");

  const childrenHtml = `
    <h2 style="color: #F8FAF7; margin: 0 0 10px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">
      ${t.heading.replace("{{name}}", escapeHtml(inviteeName))}
    </h2>
    <p style="font-size: 14px; color: #BAC9C0; line-height: 1.65; margin: 0 0 18px 0;">
      ${t.body}
    </p>

    <!-- Activation Code Box -->
    <div style="background-color: #081B17; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.1em;">
        ${isLt ? "Jūsų unikalus patvirtinimo kodas:" : "Your Unique Verification Code:"}
      </p>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 800; letter-spacing: 8px; color: #F8FAF7; padding: 8px 0;">
        ${escapeHtml(code)}
      </div>
      <p style="margin: 6px 0 0 0; font-size: 11px; color: #7A9689;">
        ${isLt ? "Įveskite šį kodą arba paspauskite tiesioginį aktyvavimo mygtuką žemiau" : "Enter this code or click the direct activation button below"}
      </p>
    </div>

    <!-- Details Box -->
    <div style="background-color: #081B17; border: 1px solid rgba(111,165,138,0.22); border-radius: 6px; padding: 18px 20px; margin: 18px 0;">
      <p style="margin: 0 0 12px 0; font-weight: 700; color: #9BC4AE; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;">
        ${t.detailsTitle}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${metaRows}
      </table>
    </div>

    <!-- Direct CTA Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="cta-table" style="margin: 24px auto 14px auto;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: #17453B; border: 1px solid #D4AF37;">
          <a href="${inviteUrl}" target="_blank" class="btn-primary" style="display: inline-block; padding: 14px 32px; font-size: 13px; font-weight: 800; color: #F8FAF7; text-decoration: none; border-radius: 6px; letter-spacing: 0.04em;">
            ${escapeHtml(t.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 11px; color: #7A9689; line-height: 1.6; margin: 16px 0 0 0; text-align: center;">
      ${t.note}
    </p>
  `;

  return buildEmailDocument({
    lang: currentLang,
    preheader: `${t.preheader} (${inviteeName} - ${roleDisplay})`,
    statusKey: "userInvite",
    childrenHtml
  });
}

// Global browser and runtime scope compatibility
if (typeof window !== "undefined") {
  window.emailTexts = emailTexts;
  window.generateEmailHtml = generateEmailHtml;
  window.generateAdminNotificationHtml = generateAdminNotificationHtml;
  window.generateInviteEmailHtml = generateInviteEmailHtml;
}
if (typeof globalThis !== "undefined") {
  globalThis.emailTexts = emailTexts;
  globalThis.generateEmailHtml = generateEmailHtml;
  globalThis.generateAdminNotificationHtml = generateAdminNotificationHtml;
  globalThis.generateInviteEmailHtml = generateInviteEmailHtml;
}

// Node / CommonJS module export compatibility (for backend/tests)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    emailTexts,
    generateEmailHtml,
    generateAdminNotificationHtml,
    generateInviteEmailHtml
  };
}
