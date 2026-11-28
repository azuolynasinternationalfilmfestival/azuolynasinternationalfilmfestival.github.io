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
  accentGold: "#F8FAFC",
  textLight: "#F8FAF7",
  textMuted: "#BAC9C0",
  textDim: "#7A9689",
  borderDark: "#153D34",
  borderAccent: "rgba(111, 165, 138, 0.28)",
  logoUrl: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/azuolynasfilmfest.webp?alt=media",
  siteUrl: "https://www.azuolynasfilmfestival.lt/",
  adminUrl: "https://www.azuolynasfilmfestival.lt/admin.html",
  liveStreamUrl: "https://www.azuolynasfilmfestival.lt/live.html",
  instagramUrl: "https://www.instagram.com/azuolynas.iff",
  instagramHandle: "@azuolynas.iff",
  themeLt: "Mano pašaukimas",
  themeEn: "MY PURPOSE",
  submissionPeriodLt: "2026 m. lapkričio 1 d. – 2027 m. balandžio 5 d.",
  submissionPeriodEn: "November 1st, 2026 – April 5th, 2027",
  eventDateLt: "2027 m. balandžio 27 d.",
  eventDateEn: "April 27th, 2027",
  venueLt: "Kauno tarptautinė gimnazija (Vytauto pr. 50, Kaunas)",
  venueEn: "Kaunas International Gymnasium (Vytauto pr. 50, Kaunas, Lithuania)",
  contactEmail: "azuolynasfilmfestival@gmail.com"
};

// Status badges metadata (color, icon, Lithuanian & English labels)
const STATUS_BADGES = {
  submissionReceived: {
    icon: "",
    color: "#6FA58A",
    bg: "rgba(111, 165, 138, 0.16)",
    border: "#6FA58A",
    labelLt: "PARAIŠKA GAUTA",
    labelEn: "SUBMISSION RECEIVED"
  },
  accepted: {
    icon: "",
    color: "#78C29D",
    bg: "rgba(120, 194, 157, 0.18)",
    border: "#78C29D",
    labelLt: "PRIIMTA Į KONKURSĄ",
    labelEn: "OFFICIALLY ACCEPTED"
  },
  semiFinalist: {
    icon: "",
    color: "#8AE0BA",
    bg: "rgba(138, 224, 186, 0.18)",
    border: "#8AE0BA",
    labelLt: "PUSFINALIS",
    labelEn: "SEMI-FINALIST"
  },
  finalist: {
    icon: "",
    color: "#9BC4AE",
    bg: "rgba(155, 196, 174, 0.18)",
    border: "#9BC4AE",
    labelLt: "FESTIVALIO FINALAS",
    labelEn: "FESTIVAL FINALIST"
  },
  winner: {
    icon: "",
    color: "#E2E8F0",
    bg: "rgba(226, 232, 240, 0.16)",
    border: "#E2E8F0",
    labelLt: "FESTIVALIO LAUREATAS",
    labelEn: "FESTIVAL LAUREATE"
  },
  rejected: {
    icon: "",
    color: "#BAC9C0",
    bg: "rgba(186, 201, 192, 0.14)",
    border: "#BAC9C0",
    labelLt: "ATRANKOS INFORMACIJA",
    labelEn: "SELECTION UPDATE"
  },
  eventReminder: {
    icon: "",
    color: "#8AE0BA",
    bg: "rgba(138, 224, 186, 0.18)",
    border: "#8AE0BA",
    labelLt: "CEREMONIJOS ĮRAŠAS",
    labelEn: "FESTIVAL BROADCAST"
  },
  remoteLivePass: {
    icon: "",
    color: "#4ade80",
    bg: "rgba(74, 222, 128, 0.18)",
    border: "#4ade80",
    labelLt: "TRANSLIACIJOS ŽETONAS",
    labelEn: "LIVE STREAM PASS"
  },
  userInvite: {
    icon: "",
    color: "#F8FAFC",
    bg: "rgba(255, 255, 255, 0.12)",
    border: "rgba(255, 255, 255, 0.3)",
    labelLt: "KOMANDOS KVIETIMAS",
    labelEn: "TEAM INVITATION"
  },
  adminNotification: {
    icon: "",
    color: "#6FA58A",
    bg: "rgba(111, 165, 138, 0.18)",
    border: "#6FA58A",
    labelLt: "NAUJA DALYVIO PARAIŠKA",
    labelEn: "NEW APPLICANT DOSSIER"
  },
  accessRequest: {
    icon: "",
    color: "#E5A93C",
    bg: "rgba(229, 169, 60, 0.18)",
    border: "#E5A93C",
    labelLt: "PRIEIGOS UŽKLAUSA",
    labelEn: "ACCESS REQUEST"
  },
  accessGranted: {
    icon: "",
    color: "#6FA58A",
    bg: "rgba(111, 165, 138, 0.18)",
    border: "#6FA58A",
    labelLt: "PRIEIGA SUTEIKTA",
    labelEn: "ACCESS GRANTED"
  }
};

