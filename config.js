const firebaseConfig = {
  apiKey: "AIzaSyAl-aLSlSHUdrZ4Rr4x23n3bu3QFZSYyB0",
  authDomain: "azuolynas-film-fest.firebaseapp.com",
  projectId: "azuolynas-film-fest",
  storageBucket: "azuolynas-film-fest.firebasestorage.app",
  messagingSenderId: "541713316291",
  appId: "1:541713316291:web:51de85684512c9d7e6a576",
  measurementId: "G-9Z050BPHJ5"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const AUTHORIZED_ADMIN_EMAILS = [
  "azuolynasfilmfestival@gmail.com",
  "azuolynasfilmfest@gmail.com"
];

const DEFAULT_CONTENT = {
  lt: {
    heroBadge: "Tarptautinis Mokinių Filmų Festivalis",
    topic: "Neįprastas žvilgsnis į įprastus dalykus",
    aboutText: "„Ąžuolyno“ filmų festivalis pavadintas vieno iš Kauno lankytinų vietų – Ąžuolyno parko – garbei, kurio papėdėje yra įsikūrusi mūsų studija.",
    datesSubmissions: "Iki 2026 m. balandžio 2 d.",
    dateEvent: "2026 m. balandžio 17 d. (Atidarymo ceremonija)",
    targetAudience: "Mokiniai (10–18 m.)",
    rule1: "Filmas privalo būti nufilmuotas išmaniuoju telefonu arba planšete.",
    rule2: "Maksimali filmo trukmė – griežtai iki 3 minučių.",
    rule3: "Vienas dalyvis gali pateikti ne daugiau kaip vieną darbą.",
    policyText: "Kadangi mums svarbi vaikų kūrybinė vizija ir jų saviraiška, darbai su dominuojančiu suaugusiųjų dalyvavimu festivalyje nepriimami. Pirmenybė bus teikiama filmams, kuriuos sukūrė tik patys vaikai.",
    cat1Age: "Nuo 10 iki 13 metų amžiaus",
    cat1Desc: "Pradedančiųjų kino kūrėjų vizualiniai ieškojimai ir autorinis pasakojimas.",
    cat2Age: "Nuo 14 iki 18 metų amžiaus",
    cat2Desc: "Vyresniųjų moksleivių kinematografinė kalba, gilesnė dramaturgija ir savitas braižas.",
    recordingPlaceholder: "Festivalio atidarymo vaizdo įrašas bus patalpintas 2026 m. balandžio 17 d."
  },
  en: {
    heroBadge: "International Students Film Festival",
    topic: "An unusual view at ordinary things",
    aboutText: "The «Ažuolynas» Film Festival is named after one of the sights of Kaunas, at the foot of which our studio is located.",
    datesSubmissions: "Until April 2nd, 2026",
    dateEvent: "April 17th, 2026 (Opening Ceremony)",
    targetAudience: "Students (10–18 yrs)",
    rule1: "The film must be shot on a phone/tablet;",
    rule2: "The film must be strictly up to 3 minutes;",
    rule3: "From one participant no more than one work;",
    policyText: "Since the creative vision of children and their self-expression are important to us, works with the dominant participation of adults are not accepted at the festival. Films made only by children will be given priority.",
    cat1Age: "From 10 to 13 years old",
    cat1Desc: "For budding visual artists beginning their cinematic storytelling journey.",
    cat2Age: "From 14 to 18 years old",
    cat2Desc: "For youth directors exploring bold perspectives and nuanced compositions.",
    recordingPlaceholder: "The official festival recording will be published here on April 17th, 2026."
  },
  recordingVideoUrl: ""
};