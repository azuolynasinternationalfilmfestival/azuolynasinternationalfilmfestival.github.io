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
    datesSubmissions: "Vasario 14 d. – Balandžio 17 d.",
    dateEvent: "Gegužės 27 d., 15:00 (YouTube)",
    targetAudience: "Mokiniai iš viso pasaulio",
    rule1: "Filmas privalo būti nufilmuotas išmaniuoju telefonu arba planšete.",
    rule2: "Maksimali filmo trukmė – iki 3 minučių (180 s įskaitant titrus).",
    rule3: "Vienas dalyvis gali pateikti tik vieną filmą.",
    rule4: "Filmai, sukurti su suaugusiųjų pagalba, nebus vertinami.",
    rule5: "Filmas privalo turėti angliškus subtitrus (English subtitles).",
    rule6: "Kiekvienas dalyvis gaus tiesioginę nuorodą į peržiūros transliaciją el. paštu.",
    cat1Age: "Nuo 10 iki 13 metų amžiaus",
    cat1Desc: "Jaunųjų režisierių vizualiniai eksperimentai ir autoriniai žingsniai kine.",
    cat2Age: "Nuo 14 iki 18 metų amžiaus",
    cat2Desc: "Vyresniųjų moksleivių kinematografinė kalba, gilesnė dramaturgija ir požiūrio kampas."
  },
  en: {
    heroBadge: "International Students Film Festival",
    topic: "An unusual view at ordinary things",
    datesSubmissions: "February 14th – April 17th",
    dateEvent: "May 27th, 15:00 Lithuanian Time",
    targetAudience: "Students Worldwide",
    rule1: "Your film must be filmed strictly on a tablet or smartphone.",
    rule2: "The duration cannot exceed 3 minutes (180 s including credits).",
    rule3: "From one participant: only one film entry.",
    rule4: "Films made with adult assistance will not be considered.",
    rule5: "Your film must have English subtitles.",
    rule6: "Every registered participant will receive a YouTube live stream link.",
    cat1Age: "From 10 to 13 years old",
    cat1Desc: "For budding visual artists beginning their cinematic storytelling journey.",
    cat2Age: "From 14 to 18 years old",
    cat2Desc: "For youth directors exploring bold perspectives and nuanced compositions."
  }
};