const emailTexts = {
  lt: {
    accessRequest: {
      sub: "AISFF | Nauja prieigos užklausa!",
      preheader: "Pateikta nauja užklausa prieigai prie festivalio administravimo portalo.",
      heading: "Gauta nauja prieigos užklausa",
      body: "Festivalio platformoje pateikta nauja užklausa dėl prieigos prie administravimo portalo teisių. Prašome peržiūrėti kandidato duomenis ir nuspręsti dėl prieigos suteikimo.",
      detailsTitle: "Užklausos duomenys",
      note: "Patvirtinti arba atmesti prieigą galite prisijungę prie administravimo portalo skilties „Vartotojai & Prieiga“.",
      ctaText: "Peržiūrėti Administravimo Portale"
    },
    accessGranted: {
      sub: "AISFF | Jums suteikta administravimo prieiga",
      preheader: "Jūsų prieigos užklausa patvirtinta. Dabar galite prisijungti prie festivalio administravimo portalo.",
      heading: "Sveikiname, {{name}}!",
      body: "Pranešame, kad jūsų prieigos užklausa prie AISFF (Kauno tarptautinė gimnazija) administravimo sistemos buvo sėkmingai patvirtinta!",
      detailsTitle: "Paskyros prieigos informacija",
      note: "Prisijunkite naudodami savo registruotą el. pašto adresą arba susietą Google paskyrą.",
      ctaText: "Prisijungti prie Administravimo Portalo"
    },
    submissionReceived: {
      sub: "AISFF | Filmo paraiška sėkmingai gauta!",
      preheader: "Dėkojame už paraišką festivalio temai „Mano pašaukimas“! Jūsų filmas pasiekė atrankos komisiją.",
      heading: "Sveiki, {{name}}!",
      body: "Nuoširdžiai dėkojame už dalyvavimą! Jūsų filmo paraiška festivalio temai „Mano pašaukimas“ sėkmingai pasiekė AISFF organizacinį komitetą. Prie šio laiško pridėtas PDF dokumentas su visais jūsų pateiktais duomenimis. Komisija peržiūrės filmą ir atsakymą atsiųs {{responseTime}}.",
      detailsTitle: "Pateiktos paraiškos suvestinė",
      note: "Oficiali festivalio filmų peržiūra bei laureatų apdovanojimo ceremonija vyks Kauno tarptautinėje gimnazijoje 2027 m. balandžio 27 d. Tiesioginę transliaciją galėsite stebėti per https://www.azuolynasfilmfestival.lt/live.html, o naujienas sekite Instagram: @azuolynas.iff.",
      ctaText: "Apsilankyti Festivalio Svetainėje"
    },
    adminNotification: {
      sub: "AISFF | Nauja dalyvio paraiška festivaliui!",
      preheader: "Užregistruota nauja dalyvio paraiška temai „Mano pašaukimas“.",
      heading: "Gauta nauja filmo paraiška",
      body: "Festivalio sistemoje ką tik sėkmingai užregistruota nauja mokinio paraiška temai „Mano pašaukimas“. Pridėtas pilnas PDF dokumentas bei žemiau pateikiami visi kūrybinės grupės, įrangos ir vaizdo įrašo duomenys.",
      detailsTitle: "Dalyvio ir filmo byla",
      ctaText: "Atverti Administravimo Portalą"
    },
    accepted: {
      sub: "AISFF | Sveikiname! Jūsų filmas priimtas į konkursą",
      preheader: "Puikios žinios! Jūsų filmas atitiko reikalavimus ir priimtas į tematinę programą „Mano pašaukimas“.",
      heading: "Puikios žinios, {{name}}!",
      body: "Džiaugiamės galėdami pranešti, kad jūsų filmas atitiko visus festivalio reikalavimus ir yra oficialiai priimtas į konkursinę programą tema „Mano pašaukimas“! Jūsų kūrinį vertins tarptautinė žiuri komisija.",
      detailsTitle: "Priėmimo informacija",
      note: "2027 m. balandžio 27 d. festivalio apdovanojimų ceremonija ir laureatų paskelbimas vyks Kauno tarptautinėje gimnazijoje bei tiesioginėje internetinėje transliacijoje (live.html). Sekite @azuolynas.iff.",
      ctaText: "Peržiūrėti Konkurso Programą"
    },
    semiFinalist: {
      sub: "AISFF | Jūsų darbas pateko į PUSFINALĮ!",
      preheader: "Sveikiname! Vertinimo komisija jūsų filmą atrinko tarp pusfinalininkų.",
      heading: "Sveiki, {{name}}!",
      body: "Atrankos komisija itin aukštai įvertino jūsų filmo originalumą, kinematografiją bei temos „Mano pašaukimas“ atskleidimą. Jūsų darbas oficialiai patenka tarp AISFF PUSFINALININKŲ!",
      detailsTitle: "Pusfinalio rezultatai",
      note: "Pusfinalio filmai bus pristatomi festivalio peržiūros programoje 2027 m. balandžio 27 d. Kauno tarptautinėje gimnazijoje bei tiesioginiame eteryje per live.html.",
      ctaText: "Sekti Festivalio Naujienas"
    },
    finalist: {
      sub: "AISFF | Jūs esate FINALE!",
      preheader: "Ypatingas pasiekimas! Jūsų filmas pateko į finalą ir varžosi dėl ąžuolo statulėlių.",
      heading: "Ypatingas pasiekimas, {{name}}!",
      body: "Nuoširdžiai sveikiname! Jūsų filmas tema „Mano pašaukimas“ oficialiai pateko į AISFF FINALĄ ir pretenduoja į prizines vietas, natūralaus ąžuolo statulėles bei Žiūrovų simpatijų prizą.",
      detailsTitle: "Finalo informacija",
      note: "Laureatai bus apdovanoti iškilmingoje ceremonijoje Kauno tarptautinėje gimnazijoje 2027 m. balandžio 27 d. Stebėkite tiesiogiai per live.html, naujienos Instagram: @azuolynas.iff.",
      ctaText: "Peržiūrėti Finalininkų Programą"
    },
    winner: {
      sub: "AISFF | SVEIKINAME FESTIVALIO LAUREATĄ!",
      preheader: "Puiki pergalė! Jūsų filmas pelnė apdovanojimą AISFF festivalyje.",
      heading: "Nuoširdžiausi sveikinimai, {{name}}!",
      body: "Komisijos sprendimu bei žiūrovų balsavimu, džiaugiamės galėdami paskelbti jūsų filmą oficialiu AISFF LAUREATU (tema „Mano pašaukimas“)! Ačiū už jūsų talentą, drąsią režisūrą ir jaunųjų kūrėjų balso stiprinimą.",
      detailsTitle: "Apdovanojimo informacija",
      note: "Dėl autorinės ąžuolo statulėlės ir diplomų įteikimo bei pristatymo su jumis asmeniškai susisieks organizatoriai. Ceremonijos įrašas bus pasiekiamas live.html, sekite @azuolynas.iff.",
      ctaText: "Žiūrėti Laureatų Galeriją"
    },
    rejected: {
      sub: "AISFF | Informacija apie jūsų filmo paraišką",
      preheader: "Dėkojame už jūsų filmą ir kūrybinį darbą AISFF festivalyje.",
      heading: "Sveiki, {{name}},",
      body: "Nuoširdžiai dėkojame už jūsų filmą ir dalyvavimą festivalyje tema „Mano pašaukimas“. Šiais metais sulaukėme itin daug talentingų moksleivių darbų. Nors jūsų filmas šįkart nepateko į trumpąjį konkursinį sąrašą, komisija džiaugiasi jūsų kūrybine drąsa ir linki nenustoti filmuoti!",
      detailsTitle: "Atrankos informacija",
      note: "Kiekvienas sukurtas filmas yra svarbi patirtis. Kviečiame stebėti festivalio transliaciją 2027 m. balandžio 27 d. ir sekti mūsų Instagram @azuolynas.iff!",
      ctaText: "Apsilankyti Svetainėje"
    },
    eventReminder: {
      sub: "AISFF | Festivalio įrašas jau pasiekiamas svetainėje!",
      preheader: "Oficialus festivalio ceremonijos ir laureatų įrašas paskelbtas festivalio platformoje.",
      heading: "Sveiki, {{name}}!",
      body: "Oficialus AISFF festivalio vaizdo įrašas su moksleivių filmų peržiūra ir iškilminga apdovanojimų ceremonija jau paskelbtas mūsų svetainėje!",
      detailsTitle: "Renginio įrašas",
      note: "Kviečiame patogiai peržiūrėti geriausius mokinių darbus ir ceremonijos akimirkas. Sekite Instagram: @azuolynas.iff.",
      ctaText: "Žiūrėti Festivalio Įrašą"
    },
    remoteLivePass: {
      sub: "AISFF | Jūsų tiesioginės transliacijos prieiga ir žetonas",
      preheader: "Jūsų asmeninė festivalio ceremonijos tiesioginės transliacijos nuoroda bei balsavimo žetonas.",
      heading: "Sveiki, {{name}}!",
      body: "Kadangi pažymėjote, kad negalėsite atvykti į festivalio ceremoniją gyvai Kaune, paruošėme jums tiesioginę transliacijos prieigą. Prie šio laiško pridėtas PDF su visa jūsų paraiškos informacija. Atsakymo dėl atrankos sulauksite {{responseTime}}, o 2027 m. balandžio 27 d. galėsite stebėti transliaciją bei balsuoti!",
      detailsTitle: "Nuotolinio dalyvio prieigos duomenys",
      note: "Transliacija bus pasiekiama 2027 m. balandžio 27 d. su šiuo asmeniniu žetonu arba jūsų registruotu el. paštu per https://www.azuolynasfilmfestival.lt/live.html. Sekite @azuolynas.iff.",
      ctaText: "Atverti Tiesioginę Transliaciją"
    },
    userInvite: {
      sub: "AISFF | Kvietimas prisijungti prie komandos",
      preheader: "Jums suteikta prieiga prie AISFF festivalio valdymo platformos.",
      heading: "Sveiki, {{name}}!",
      body: "Jūs buvote oficialiai pakviestas prisijungti prie AISFF (Kauno tarptautinė gimnazija) valdymo sistemos komandos. Žemiau pateikiami jūsų paskyros aktyvavimo duomenys ir saugus patvirtinimo kodas.",
      detailsTitle: "Paskyros aktyvavimo byla",
      note: "Ši nuoroda skirta tik nurodytam asmeniui. Aktyvuokite savo paskyrą nustatydami saugų slaptažodį.",
      ctaText: "Aktyvuoti Paskyrą Dabar"
    }
  },
  en: {
    accessRequest: {
      sub: "AISFF | New Access Request!",
      preheader: "A new festival dashboard access request has been submitted.",
      heading: "New Access Request Received",
      body: "A user has submitted an access request for the festival management dashboard. Please review the applicant's credentials and determine whether to grant access.",
      detailsTitle: "Request Details",
      note: "You can review and manage permissions anytime in the admin panel under 'Users & Access'.",
      ctaText: "Open Admin Dashboard"
    },
    accessGranted: {
      sub: "AISFF | Dashboard Access Granted",
      preheader: "Your access request has been approved. You can now sign in to the festival dashboard.",
      heading: "Congratulations, {{name}}!",
      body: "We are pleased to inform you that your request for access to the AISFF (Kaunas International Gymnasium) management platform has been approved!",
      detailsTitle: "Account Access Details",
      note: "Sign in using your authorized email address or your linked Google account.",
      ctaText: "Sign in to Dashboard"
    },
    submissionReceived: {
      sub: "AISFF | Film Submission Successfully Received!",
      preheader: "Thank you for submitting for the theme “MY PURPOSE”! Your film entry has reached the committee.",
      heading: "Hello, {{name}}!",
      body: "Thank you sincerely for participating! Your entry for the festival theme “MY PURPOSE” has been safely received by the organizing committee of AISFF. A full PDF copy of your submission is attached to this email. Our jury will review your entry and get back to you {{responseTime}}.",
      detailsTitle: "Submission Summary",
      note: "The gala screening and awards ceremony will take place at Kaunas International Gymnasium on April 27th, 2027. Watch the global live stream at https://www.azuolynasfilmfestival.lt/live.html and follow us on Instagram: @azuolynas.iff.",
      ctaText: "Visit Festival Platform"
    },
    adminNotification: {
      sub: "AISFF | New film submission received!",
      preheader: "A new student film dossier has been registered for the theme “MY PURPOSE”.",
      heading: "New Film Submission Registered",
      body: "A new film has just been submitted via the official platform for the theme “MY PURPOSE”. A PDF summary is attached and all author roles, device specifications, and video verification details are listed below.",
      detailsTitle: "Applicant Dossier",
      ctaText: "Open Admin Dashboard"
    },
    accepted: {
      sub: "AISFF | Congratulations! Your Film is Accepted",
      preheader: "Great news! Your work is officially in competition for the theme “MY PURPOSE”.",
      heading: "Congratulations, {{name}}!",
      body: "We are thrilled to inform you that your work has met all submission criteria (max 3 minutes runtime, captured on mobile phone/tablet, student-directed) and is officially accepted into the AISFF competition program under the theme “MY PURPOSE”!",
      detailsTitle: "Acceptance Record",
      note: "The full event and ceremony will take place at Kaunas International Gymnasium and stream live on our platform on April 27th, 2027. Stay tuned via Instagram @azuolynas.iff.",
      ctaText: "Explore Competition Program"
    },
    semiFinalist: {
      sub: "AISFF | Your Film is a SEMI-FINALIST!",
      preheader: "Exciting news! The jury has selected your work among the official semi-finalists.",
      heading: "Exciting news, {{name}}!",
      body: "Our jury was profoundly moved by your creative voice, camera work, and narrative approach to the theme “MY PURPOSE”. Your work has officially advanced to the AISFF SEMI-FINALS!",
      detailsTitle: "Semi-Final Status",
      note: "Semi-final selections will be highlighted in the official festival broadcast on April 27th, 2027. Watch live at live.html and follow @azuolynas.iff.",
      ctaText: "Follow Festival Updates"
    },
    finalist: {
      sub: "AISFF | You have reached the FINALS!",
      preheader: "Outstanding achievement! Your film has reached the finals and is in contention for awards.",
      heading: "Tremendous achievement, {{name}}!",
      body: "Warmest congratulations! Your film has officially reached the FINALS of AISFF (theme “MY PURPOSE”) and is in direct contention for the Grand Prix, handmade oak statuettes, and the Audience Choice Award.",
      detailsTitle: "Finalist Dossier",
      note: "Award winners will be officially unveiled during the ceremony at Kaunas International Gymnasium and live stream on April 27th, 2027. Follow Instagram: @azuolynas.iff.",
      ctaText: "View Finalist Showcase"
    },
    winner: {
      sub: "AISFF | CONGRATULATIONS FESTIVAL LAUREATE!",
      preheader: "Incredible victory! Your film has earned an award at AISFF.",
      heading: "Bravo, {{name}}!",
      body: "By the decision of our international jury and audience vote, we are deeply honoured to declare your film an official WINNER of AISFF (theme “MY PURPOSE”)! Thank you for your inspiring creativity and cinematic boldness.",
      detailsTitle: "Award Record",
      note: "Our organizing team will reach out personally regarding the delivery of your diploma, medal, and festival award. Replay will be available on live.html, follow @azuolynas.iff.",
      ctaText: "View Winners Hall of Fame"
    },
    rejected: {
      sub: "AISFF | Update regarding your film entry",
      preheader: "Thank you for submitting your creative work to AISFF.",
      heading: "Hello, {{name}},",
      body: "Thank you sincerely for sharing your story with AISFF for the theme “MY PURPOSE”. We received a record number of wonderful submissions this season. While your film was not selected for this season's shortlist, our jury was genuinely inspired by your creative passion.",
      detailsTitle: "Selection Record",
      note: "Keep experimenting and filming! Join our live broadcast on April 27th, 2027, and follow our community on Instagram: @azuolynas.iff.",
      ctaText: "Visit Festival Platform"
    },
    eventReminder: {
      sub: "AISFF | Festival Recording Now Available On Site!",
      preheader: "The official festival recording and award ceremony is now published directly on our website.",
      heading: "Hello, {{name}}!",
      body: "The official video recording of AISFF—including student screenings and the gala award ceremony—is now live on our website!",
      detailsTitle: "Broadcast Information",
      note: "Sit back and enjoy the remarkable films crafted by youth creators from around the world. Instagram: @azuolynas.iff.",
      ctaText: "Watch Festival Broadcast"
    },
    remoteLivePass: {
      sub: "AISFF | Your Live Stream Access & Personal Token",
      preheader: "Your personal festival ceremony live stream access link and remote voting token.",
      heading: "Hello, {{name}}!",
      body: "Since you indicated that you are unable to attend the awards ceremony in person, we have generated your exclusive live broadcast pass. A full PDF copy of your submission is attached, and our team will respond {{responseTime}}. On April 27th, 2027, you can watch the stream and cast your vote remotely!",
      detailsTitle: "Remote Participant Connection Details",
      note: "The broadcast airs live on April 27th, 2027. Accessible with this personal token or your registered email at https://www.azuolynasfilmfestival.lt/live.html. Follow @azuolynas.iff.",
      ctaText: "Open Live Stream Platform"
    },
    userInvite: {
      sub: "AISFF | Staff Team Invitation",
      preheader: "You have been invited to the AISFF administration portal.",
      heading: "Hello, {{name}}!",
      body: "You have been officially invited to join the staff committee of AISFF at Kaunas International Gymnasium. Below are your account credentials and secure verification code.",
      detailsTitle: "Account Activation Record",
      note: "This invitation is personal and confidential. Please activate your account by setting a secure password.",
      ctaText: "Activate My Account Now"
    }
  }
};

