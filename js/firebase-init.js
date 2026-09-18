const firebaseConfig = {
  apiKey: "AIzaSyAl-aLSlSHUdrZ4Rr4x23n3bu3QFZSYyB0",
  authDomain: "azuolynas-film-fest.firebaseapp.com",
  projectId: "azuolynas-film-fest",
  storageBucket: "azuolynas-film-fest.firebasestorage.app",
  messagingSenderId: "541713316291",
  appId: "1:541713316291:web:51de85684512c9d7e6a576",
  measurementId: "G-9Z050BPHJ5"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

export const AUTHORIZED_ADMIN_EMAILS = [
  "azuolynasfilmfestival@gmail.com",
  "azuolynasfilmfest@gmail.com"
];

export const DEFAULT_CONTENT = {
  lt: {
    heroBadge: "Tarptautinis Mokinių Filmų Festivalis",
    topic: "Neįprastas žvilgsnis į įprastus dalykus",
    aboutText: "„Ąžuolyno“ filmų festivalis pavadintas vieno iš Kauno lankytinų vietų – Ąžuolyno parko – garbei, kurio papėdėje yra įsikūrusi mūsų studija.",
    datesSubmissions: "Iki 2026 m. balandžio 2 d.",
    dateEvent: "2026 m. balandžio 17 d. (Atidarymo ceremonija)",
    targetAudience: "Mokiniai (10–18 m.)",
    recordingPlaceholder: "Festivalio atidarymo vaizdo įrašas bus patalpintas 2026 m. balandžio 17 d."
  },
  en: {
    heroBadge: "International Students Film Festival",
    topic: "An unusual view at ordinary things",
    aboutText: "The «Ažuolynas» Film Festival is named after one of the sights of Kaunas, at the foot of which our studio is located.",
    datesSubmissions: "Until April 2nd, 2026",
    dateEvent: "April 17th, 2026 (Opening Ceremony)",
    targetAudience: "Students (10–18 yrs)",
    recordingPlaceholder: "The official festival recording will be published here on April 17th, 2026."
  },
  recordingVideoUrl: ""
};
