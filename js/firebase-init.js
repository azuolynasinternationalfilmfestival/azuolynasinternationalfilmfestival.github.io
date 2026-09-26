const firebaseConfig = {
  projectId: "filmfest-509606",
  appId: "1:230564112771:web:a3e4ff9d47bf0ff3fb2eb6",
  apiKey: "AIzaSyDDKEzn0jN_xUTDw5aXABU79ZEYKIACfdE",
  authDomain: "filmfest-509606.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-azuolynasinterna-cd7ce36e-5213-4751-8aa0-a7141d397a83",
  storageBucket: "filmfest-509606.firebasestorage.app",
  messagingSenderId: "230564112771",
  measurementId: ""
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

export const auth = (typeof firebase !== "undefined" && typeof firebase.auth === "function") ? firebase.auth() : null;
export const db = getFirestoreInstance();
export const storage = (typeof firebase !== "undefined" && typeof firebase.storage === "function") ? firebase.storage() : null;

export const PRIMARY_SUPERADMIN_EMAIL = "azuolynasfilmfestival@gmail.com";

export const AUTHORIZED_ADMIN_EMAILS = [
  "azuolynasfilmfestival@gmail.com",
  "karina.brdar@gmail.com",
  "dominikphotofficial.lt@gmail.com",
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
  recordingVideoUrl: "",
  prizesPhotoUrl: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da"
};