const TEMPLATE_KEY_MAP = {
  submitted: "submissionReceived",
  submissionReceived: "submissionReceived",
  accepted: "accepted",
  semifinal: "semiFinalist",
  semiFinalist: "semiFinalist",
  "semi-final": "semiFinalist",
  final: "finalist",
  finalist: "finalist",
  winner: "winner",
  rejected: "rejected",
  remoteLivePass: "remoteLivePass",
  remote: "remoteLivePass",
  live_pass: "remoteLivePass",
  eventReminder: "eventReminder",
  userInvite: "userInvite",
  invite: "userInvite",
  accessRequest: "accessRequest",
  accessGranted: "accessGranted",
  adminNotification: "adminNotification"
};

/**
 * Normalizes input arguments so functions support flexibly:
 * (templateKey, lang, data), (templateKey, data), (lang, data), or (data)
 * Ensures variables like authorName, filmTitle, duration, RSVP never disappear.
 */
function normalizeParams(p1, p2, p3, defaultKey = "submissionReceived") {
  let templateKey = defaultKey;
  let lang = "lt";
  let data = {};

  if (p1 && typeof p1 === "object") {
    // Pattern: (data)
    data = p1;
    templateKey = data.templateKey || data.statusKey || data.status || defaultKey;
    lang = (data.lang === "en" || data.submissionLang === "en" || data.language === "en") ? "en" : "lt";
  } else if (typeof p1 === "string") {
    if (p1 === "lt" || p1 === "en") {
      // Pattern: (lang, data) or (lang, templateKey, data)
      lang = p1;
      if (typeof p2 === "string") {
        templateKey = p2;
        data = (p3 && typeof p3 === "object") ? p3 : {};
      } else if (p2 && typeof p2 === "object") {
        data = p2;
        templateKey = data.templateKey || data.statusKey || data.status || defaultKey;
      }
    } else {
      // Pattern: (templateKey, lang, data) or (templateKey, data)
      templateKey = p1;
      if (p2 === "lt" || p2 === "en") {
        lang = p2;
        data = (p3 && typeof p3 === "object") ? p3 : {};
      } else if (p2 && typeof p2 === "object") {
        data = p2;
        if (data.lang === "en" || data.submissionLang === "en" || data.language === "en") {
          lang = "en";
        }
      } else if (typeof p2 === "string") {
        lang = p2.toLowerCase().startsWith("en") ? "en" : "lt";
        data = (p3 && typeof p3 === "object") ? p3 : {};
      }
    }
  }

  // Map alias keys if found
  if (TEMPLATE_KEY_MAP[templateKey]) {
    templateKey = TEMPLATE_KEY_MAP[templateKey];
  }

  // Guarantee cross-field aliases so no template variable is ever lost
  if (data && typeof data === "object") {
    const directorFull = [data.directorFirstName, data.directorLastName].filter(Boolean).join(" ").trim();
    if (!data.directorName && directorFull) data.directorName = directorFull;
    if (!data.name && directorFull) data.name = directorFull;
    if (!data.filmTitle && data.title) data.filmTitle = data.title;
    if (!data.name && data.authorName) data.name = data.authorName;
    if (!data.name && data.author) data.name = data.author;
    if (!data.name && data.userName) data.name = data.userName;
    if (!data.cameraOperatorName) {
      data.cameraOperatorName = [data.cameraOperatorFirstName, data.cameraOperatorLastName].filter(Boolean).join(" ").trim() || data.cameraOperator || "";
    }
    if (!data.ideaAuthorName) {
      data.ideaAuthorName = [data.ideaAuthorFirstName, data.ideaAuthorLastName].filter(Boolean).join(" ").trim() || data.ideaAuthor || "";
    }
    if (!data.screenwriterName) {
      data.screenwriterName = [data.screenwriterFirstName, data.screenwriterLastName].filter(Boolean).join(" ").trim() || data.screenwriter || "";
    }
    if (!data.videoDurationSeconds && data.duration) data.videoDurationSeconds = data.duration;
    if (!data.location && data.countryCity) data.location = data.countryCity;
    if (!data.attendanceType && data.rsvp) data.attendanceType = data.rsvp;
  }

  return { templateKey, lang, data };
}

