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
  try {
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
  } catch (err) {
    console.warn("Firestore initialization notice:", err);
    return null;
  }
}

export function getFirebaseAuth() {
  if (typeof firebase !== "undefined" && typeof firebase.auth === "function") {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      return firebase.auth();
    } catch (e) {
      console.warn("Auth initialization notice:", e);
      return null;
    }
  }
  return null;
}

export function getFirebaseFirestore() {
  return getFirestoreInstance();
}

export function getFirebaseStorage() {
  if (typeof firebase !== "undefined" && typeof firebase.storage === "function") {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      return firebase.storage();
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function getFirebaseFunctions() {
  if (typeof firebase !== "undefined" && typeof firebase.functions === "function") {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      return firebase.functions("europe-west1");
    } catch (e) {
      return null;
    }
  }
  return null;
}

export const auth = getFirebaseAuth();
export const db = getFirestoreInstance();
export const storage = getFirebaseStorage();
export const functions = getFirebaseFunctions();

export const PRIMARY_SUPERADMIN_EMAIL = "azuolynasfilmfestival@gmail.com";

export const AUTHORIZED_ADMIN_EMAILS = [
  "azuolynasfilmfestival@gmail.com",
  "karina.brdar@gmail.com"
];

export const DEFAULT_CONTENT = {
  lt: {
    heroBadge: "7-asis Tarptautinis Mokinių Filmų Festivalis",
    topic: "Mano pašaukimas",
    topicDesc: "Ką norite veikti savo gyvenime ir kaip atrasti tikrąjį pašaukimą? Ieškome istorijų apie savo kelio paieškas, karjeros pasirinkimus ir vidinių abejonių įveikimą. Papasakokite, ko reikia, kad sektumėte savo aistra, kai aplinkiniai tikisi kažko kito – ar tai būtų šeimos spaudimas rinktis „rimtą“ profesiją, pavyzdžiui, mediciną ar teisę, ar jūsų pačių baimė žengti į meną, muziką ar kūrybines sritis. Parodykite šios kelionės tikrovę, kliūtis pakeliui ir tą akimirką, kai jūs ar jūsų herojai suprato, ką iš tiesų lemta daryti.",
    openingDate: "Lapkričio 1 d.",
    deadlineDate: "Kovo 26 d.",
    eventDate: "Balandžio 23 d.",
    aboutText: "„Ąžuolyno“ filmų festivalis pavadintas vieno iš Kauno lankytinų vietų – Ąžuolyno parko – garbei, kurio papėdėje yra įsikūrusi mūsų studija. Kviečiame 10–18 m. moksleivius kurti trumpametražius filmus iki 3 min. išmaniaisiais įrenginiais.",
    datesSubmissions: "Nuo lapkričio 1 d. iki kovo 26 d.",
    dateEvent: "2027 m. balandžio 23 d. (Kino festivalis ir tiesioginė transliacija)",
    targetAudience: "Mokiniai (10–18 m.)",
    recordingPlaceholder: "Festivalio ir tiesioginės transliacijos vaizdo įrašas bus pasiekiamas 2027 m. balandžio 23 d."
  },
  en: {
    heroBadge: "The 7th International Students Film Festival",
    topic: "My Purpose",
    topicDesc: "What do you want to do with your life, and how do you find your true calling? We are looking for stories about discovering your path, making career choices, and overcoming self-doubt. Tell us what it takes to follow your passion when the people around you expect something different—whether it is family pressure to pursue a \"serious\" career like medicine or law, or your own fear of stepping into the arts, music, or creative fields. Show the reality of this journey, the obstacles along the way, and the exact moment you or your characters realized what you were meant to do.",
    openingDate: "November 1st",
    deadlineDate: "March 26th",
    eventDate: "April 23rd",
    aboutText: "The «Ažuolynas» Film Festival is named after one of the sights of Kaunas, at the foot of which our studio is located. We invite youth directors aged 10–18 to submit smartphone short films up to 3 minutes.",
    datesSubmissions: "November 1st – March 26th",
    dateEvent: "April 23rd, 2027 (Film Festival & Live Stream)",
    targetAudience: "Students (10–18 yrs)",
    recordingPlaceholder: "The official festival recording and live stream replay will be published here on April 23rd, 2027."
  },
  selectedYear: "2027",
  showAbout: true,
  showTerms: true,
  showFaq: true,
  showCategories: true,
  showEditions: true,
  showArchive: true,
  showCurrentEdition: true,
  showResults: false,
  showVoting: true,
  votingActive: true,
  showScreening: true,
  showSubmit: true,
  maintenanceMode: false,
  archiveVisibility: true,
  recordingVideoUrl: "",
  prizesPhotoUrl: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da"
};