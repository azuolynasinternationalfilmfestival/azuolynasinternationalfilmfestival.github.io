const firebaseConfig = {
  apiKey: "AIzaSyDDKEzn0jN_xUTDw5aXABU79ZEYKIACfdE",
  authDomain: "filmfest-509606.firebaseapp.com",
  projectId: "filmfest-509606",
  storageBucket: "filmfest-509606.firebasestorage.app",
  messagingSenderId: "230564112771",
  appId: "1:230564112771:web:a3e4ff9d47bf0ff3fb2eb6",
  firestoreDatabaseId: "ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83"
};

if (typeof firebase !== "undefined") {
  if (!firebase.apps || !firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
    } catch (e) {
      console.warn("Firebase initializeApp note:", e);
    }
  }
}

function getFirestoreInstance() {
  if (typeof firebase === "undefined" || typeof firebase.firestore !== "function") return null;
  const dbId = firebaseConfig.firestoreDatabaseId;
  const origFirestore = firebase.firestore;

  if (dbId && dbId !== "(default)" && typeof firebase.app === "function") {
    try {
      const app = firebase.app();
      if (app && app._delegate && app._delegate.container) {
        const modularDb = app._delegate.container.getProvider("firestore").getImmediate({ identifier: dbId });
        const appCompat = app._delegate.container.getProvider("app-compat").getImmediate();
        const compatDb = (origFirestore && origFirestore.Firestore)
          ? new origFirestore.Firestore(appCompat, modularDb)
          : null;

        if (compatDb) {
          // Point firebase.firestore and app.firestore to the named database instance
          const customFirestore = function(targetApp) {
            if (targetApp && targetApp !== app && typeof origFirestore === "function") {
              return origFirestore(targetApp);
            }
            return compatDb;
          };
          Object.assign(customFirestore, origFirestore);
          firebase.firestore = customFirestore;

          app.firestore = function(targetId) {
            if (targetId && targetId !== dbId && typeof origFirestore === "function") {
              return origFirestore(app);
            }
            return compatDb;
          };

          return compatDb;
        }
      }
    } catch (e) {
      console.warn("Custom databaseId initialization notice:", e);
    }
  }
  return firebase.firestore();
}

var auth = (typeof firebase !== "undefined" && typeof firebase.auth === "function") ? firebase.auth() : null;
var db = getFirestoreInstance();
var storage = (typeof firebase !== "undefined" && typeof firebase.storage === "function") ? firebase.storage() : null;

var PRIMARY_SUPERADMIN_EMAIL = "azuolynasfilmfestival@gmail.com";

var AUTHORIZED_ADMIN_EMAILS = [
  "azuolynasfilmfestival@gmail.com",
  "karina.brdar@gmail.com",
  "dominikphotofficial.t@gmail.com",
  "dominikphotofficial.lt@gmail.com"
];

const DEFAULT_CONTENT = {
  lt: {
    heroBadge: "Tarptautinis Mokinių Filmų Festivalis",
    topic: "Mano pašaukimas (My purpose)",
    aboutText: "Ką norite veikti savo gyvenime ir kaip atrasti tikrąjį pašaukimą? Ieškome istorijų apie savo kelio atradimą, karjeros pasirinkimus ir vidinių abejonių įveikimą. Papasakokite, ko reikia, kad sektumėte savo aistra, kai aplinkiniai tikisi kažko kito – ar tai būtų šeimos spaudimas rinktis „rimtą“ profesiją, pvz., mediciną ar teisę, ar jūsų pačių baimė žengti į meną, muziką ar kūrybines sritis. Parodykite šios kelionės tikrovę, kliūtis kelyje ir tą akimirką, kai jūs ar jūsų herojai suprato, ką iš tiesų privalo daryti.",
    datesSubmissions: "Iki kovo 26 d.",
    dateEvent: "2027 m. balandžio 23 d. (Atidarymo ceremonija)",
    targetAudience: "Mokiniai (10–18 m.)",
    rule1: "Filmas privalo būti nufilmuotas išmaniuoju telefonu arba planšete.",
    rule2: "Maksimali filmo trukmė – griežtai iki 3 minučių.",
    rule3: "Vienas dalyvis gali pateikti ne daugiau kaip vieną darbą.",
    policyText: "Kadangi mums svarbi vaikų kūrybinė vizija ir jų saviraiška, darbai su dominuojančiu suaugusiųjų dalyvavimu festivalyje nepriimami. Pirmenybė bus teikiama filmams, kuriuos sukūrė tik patys vaikai.",
    cat1Age: "Nuo 10 iki 13 metų amžiaus",
    cat1Desc: "Pradedančiųjų kino kūrėjų vizualiniai ieškojimai ir autorinis pasakojimas.",
    cat2Age: "Nuo 14 iki 18 metų amžiaus",
    cat2Desc: "Vyresniųjų moksleivių kinematografinė kalba, gilesnė dramaturgija ir savitas braižas.",
    recordingPlaceholder: "Festivalio atidarymo vaizdo įrašas bus patalpintas 2027 m. balandžio 23 d."
  },
  en: {
    heroBadge: "International Students Film Festival",
    topic: "My purpose",
    aboutText: "What do you want to do with your life, and how do you find your true calling? We are looking for stories about discovering your path, making career choices, and overcoming self-doubt. Tell us what it takes to follow your passion when the people around you expect something different—whether it is family pressure to pursue a 'serious' career like medicine or law, or your own fear of stepping into the arts, music, or creative fields. Show the reality of this journey, the obstacles along the way, and the exact moment you or your characters realized what you were meant to do.",
    datesSubmissions: "Until March 26th",
    dateEvent: "April 23rd, 2027 (Opening Ceremony)",
    targetAudience: "Students (10–18 yrs)",
    rule1: "The film must be shot on a phone/tablet;",
    rule2: "The film must be strictly up to 3 minutes;",
    rule3: "From one participant no more than one work;",
    policyText: "Since the creative vision of children and their self-expression are important to us, works with the dominant participation of adults are not accepted at the festival. Films made only by children will be given priority.",
    cat1Age: "From 10 to 13 years old",
    cat1Desc: "For budding visual artists beginning their cinematic storytelling journey.",
    cat2Age: "From 14 to 18 years old",
    cat2Desc: "For youth directors exploring bold perspectives and nuanced compositions.",
    recordingPlaceholder: "The official festival recording will be published here on April 23rd, 2027."
  },
  showAbout: true,
  showTerms: true,
  showFaq: true,
  showCategories: true,
  showEditions: true,
  showArchive: true,
  showCurrentEdition: true,
  showResults: false,
  showVoting: false,
  showScreening: true,
  showSubmit: true,
  recordingVideoUrl: ""
};

if (typeof window !== "undefined") {
  window.firebaseConfig = firebaseConfig;
  window.auth = auth;
  window.db = db;
  window.storage = storage;
  window.PRIMARY_SUPERADMIN_EMAIL = PRIMARY_SUPERADMIN_EMAIL;
  window.AUTHORIZED_ADMIN_EMAILS = AUTHORIZED_ADMIN_EMAILS;
  window.DEFAULT_CONTENT = DEFAULT_CONTENT;
}