function buildKickerLabel(templateKey, lang, data, badge) {
  const isLt = lang === "lt";
  const defaultLabel = isLt ? badge.labelLt : badge.labelEn;
  const responseWindow = data.responseTimeText || (isLt ? "per 5 darbo dienas" : "within 5 business days");
  if (templateKey === "submissionReceived") {
    return isLt ? `${defaultLabel} · Atsakymas ${responseWindow}` : `${defaultLabel} · Reply ${responseWindow}`;
  }
  if (templateKey === "remoteLivePass") {
    return isLt ? "Nuotolinio dalyvio prieiga · 2027 m. balandžio 27 d." : "Remote Participant Pass · April 27, 2027";
  }
  if (templateKey === "adminNotification") {
    return data.id ? `${defaultLabel} · ID: ${data.id}` : defaultLabel;
  }
  if (templateKey === "winner") {
    return isLt ? `${defaultLabel} · AISFF 2027` : `${defaultLabel} · AISFF 2027`;
  }
  return defaultLabel;
}

/**
 * Deduplicates identical names across Director, Camera Operator, Idea Author, and Screenwriter
 * so single-author films display one clean combined row while distinct collaborators stay listed separately.
 */
function buildCrewRowsHtml(data, isLt, opts = {}) {
  const showDirectorSeparate = opts.showDirectorSeparate === true;
  const directorName = data.directorName || [data.directorFirstName, data.directorLastName].filter(Boolean).join(" ").trim() || data.name || (isLt ? "Dalyvis" : "Filmmaker");
  const roles = [
    { name: directorName, labelLt: "Režisierius", labelEn: "Director" },
    { name: data.cameraOperatorName, labelLt: "Operatorius", labelEn: "Camera Operator" },
    { name: data.ideaAuthorName, labelLt: "Idėjos autorius", labelEn: "Idea Author" },
    { name: data.screenwriterName, labelLt: "Scenarijaus autorius", labelEn: "Screenwriter" }
  ];

  const groups = [];
  const byKey = new Map();

  for (const r of roles) {
    const cleanName = String(r.name || "").trim();
    if (!cleanName) continue;
    const key = cleanName.toLowerCase().replace(/\s+/g, " ");
    if (!byKey.has(key)) {
      const entry = { name: cleanName, labels: [isLt ? r.labelLt : r.labelEn] };
      byKey.set(key, entry);
      groups.push(entry);
    } else {
      byKey.get(key).labels.push(isLt ? r.labelLt : r.labelEn);
    }
  }

  let html = "";
  if (groups.length === 1 && !showDirectorSeparate) {
    const g = groups[0];
    const roleSummary = g.labels.length > 1
      ? g.labels.join(", ")
      : (isLt ? "Režisierius / Autorius" : "Director / Author");
    html += buildMetaRow(
      isLt ? "Autorius ir kūryba" : "Author & Credits",
      `<strong style="color:#F8FAF7;">${escapeHtml(g.name)}</strong><br /><span style="font-size:12px; color:#9BC4AE;">${escapeHtml(roleSummary)}</span>`
    );
    return html;
  }

  groups.forEach((g, idx) => {
    const label = idx === 0 && g.labels.length === 1
      ? (isLt ? "Dalyvis / Režisierius" : "Director / Author")
      : g.labels.join(" · ");
    const nameHtml = idx === 0
      ? `<strong style="color:#F8FAF7;">${escapeHtml(g.name)}</strong>`
      : escapeHtml(g.name);
    html += buildMetaRow(label, nameHtml);
  });
  return html;
}

/**
 * Builds the top-level HTML email wrapper with fluid responsive table architecture,
 * Outlook mso conditions, dark-theme styling, and zero-width preheader.
 */
function buildEmailDocument({ lang, preheader, statusKey, statusKicker, isAdminMail, childrenHtml }) {
  const badge = STATUS_BADGES[statusKey] || STATUS_BADGES.submissionReceived;
  const isLt = lang === "lt";
  const kickerText = statusKicker || (isLt ? badge.labelLt : badge.labelEn);
  const topBorderColor = statusKey === "remoteLivePass" || statusKey === "submissionReceived"
    ? "#34D399"
    : (badge.color || "#34D399");
  const homeUrl = isLt ? `${EMAIL_THEME.siteUrl}lt/` : `${EMAIL_THEME.siteUrl}en/`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${isLt ? "lt" : "en"}" xml:lang="${isLt ? "lt" : "en"}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>AISFF · Ąžuolynas Film Festival</title>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; background-color: #051512; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #F8FAF7; }
    a { color: #34D399; text-decoration: none; }
    a:hover { text-decoration: underline !important; }
    .btn-primary:hover { background-color: #164439 !important; }
    @media screen and (max-width: 600px) {
      .email-shell { width: 100% !important; max-width: 100% !important; }
      .outer-pad { padding: 16px 10px 28px 10px !important; }
      .card-pad { padding: 24px 18px !important; }
      .section-pad { padding: 16px 16px !important; }
      .meta-grid-label, .meta-grid-value { display: block !important; width: 100% !important; text-align: left !important; }
      .meta-grid-label { padding: 10px 0 2px 0 !important; border-bottom: none !important; font-size: 11px !important; }
      .meta-grid-value { padding: 0 0 10px 0 !important; }
      .cta-table { width: 100% !important; }
      .btn-primary { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 14px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #051512; color: #F8FAF7;">

  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #051512; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader || "Ąžuolynas International Students Film Festival")}
    &#847; &zwnj; &nbsp; &#8199; &#847; &zwnj; &nbsp; &#8199;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #051512; table-layout: fixed;">
    <tr>
      <td align="center" class="outer-pad" style="padding: 28px 12px 40px 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600"><tr><td>
        <![endif]-->

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-shell" style="max-width: 600px; margin: 0 auto;">

          <!-- BRAND HEADER -->
          <tr>
            <td style="padding: 0 4px 20px 4px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="52" valign="middle" style="padding-right: 14px;">
                    <a href="${homeUrl}" target="_blank" style="text-decoration: none;">
                      <img src="${EMAIL_THEME.logoUrl}" alt="AISFF" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 4px; background-color: #0C241F;" />
                    </a>
                  </td>
                  <td valign="middle">
                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: #F8FAF7; letter-spacing: -0.01em; line-height: 1.25;">
                      Ąžuolynas Film Festival
                    </p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #9BC4AE; line-height: 1.3;">
                      ${isAdminMail
                        ? (isLt ? "Organizatorių pranešimas &middot; " : "Organizers Notice &middot; ")
                        : "AISFF 2027 &middot; "}${isLt ? "Tema: " : "Theme: "}<strong style="color: #34D399;">${isLt ? "„Mano pašaukimas“" : "“MY PURPOSE”"}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background-color: #0C241F; border: 1px solid #153D34; border-top: 3px solid ${topBorderColor}; border-radius: 6px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="card-pad" style="padding: 30px 28px;">

                    <!-- Unboxed Status Kicker -->
                    <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${topBorderColor};">
                      ${escapeHtml(kickerText)}
                    </p>

                    ${childrenHtml}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 8px 0 8px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #BAC9C0;">
                ${isLt
                  ? "AISFF &middot; Kauno tarptautinė gimnazija &middot; Vytauto pr. 50, Kaunas"
                  : "AISFF &middot; Kaunas International Gymnasium &middot; Vytauto pr. 50, Kaunas"}
              </p>
              <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 1.6; color: #7A9689;">
                <a href="${homeUrl}" target="_blank" style="color: #9BC4AE;">${isLt ? "Svetainė" : "Website"}</a>
                &nbsp;&middot;&nbsp;
                <a href="${EMAIL_THEME.liveStreamUrl}" target="_blank" style="color: #34D399;">${isLt ? "Transliacija" : "Live Stream"}</a>
                &nbsp;&middot;&nbsp;
                <a href="${EMAIL_THEME.instagramUrl}" target="_blank" style="color: #9BC4AE;">${EMAIL_THEME.instagramHandle}</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${EMAIL_THEME.contactEmail}" style="color: #9BC4AE;">${EMAIL_THEME.contactEmail}</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #557064;">
                ${isLt
                  ? "2027 m. balandžio 27 d. &middot; Šis pranešimas išsiųstas remiantis jūsų dalyvavimu festivalyje. BDAR / GDPR atitiktis užtikrinama."
                  : "April 27, 2027 &middot; Sent regarding your festival participation or submission. GDPR compliant."}
              </p>
            </td>
          </tr>

        </table>

        <!--[if (gte mso 9)|(IE)]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Builds a styled metadata row for tables inside the unified dossier surface.
 */
function buildMetaRow(label, valueHtml, isLast) {
  const borderStyle = isLast ? "" : " border-bottom: 1px solid #153D34;";
  const padBottom = isLast ? "0" : "9px";
  return `
    <tr>
      <td valign="top" class="meta-grid-label" style="padding: 9px 12px ${padBottom} 0; color: #7A9689; font-size: 12px; width: 38%;${borderStyle}">
        ${escapeHtml(label)}
      </td>
      <td valign="top" class="meta-grid-value" style="padding: 9px 0 ${padBottom} 0; color: #F8FAF7; font-size: 13px; font-weight: 500;${borderStyle}">
        ${valueHtml}
      </td>
    </tr>
  `;
}

/**
 * Generates an applicant-facing notification email HTML string.
 * Supports: (templateKey, lang, data), (templateKey, data), or (data)
 */
function generateEmailHtml(p1, p2, p3) {
  const { templateKey, lang, data } = normalizeParams(p1, p2, p3);
  const texts = emailTexts[lang] || emailTexts.lt;
  const t = texts[templateKey] || texts.submissionReceived;
  const isLt = lang === "lt";
  const badge = STATUS_BADGES[templateKey] || STATUS_BADGES.submissionReceived;

  const combinedDirectorName = [data.directorFirstName, data.directorLastName].filter(Boolean).join(" ").trim();
  const applicantName = data.directorName || combinedDirectorName || data.name || (isLt ? "Dalyvi" : "Filmmaker");
  const filmTitle = data.filmTitle || "-";
  const category = data.category || "-";
  const deviceModel = data.deviceModel || "";
  const duration = data.videoDurationSeconds ? `${data.videoDurationSeconds} s` : null;
  const responseTimeDisplay = data.responseTimeText || (isLt ? "per 5 darbo dienas" : "within 5 business days");

  const headingText = t.heading.replace("{{name}}", escapeHtml(applicantName));
  const bodyText = t.body.replace("{{responseTime}}", escapeHtml(responseTimeDisplay));

  const juryPlaceNum = Number(data.juryPlace || data.place || 0);
  const juryPlaceLabel = juryPlaceNum > 0
    ? (isLt ? `${juryPlaceNum}-oji vieta` : `${juryPlaceNum}${juryPlaceNum === 1 ? "st" : juryPlaceNum === 2 ? "nd" : juryPlaceNum === 3 ? "rd" : "th"} Place`)
    : "";

  let metaRows = "";
  metaRows += buildMetaRow(isLt ? "Filmo pavadinimas" : "Film Title", `<span style="color:#34D399; font-weight:700;">„${escapeHtml(filmTitle)}“</span>`);
  metaRows += buildCrewRowsHtml({ ...data, directorName: applicantName }, isLt);

  if (data.awardTitle) {
    metaRows += buildMetaRow(
      isLt ? "Apdovanojimas" : "Award",
      `<strong style="color:#34D399; font-weight:700;">${escapeHtml(data.awardTitle)}</strong>`
    );
  }
  if (juryPlaceLabel) {
    metaRows += buildMetaRow(
      isLt ? "Komisijos įvertinimas" : "Jury Ranking",
      `<strong style="color:#F8FAF7;">${escapeHtml(juryPlaceLabel)}</strong>`
    );
  }
  if (data.email) {
    metaRows += buildMetaRow(isLt ? "El. paštas" : "Email", escapeHtml(data.email));
  }

  const catAgeParts = [category !== "-" ? category : "", data.age ? `${data.age} ${isLt ? "m." : "yrs"}` : ""].filter(Boolean);
  if (catAgeParts.length) {
    metaRows += buildMetaRow(isLt ? "Kategorija ir amžius" : "Category & Age", escapeHtml(catAgeParts.join(" · ")));
  }

  const locParts = [data.institution, data.location || data.countryCity].filter(Boolean);
  if (locParts.length) {
    metaRows += buildMetaRow(isLt ? "Mokykla / Studija" : "School / Location", escapeHtml(locParts.join(" · ")));
  }

  const techParts = [
    deviceModel && deviceModel !== "-" ? deviceModel : "",
    duration ? `${duration} (≤ 180 s)` : "",
    data.videoResolution || ""
  ].filter(Boolean);
  if (techParts.length) {
    metaRows += buildMetaRow(isLt ? "Įranga ir trukmė" : "Device & Runtime", escapeHtml(techParts.join(" · ")));
  }

  if (data.videoFileName) {
    const sizeText = data.videoSizeBytes ? ` (${(Number(data.videoSizeBytes) / (1024 * 1024)).toFixed(2)} MB)` : "";
    metaRows += buildMetaRow(isLt ? "Vaizdo failas" : "Video File", `${escapeHtml(data.videoFileName)}${escapeHtml(sizeText)}`);
  }
  if (data.videoUrl) {
    metaRows += buildMetaRow(isLt ? "Vaizdo nuoroda" : "Video Link", `<a href="${escapeHtml(data.videoUrl)}" style="color:#34D399;word-break:break-all;" target="_blank">${escapeHtml(data.videoUrl)}</a>`);
  }
  if (data.submittedAt) {
    metaRows += buildMetaRow(isLt ? "Pateikimo laikas" : "Submitted At", escapeHtml(new Date(data.submittedAt).toLocaleString(isLt ? "lt-LT" : "en-US")));
  }
  if (templateKey === "submissionReceived" || templateKey === "remoteLivePass") {
    metaRows += buildMetaRow(isLt ? "Atsakymo terminas" : "Response Window", `<strong style="color:#9BC4AE;">${escapeHtml(responseTimeDisplay)}</strong>`);
  }
  if (data.attendanceType) {
    const isRemote = data.attendanceType === "remote";
    const rsvpLabel = isRemote
      ? (isLt ? "Nuotolinis stebėtojas (su balsavimo žetonu)" : "Remote participant (live stream & vote)")
      : (isLt ? "Dalyvausiu gyvai Kaune (Vytauto pr. 50)" : "Attending in person (Vytauto pr. 50, Kaunas)");
    metaRows += buildMetaRow(isLt ? "Dalyvavimas (RSVP)" : "Attendance (RSVP)", `<strong style="color:${isRemote ? "#34D399" : "#F8FAF7"};">${rsvpLabel}</strong>`);
  } else if (templateKey === "remoteLivePass" || templateKey === "winner" || templateKey === "finalist") {
    metaRows += buildMetaRow(isLt ? "Ceremonijos vieta" : "Ceremony Venue", isLt ? EMAIL_THEME.venueLt : EMAIL_THEME.venueEn);
  }
  if (data.synopsis) {
    metaRows += buildMetaRow(isLt ? "Sinopsis" : "Synopsis", `<span style="color:#BAC9C0; line-height:1.55;">„${escapeHtml(data.synopsis)}“</span>`, true);
  }

  let tokenSpotlightHtml = "";
  if (data.liveToken) {
    const streamUrl = data.liveStreamUrl || `${EMAIL_THEME.liveStreamUrl}?t=${encodeURIComponent(data.liveToken)}`;
    tokenSpotlightHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 6px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9BC4AE;">
              ${isLt ? "Jūsų transliacijos žetonas" : "Your Live Stream Pass Token"}
            </p>
            <p style="margin: 0 0 8px 0; font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #34D399;">
              ${escapeHtml(data.liveToken)}
            </p>
            <p style="margin: 0; font-size: 12px; color: #7A9689;">
              <a href="${escapeHtml(streamUrl)}" target="_blank" style="color: #9BC4AE; text-decoration: underline;">${escapeHtml(streamUrl)}</a>
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  let awardHighlightBlock = "";
  if (templateKey === "winner" || data.awardTitle) {
    const awardHeadline = data.awardTitle || (isLt ? "Oficialus Festivalio Laureatas" : "Official Festival Laureate");
    awardHighlightBlock = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 6px; margin: 0 0 20px 0;">
        <tr>
          <td style="padding: 18px 20px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #34D399; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">
              ${isLt ? "APDOVANOJIMAS / NOMINACIJA" : "OFFICIAL AWARD / NOMINATION"}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #F8FAF7;">
              ${escapeHtml(awardHeadline)}${juryPlaceLabel ? ` &middot; ${escapeHtml(juryPlaceLabel)}` : ""}
            </p>
            <p style="margin: 0; font-size: 13px; color: #BAC9C0;">
              „${escapeHtml(filmTitle)}“ &mdash; ${escapeHtml(applicantName)}
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  let customMessageBlock = "";
  if (data.customMessage) {
    customMessageBlock = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border: 1px solid #153D34; border-radius: 6px; margin: 0 0 20px 0;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #9BC4AE; text-transform: uppercase; letter-spacing: 0.08em;">
              ${isLt ? "Komisijos pastaba" : "Note from the Committee"}
            </p>
            <p style="margin: 0; font-size: 13px; color: #F8FAF7; line-height: 1.6;">
              ${escapeHtml(data.customMessage)}
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  const defaultHomeUrl = isLt ? `${EMAIL_THEME.siteUrl}lt/` : `${EMAIL_THEME.siteUrl}en/`;
  const ctaUrl = data.ctaUrl || data.streamLink || (data.liveToken ? `${EMAIL_THEME.liveStreamUrl}?t=${encodeURIComponent(data.liveToken)}` : defaultHomeUrl);
  const ctaButtonHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="cta-table" style="margin: 4px auto 18px auto;">
      <tr>
        <td align="center" style="border-radius: 4px; background-color: #12372F; border: 1px solid #34D399;">
          <a href="${escapeHtml(ctaUrl)}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 700; color: #F8FAF7; text-decoration: none; border-radius: 4px;">
            ${escapeHtml(t.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  const childrenHtml = `
    <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #F8FAF7; line-height: 1.25; letter-spacing: -0.02em;">
      ${headingText}
    </h1>
    <p style="margin: 0 0 22px 0; font-size: 15px; color: #BAC9C0; line-height: 1.65;">
      ${bodyText}
    </p>

    ${awardHighlightBlock}
    ${tokenSpotlightHtml}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border-radius: 6px; margin-bottom: 24px;">
      <tr>
        <td class="section-pad" style="padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE;">
            ${escapeHtml(t.detailsTitle)}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${metaRows}
          </table>
        </td>
      </tr>
    </table>

    ${customMessageBlock}

    ${ctaButtonHtml}

    <p style="margin: 0; font-size: 12px; color: #7A9689; line-height: 1.6; text-align: center;">
      ${escapeHtml(t.note || "")}
    </p>
  `;

  return buildEmailDocument({
    lang,
    preheader: t.preheader,
    statusKey: templateKey,
    statusKicker: buildKickerLabel(templateKey, lang, data, badge),
    childrenHtml
  });
}

/**
 * Generates an administrative notification email sent to the festival committee.
 * Supports: (lang, data), (data), (templateKey, lang, data), or (templateKey, data)
 */
function generateAdminNotificationHtml(p1, p2, p3) {
  const { lang, data } = normalizeParams(p1, p2, p3, "adminNotification");
  const texts = emailTexts[lang] || emailTexts.lt;
  const t = texts.adminNotification;
  const isLt = lang === "lt";
  const badge = STATUS_BADGES.adminNotification;

  const adminUrl = EMAIL_THEME.adminUrl;
  const filmTitle = data.filmTitle || "-";
  const authorName = data.directorName || data.name || "-";
  const applicantEmail = data.email || "-";
  const duration = data.videoDurationSeconds ? `${data.videoDurationSeconds} s` : "-";

  let teamRows = buildCrewRowsHtml({ ...data, directorName: authorName }, isLt);
  teamRows += buildMetaRow(isLt ? "El. paštas" : "Email", `<a href="mailto:${escapeHtml(applicantEmail)}" style="color:#34D399;">${escapeHtml(applicantEmail)}</a>`);
  teamRows += buildMetaRow(
    isLt ? "Kategorija ir įstaiga" : "Category & School",
    `${escapeHtml(data.category || "-")} (${escapeHtml(data.age || "-")} ${isLt ? "m." : "yrs"}) · ${escapeHtml(data.institution || "-")} · ${escapeHtml(data.location || data.countryCity || "-")}`,
    true
  );

  const fileSizeMb = data.videoSizeBytes ? `${(Number(data.videoSizeBytes) / (1024 * 1024)).toFixed(2)} MB` : "";
  const sourceStr = data.videoSourceType === "link" ? (isLt ? "Nuoroda" : "External Link") : (isLt ? "Įkeltas failas" : "Uploaded File");
  const fileDetailParts = [sourceStr, data.videoFileName || "", fileSizeMb ? `(${fileSizeMb})` : ""].filter(Boolean);

  let videoRows = "";
  videoRows += buildMetaRow(isLt ? "Šaltinis ir failas" : "Source & File", escapeHtml(fileDetailParts.join(" · ")));
  videoRows += buildMetaRow(
    isLt ? "Specifikacija" : "Specification",
    escapeHtml([`${duration}${data.videoDurationSeconds && Number(data.videoDurationSeconds) <= 180 ? " (≤ 180 s)" : ""}`, data.videoResolution || "", data.deviceModel || ""].filter(Boolean).join(" · "))
  );
  if (data.attendanceType) {
    const isRemote = data.attendanceType === "remote";
    const rsvpText = isRemote
      ? (isLt ? `Nuotolinis stebėtojas${data.liveToken ? ` · ${data.liveToken}` : ""}` : `Remote participant${data.liveToken ? ` · ${data.liveToken}` : ""}`)
      : (isLt ? "Dalyvaus gyvai Kaune" : "Attending in person (Kaunas)");
    videoRows += buildMetaRow(isLt ? "RSVP ir žetonas" : "RSVP & Token", `<strong style="color:${isRemote ? "#34D399" : "#F8FAF7"};">${escapeHtml(rsvpText)}</strong>`);
  }
  if (data.storagePath) {
    videoRows += buildMetaRow(isLt ? "Saugyklos kelias" : "Storage Path", `<code style="font-size:11px; color:#BAC9C0;">${escapeHtml(data.storagePath)}</code>`);
  }
  if (data.videoUrl) {
    videoRows += buildMetaRow(isLt ? "Vaizdo nuoroda" : "Video URL", `<a href="${escapeHtml(data.videoUrl)}" target="_blank" style="color:#34D399; word-break:break-all;">${escapeHtml(data.videoUrl)}</a>`, !data.synopsis);
  }
  if (data.synopsis) {
    videoRows += buildMetaRow(isLt ? "Sinopsis" : "Synopsis", `<span style="color:#BAC9C0; line-height:1.55;">${escapeHtml(data.synopsis)}</span>`, true);
  }

  const childrenHtml = `
    <h1 style="margin: 0 0 10px 0; font-size: 23px; font-weight: 700; color: #F8FAF7; line-height: 1.25;">
      „${escapeHtml(filmTitle)}“
    </h1>
    <p style="margin: 0 0 22px 0; font-size: 14px; color: #BAC9C0; line-height: 1.65;">
      ${escapeHtml(t.body)}
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border-radius: 6px; margin-bottom: 22px;">
      <tr>
        <td class="section-pad" style="padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE;">
            ${isLt ? "Kūrybinė komanda ir kontaktai" : "Creative Team & Contacts"}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 18px;">
            ${teamRows}
          </table>

          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE;">
            ${isLt ? "Vaizdo įrašas ir dalyvavimas" : "Video & Attendance"}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${videoRows}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="cta-table" style="margin: 4px auto 8px auto;">
      <tr>
        <td align="center" style="border-radius: 4px; background-color: #12372F; border: 1px solid #34D399;">
          <a href="${adminUrl}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 700; color: #F8FAF7; text-decoration: none; border-radius: 4px;">
            ${escapeHtml(t.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return buildEmailDocument({
    lang,
    preheader: `${t.preheader} „${filmTitle}“ (${authorName})`,
    statusKey: "adminNotification",
    statusKicker: buildKickerLabel("adminNotification", lang, data, badge),
    isAdminMail: true,
    childrenHtml
  });
}

/**
 * Generates team invitation email.
 * Supports: (lang, data), (data), (templateKey, lang, data), or (templateKey, data)
 */
function generateInviteEmailHtml(p1, p2, p3) {
  const { lang, data } = normalizeParams(p1, p2, p3, "userInvite");
  const texts = emailTexts[lang] || emailTexts.lt;
  const t = texts.userInvite;
  const isLt = lang === "lt";
  const badge = STATUS_BADGES.userInvite;

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
  metaRows += buildMetaRow(isLt ? "Gavėjas" : "Invitee", `<strong>${escapeHtml(inviteeName)}</strong> (<a href="mailto:${escapeHtml(email)}" style="color:#34D399;">${escapeHtml(email)}</a>)`);
  metaRows += buildMetaRow(isLt ? "Priskirta rolė" : "Assigned Role", `<strong style="color:#34D399;">${escapeHtml(roleDisplay)}</strong>`);
  if (data.invitedBy) {
    metaRows += buildMetaRow(isLt ? "Pakvietė" : "Invited By", escapeHtml(data.invitedBy));
  }
  metaRows += buildMetaRow(isLt ? "Galiojimas" : "Valid For", isLt ? "7 dienas nuo išsiuntimo" : "7 days from dispatch", true);

  const childrenHtml = `
    <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #F8FAF7; line-height: 1.25;">
      ${t.heading.replace("{{name}}", escapeHtml(inviteeName))}
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #BAC9C0; line-height: 1.65;">
      ${escapeHtml(t.body)}
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 6px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9BC4AE;">
            ${isLt ? "Patvirtinimo kodas" : "Verification Code"}
          </p>
          <p style="margin: 0 0 8px 0; font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 26px; font-weight: 700; letter-spacing: 6px; color: #34D399;">
            ${escapeHtml(code)}
          </p>
          <p style="margin: 0; font-size: 12px; color: #7A9689;">
            ${isLt ? "Įveskite šį kodą arba spauskite aktyvavimo mygtuką žemiau" : "Enter this code or click the activation button below"}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border-radius: 6px; margin-bottom: 24px;">
      <tr>
        <td class="section-pad" style="padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE;">
            ${escapeHtml(t.detailsTitle)}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${metaRows}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="cta-table" style="margin: 4px auto 18px auto;">
      <tr>
        <td align="center" style="border-radius: 4px; background-color: #12372F; border: 1px solid #34D399;">
          <a href="${escapeHtml(inviteUrl)}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 700; color: #F8FAF7; text-decoration: none; border-radius: 4px;">
            ${escapeHtml(t.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; color: #7A9689; line-height: 1.6; text-align: center;">
      ${escapeHtml(t.note)}
    </p>
  `;

  return buildEmailDocument({
    lang,
    preheader: `${t.preheader} (${inviteeName} · ${roleDisplay})`,
    statusKey: "userInvite",
    statusKicker: isLt ? badge.labelLt : badge.labelEn,
    isAdminMail: true,
    childrenHtml
  });
}

/**
 * Generates an email notification for a new dashboard access request.
 */
function generateAccessRequestEmailHtml(p1, p2, p3) {
  const { lang, data } = normalizeParams(p1, p2, p3, "accessRequest");
  const texts = emailTexts[lang] || emailTexts.lt;
  const t = texts.accessRequest;
  const isLt = lang === "lt";
  const badge = STATUS_BADGES.accessRequest;

  const applicantName = data.name || (isLt ? "Pareiškėjas" : "Applicant");
  const email = data.email || "-";
  const reason = data.reason || "-";
  const submittedAt = data.submittedAt || new Date().toLocaleString(isLt ? "lt-LT" : "en-US");
  const adminUrl = data.adminUrl || EMAIL_THEME.adminUrl;

  let metaRows = "";
  metaRows += buildMetaRow(isLt ? "Pareiškėjas" : "Applicant", `<strong>${escapeHtml(applicantName)}</strong>`);
  metaRows += buildMetaRow(isLt ? "El. paštas" : "Email", `<a href="mailto:${escapeHtml(email)}" style="color:#34D399;">${escapeHtml(email)}</a>`);
  metaRows += buildMetaRow(isLt ? "Pateikimo laikas" : "Submitted At", escapeHtml(submittedAt));
  metaRows += buildMetaRow(isLt ? "Nurodyta priežastis" : "Stated Reason", `<span style="color:#F8FAF7;">${escapeHtml(reason)}</span>`, true);

  const childrenHtml = `
    <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #F8FAF7; line-height: 1.25;">
      ${escapeHtml(t.heading)}
    </h1>
    <p style="margin: 0 0 22px 0; font-size: 15px; color: #BAC9C0; line-height: 1.65;">
      ${escapeHtml(t.body)}
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border-radius: 6px; margin-bottom: 24px;">
      <tr>
        <td class="section-pad" style="padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE;">
            ${escapeHtml(t.detailsTitle)}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${metaRows}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="cta-table" style="margin: 4px auto 18px auto;">
      <tr>
        <td align="center" style="border-radius: 4px; background-color: #12372F; border: 1px solid #34D399;">
          <a href="${escapeHtml(adminUrl)}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 700; color: #F8FAF7; text-decoration: none; border-radius: 4px;">
            ${escapeHtml(t.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; color: #7A9689; line-height: 1.6; text-align: center;">
      ${escapeHtml(t.note)}
    </p>
  `;

  return buildEmailDocument({
    lang,
    preheader: `${t.preheader} (${applicantName} · ${email})`,
    statusKey: "accessRequest",
    statusKicker: isLt ? badge.labelLt : badge.labelEn,
    isAdminMail: true,
    childrenHtml
  });
}

/**
 * Generates an email notification confirming that dashboard access has been granted to a user.
 */
function generateAccessGrantedEmailHtml(p1, p2, p3) {
  const { lang, data } = normalizeParams(p1, p2, p3, "accessGranted");
  const texts = emailTexts[lang] || emailTexts.lt;
  const t = texts.accessGranted;
  const isLt = lang === "lt";
  const badge = STATUS_BADGES.accessGranted;

  const userName = data.name || (isLt ? "Vartotojas" : "Team Member");
  const email = data.email || "-";
  const role = data.role || "Administratorius";
  const adminUrl = data.adminUrl || EMAIL_THEME.adminUrl;
  const grantedBy = data.grantedBy || "AISFF Administratorius";

  let metaRows = "";
  metaRows += buildMetaRow(isLt ? "Vartotojas" : "User", `<strong>${escapeHtml(userName)}</strong>`);
  metaRows += buildMetaRow(isLt ? "Paskyros el. paštas" : "Account Email", `<a href="mailto:${escapeHtml(email)}" style="color:#34D399;">${escapeHtml(email)}</a>`);
  metaRows += buildMetaRow(isLt ? "Suteikta rolė" : "Assigned Role", `<strong style="color:#34D399;">${escapeHtml(role)}</strong>`);
  metaRows += buildMetaRow(isLt ? "Patvirtino" : "Approved By", escapeHtml(grantedBy), true);

  const childrenHtml = `
    <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #F8FAF7; line-height: 1.25;">
      ${t.heading.replace("{{name}}", escapeHtml(userName))}
    </h1>
    <p style="margin: 0 0 22px 0; font-size: 15px; color: #BAC9C0; line-height: 1.65;">
      ${escapeHtml(t.body)}
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #081B17; border-radius: 6px; margin-bottom: 24px;">
      <tr>
        <td class="section-pad" style="padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9BC4AE;">
            ${escapeHtml(t.detailsTitle)}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${metaRows}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="cta-table" style="margin: 4px auto 18px auto;">
      <tr>
        <td align="center" style="border-radius: 4px; background-color: #12372F; border: 1px solid #34D399;">
          <a href="${escapeHtml(adminUrl)}" target="_blank" class="btn-primary" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 700; color: #F8FAF7; text-decoration: none; border-radius: 4px;">
            ${escapeHtml(t.ctaText)} &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; color: #7A9689; line-height: 1.6; text-align: center;">
      ${escapeHtml(t.note)}
    </p>
  `;

  return buildEmailDocument({
    lang,
    preheader: `${t.preheader} (${userName})`,
    statusKey: "accessGranted",
    statusKicker: isLt ? badge.labelLt : badge.labelEn,
    isAdminMail: true,
    childrenHtml
  });
}

/**
 * Returns the localized email subject line for any given template key.
 */
function getEmailSubject(p1, p2, p3) {
  const { templateKey, lang, data } = normalizeParams(p1, p2, p3, "submissionReceived");
  const texts = emailTexts[lang] || emailTexts.lt;
  const t = texts[templateKey] || texts.submissionReceived;

  if (t && t.sub) {
    if (data && data.filmTitle) {
      if (templateKey === "winner" && data.awardTitle) {
        return `${t.sub}: „${data.filmTitle}“ (${data.awardTitle})`;
      }
      return `${t.sub}: „${data.filmTitle}“`;
    }
    return t.sub;
  }
  return lang === "en" ? "AISFF 2027 Notification" : "AISFF 2027 Pranešimas";
}

/**
 * Builds a complete plain-text representation of all submitted film & author details.
 */
function generateSubmissionPlainText(p1, p2, p3) {
  const { templateKey, lang, data } = normalizeParams(p1, p2, p3, "submissionReceived");
  const isLt = lang === "lt";
  const directorName = data.directorName || [data.directorFirstName, data.directorLastName].filter(Boolean).join(" ") || data.name || "-";
  const cameraName = data.cameraOperatorName || [data.cameraOperatorFirstName, data.cameraOperatorLastName].filter(Boolean).join(" ") || "-";
  const ideaName = data.ideaAuthorName || [data.ideaAuthorFirstName, data.ideaAuthorLastName].filter(Boolean).join(" ") || "-";
  const writerName = data.screenwriterName || [data.screenwriterFirstName, data.screenwriterLastName].filter(Boolean).join(" ") || "-";
  const sizeMb = data.videoSizeBytes ? `${(Number(data.videoSizeBytes) / (1024 * 1024)).toFixed(2)} MB` : "-";
  const responseTime = data.responseTimeText || (isLt ? "per 5 darbo dienas" : "within 5 business days");
  const isAdmin = templateKey === "adminNotification";

  const lines = [
    isLt
      ? (isAdmin ? "AISFF 2027 | Nauja dalyvio paraiška festivaliui („Mano pašaukimas“)" : "AISFF 2027 | Jūsų filmo paraiška sėkmingai gauta („Mano pašaukimas“)")
      : (isAdmin ? "AISFF 2027 | New Film Submission Dossier (MY PURPOSE)" : "AISFF 2027 | Film Submission Successfully Received (MY PURPOSE)"),
    "================================================================",
    `${isLt ? "Paraiškos ID" : "Submission ID"}: ${data.id || "-"}`,
    `${isLt ? "Pateikimo data" : "Submitted At"}: ${data.submittedAt || new Date().toISOString()}`,
    `${isLt ? "Kalba" : "Language"}: ${lang.toUpperCase()}`,
    `${isLt ? "Atsakymo terminas" : "Expected Response Time"}: ${responseTime}`,
    "",
    isLt ? "--- FILMO DUOMENYS ---" : "--- FILM DETAILS ---",
    `${isLt ? "Filmo pavadinimas" : "Film Title"}: ${data.filmTitle || "-"}`,
    data.awardTitle ? `${isLt ? "Apdovanojimas / Nominacija" : "Award / Nomination"}: ${data.awardTitle}` : null,
    data.juryPlace ? `${isLt ? "Komisijos vieta" : "Jury Ranking"}: ${data.juryPlace}` : null,
    `${isLt ? "Kategorija" : "Category"}: ${data.category || "-"}`,
    `${isLt ? "Amžius" : "Age"}: ${data.age || "-"}`,
    `${isLt ? "Šalis ir miestas" : "Location"}: ${data.location || data.countryCity || "-"}`,
    `${isLt ? "Mokykla / Studija" : "Institution"}: ${data.institution || "-"}`,
    `${isLt ? "Filmavimo įranga" : "Filming Device"}: ${data.deviceModel || "-"}`,
    `${isLt ? "Sinopsis" : "Synopsis"}: ${data.synopsis || "-"}`,
    "",
    isLt ? "--- AUTORIAI IR KŪRYBINĖ KOMANDA ---" : "--- AUTHORS & CREATIVE TEAM ---",
    `${isLt ? "Režisierius / Autorius" : "Director / Author"}: ${directorName}${data.directorFirstName ? ` (Vardas: ${data.directorFirstName}, Pavardė: ${data.directorLastName || ""})` : ""}`,
    `${isLt ? "Operatorius" : "Camera Operator"}: ${cameraName}`,
    `${isLt ? "Idėjos autorius" : "Author of the Idea"}: ${ideaName}`,
    `${isLt ? "Scenarijaus autorius" : "Screenwriter"}: ${writerName}`,
    `${isLt ? "El. paštas" : "Email"}: ${data.email || "-"}`,
    "",
    isLt ? "--- VAIZDO ĮRAŠO DUOMENYS ---" : "--- VIDEO DETAILS ---",
    `${isLt ? "Šaltinis" : "Source Type"}: ${data.videoSourceType === "link" ? (isLt ? "Vaizdo nuoroda" : "Video Link") : (isLt ? "Įkeltas failas" : "Uploaded File")}`,
    `${isLt ? "Failo pavadinimas" : "File Name"}: ${data.videoFileName || "-"}`,
    `${isLt ? "Trukmė" : "Duration"}: ${data.videoDurationSeconds ? `${data.videoDurationSeconds} s` : "-"}`,
    `${isLt ? "Dydis" : "File Size"}: ${sizeMb}`,
    `${isLt ? "Raiška" : "Resolution"}: ${data.videoResolution || "-"}`,
    `${isLt ? "Nuoroda / URL" : "Video URL"}: ${data.videoUrl || "-"}`,
    data.storagePath ? `${isLt ? "Saugyklos kelias" : "Storage Path"}: ${data.storagePath}` : null,
    "",
    isLt ? "--- DALYVAVIMAS IR VIETA ---" : "--- CEREMONY & VENUE ---",
    `${isLt ? "Dalyvavimas (RSVP)" : "Attendance"}: ${data.attendanceType === "remote" ? (isLt ? "Nuotolinis stebėtojas" : "Remote participant") : (isLt ? "Dalyvaus gyvai" : "Attending in person")}`,
    `${isLt ? "Data ir vieta" : "Date & Venue"}: ${isLt ? `2027 m. balandžio 27 d. · ${EMAIL_THEME.venueLt}` : `April 27, 2027 · ${EMAIL_THEME.venueEn}`}`,
    data.liveToken ? `${isLt ? "Transliacijos žetonas" : "Live Stream Token"}: ${data.liveToken}` : null,
    data.liveStreamUrl ? `${isLt ? "Transliacijos nuoroda" : "Live Stream URL"}: ${data.liveStreamUrl}` : null,
    "",
    isLt ? "AISFF · www.azuolynasfilmfestival.lt · azuolynasfilmfestival@gmail.com" : "AISFF · www.azuolynasfilmfestival.lt · azuolynasfilmfestival@gmail.com"
  ].filter(Boolean);

  return lines.join("\n");
}

// Global browser and runtime scope compatibility
if (typeof window !== "undefined") {
  window.emailTexts = emailTexts;
  window.generateEmailHtml = generateEmailHtml;
  window.getEmailSubject = getEmailSubject;
  window.generateAdminNotificationHtml = generateAdminNotificationHtml;
  window.generateInviteEmailHtml = generateInviteEmailHtml;
  window.generateAccessRequestEmailHtml = generateAccessRequestEmailHtml;
  window.generateAccessGrantedEmailHtml = generateAccessGrantedEmailHtml;
  window.generateSubmissionPlainText = generateSubmissionPlainText;
}
if (typeof globalThis !== "undefined") {
  globalThis.emailTexts = emailTexts;
  globalThis.generateEmailHtml = generateEmailHtml;
  globalThis.getEmailSubject = getEmailSubject;
  globalThis.generateAdminNotificationHtml = generateAdminNotificationHtml;
  globalThis.generateInviteEmailHtml = generateInviteEmailHtml;
  globalThis.generateAccessRequestEmailHtml = generateAccessRequestEmailHtml;
  globalThis.generateAccessGrantedEmailHtml = generateAccessGrantedEmailHtml;
  globalThis.generateSubmissionPlainText = generateSubmissionPlainText;
}

// Node / CommonJS module export compatibility (for backend/tests)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    emailTexts,
    generateEmailHtml,
    getEmailSubject,
    generateAdminNotificationHtml,
    generateInviteEmailHtml,
    generateAccessRequestEmailHtml,
    generateAccessGrantedEmailHtml,
    generateSubmissionPlainText
  };
}
