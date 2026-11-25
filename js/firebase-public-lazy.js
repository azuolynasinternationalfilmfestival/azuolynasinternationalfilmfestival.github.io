/* Modular Firebase v10.8.0 lazy loader for public pages (no Auth, no IndexedDB persistence, on-demand Storage). */
(() => {
  const FB_BASE = "https://www.gstatic.com/firebasejs/10.8.0/";

  const SENTINEL = "__fbSentinel";
  function makeSentinel(type, value) {
    return { [SENTINEL]: type, value };
  }

  // Provide lightweight FieldValue/Timestamp sentinels before modular SDK is imported.
  if (typeof window !== "undefined") {
    const fb = window.firebase || (window.firebase = {});
    if (!fb.firestore) {
      const fsStub = function () {
        return cachedDbFacade;
      };
      fsStub.FieldValue = {
        serverTimestamp: () => makeSentinel("serverTimestamp"),
        increment: (n) => makeSentinel("increment", n),
        delete: () => makeSentinel("delete")
      };
      fsStub.Timestamp = {
        fromMillis: (ms) => makeSentinel("timestamp", ms)
      };
      fb.firestore = fsStub;
    }
  }

  function resolveValue(val, m) {
    if (val === null || val === undefined || typeof val !== "object") return val;
    if (val[SENTINEL]) {
      if (val[SENTINEL] === "serverTimestamp") return m.serverTimestamp();
      if (val[SENTINEL] === "increment") return m.increment(val.value);
      if (val[SENTINEL] === "delete") return m.deleteField();
      if (val[SENTINEL] === "timestamp") return m.Timestamp.fromMillis(val.value);
    }
    if (Array.isArray(val)) return val.map((item) => resolveValue(item, m));
    if (Object.getPrototypeOf(val) !== Object.prototype) return val;
    const out = {};
    for (const k of Object.keys(val)) {
      out[k] = resolveValue(val[k], m);
    }
    return out;
  }

  function wrapDocSnap(snap) {
    return {
      id: snap.id,
      exists: typeof snap.exists === "function" ? snap.exists() : !!snap.exists,
      data: () => snap.data(),
      get: (f) => snap.get(f)
    };
  }

  function wrapQuerySnap(snap) {
    const docs = snap.docs.map(wrapDocSnap);
    return {
      empty: snap.empty,
      size: snap.size,
      docs,
      forEach: (cb) => docs.forEach(cb)
    };
  }

  function wrapDocRef(ref, m) {
    return {
      id: ref.id,
      _ref: ref,
      onSnapshot: (onNext, onErr) => m.onSnapshot(ref, (s) => onNext(wrapDocSnap(s)), onErr),
      get: async () => wrapDocSnap(await m.getDoc(ref)),
      set: (data, opts) => (opts ? m.setDoc(ref, resolveValue(data, m), opts) : m.setDoc(ref, resolveValue(data, m))),
      update: (data) => m.updateDoc(ref, resolveValue(data, m)),
      delete: () => m.deleteDoc(ref)
    };
  }

  function wrapQuery(q, m) {
    return {
      where: (field, op, value) => wrapQuery(m.query(q, m.where(field, op, value)), m),
      onSnapshot: (onNext, onErr) => m.onSnapshot(q, (s) => onNext(wrapQuerySnap(s)), onErr),
      get: async () => wrapQuerySnap(await m.getDocs(q))
    };
  }

  function wrapDb(fs, m) {
    return {
      _raw: fs,
      collection: (path) => {
        const colRef = m.collection(fs, path);
        return {
          doc: (id) => wrapDocRef(id ? m.doc(colRef, id) : m.doc(colRef), m),
          where: (field, op, value) => wrapQuery(m.query(colRef, m.where(field, op, value)), m),
          onSnapshot: (onNext, onErr) => m.onSnapshot(colRef, (s) => onNext(wrapQuerySnap(s)), onErr),
          get: async () => wrapQuerySnap(await m.getDocs(colRef)),
          add: async (data) => {
            const added = await m.addDoc(colRef, resolveValue(data, m));
            return { id: added.id, _ref: added };
          }
        };
      },
      batch: () => {
        const b = m.writeBatch(fs);
        return {
          set: (refWrap, data, opts) => {
            const target = refWrap && refWrap._ref ? refWrap._ref : refWrap;
            return opts ? b.set(target, resolveValue(data, m), opts) : b.set(target, resolveValue(data, m));
          },
          update: (refWrap, data) => {
            const target = refWrap && refWrap._ref ? refWrap._ref : refWrap;
            return b.update(target, resolveValue(data, m));
          },
          delete: (refWrap) => {
            const target = refWrap && refWrap._ref ? refWrap._ref : refWrap;
            return b.delete(target);
          },
          commit: () => b.commit()
        };
      },
      runTransaction: (updateFn) => m.runTransaction(fs, (tx) => {
        const txWrap = {
          get: async (refWrap) => {
            const target = refWrap && refWrap._ref ? refWrap._ref : refWrap;
            return wrapDocSnap(await tx.get(target));
          },
          set: (refWrap, data, opts) => {
            const target = refWrap && refWrap._ref ? refWrap._ref : refWrap;
            return opts ? tx.set(target, resolveValue(data, m), opts) : tx.set(target, resolveValue(data, m));
          },
          update: (refWrap, data) => {
            const target = refWrap && refWrap._ref ? refWrap._ref : refWrap;
            return tx.update(target, resolveValue(data, m));
          },
          delete: (refWrap) => {
            const target = refWrap && refWrap._ref ? refWrap._ref : refWrap;
            return tx.delete(target);
          }
        };
        return updateFn(txWrap);
      })
    };
  }

  let appPromise = null;
  let dbPromise = null;
  let storagePromise = null;
  let cachedDbFacade = null;
  let cachedStorageFacade = null;
  const readyCallbacks = [];

  async function ensureApp() {
    if (appPromise) return appPromise;
    appPromise = (async () => {
      const cfg = window.firebaseConfig;
      if (!cfg) throw new Error("Missing firebaseConfig");
      const appMod = await import(`${FB_BASE}firebase-app.js`);
      const apps = appMod.getApps();
      return apps.length ? apps[0] : appMod.initializeApp(cfg);
    })();
    return appPromise;
  }

  async function ensureDb() {
    if (cachedDbFacade) return cachedDbFacade;
    // Reuse compat DB if admin.html or compat scripts already initialized it.
    if (window.db && typeof window.db.collection === "function") {
      cachedDbFacade = window.db;
      return cachedDbFacade;
    }
    if (dbPromise) return dbPromise;
    dbPromise = (async () => {
      const [app, fsMod] = await Promise.all([
        ensureApp(),
        import(`${FB_BASE}firebase-firestore.js`)
      ]);
      const dbId = window.firebaseConfig && window.firebaseConfig.firestoreDatabaseId;
      const fs = dbId && dbId !== "(default)"
        ? fsMod.getFirestore(app, dbId)
        : fsMod.getFirestore(app);
      cachedDbFacade = wrapDb(fs, fsMod);
      window.db = cachedDbFacade;
      while (readyCallbacks.length > 0) {
        const cb = readyCallbacks.shift();
        try { cb(cachedDbFacade); } catch (e) { console.warn("Firestore ready listener notice:", e); }
      }
      return cachedDbFacade;
    })().catch((err) => {
      dbPromise = null;
      throw err;
    });
    return dbPromise;
  }

  async function ensureStorage() {
    if (cachedStorageFacade) return cachedStorageFacade;
    if (window.storage && typeof window.storage.ref === "function") {
      cachedStorageFacade = window.storage;
      return cachedStorageFacade;
    }
    if (storagePromise) return storagePromise;
    storagePromise = (async () => {
      const [app, stMod] = await Promise.all([
        ensureApp(),
        import(`${FB_BASE}firebase-storage.js`)
      ]);
      const storage = stMod.getStorage(app);
      cachedStorageFacade = {
        ref: (path) => {
          const r = stMod.ref(storage, path);
          return {
            put: (file, meta) => {
              const task = stMod.uploadBytesResumable(r, file, meta);
              return {
                snapshot: { ref: { getDownloadURL: () => stMod.getDownloadURL(task.snapshot.ref) } },
                on: (ev, onNext, onErr, onDone) => task.on(ev, onNext, onErr, onDone)
              };
            }
          };
        }
      };
      window.storage = cachedStorageFacade;
      return cachedStorageFacade;
    })().catch((err) => {
      storagePromise = null;
      throw err;
    });
    return storagePromise;
  }

  function onReady(cb) {
    if (typeof cb !== "function") return;
    if (cachedDbFacade) {
      cb(cachedDbFacade);
    } else if (window.db && typeof window.db.collection === "function") {
      cachedDbFacade = window.db;
      cb(cachedDbFacade);
    } else {
      readyCallbacks.push(cb);
    }
  }

  let scheduled = false;
  function triggerLoad() {
    if (scheduled) return;
    scheduled = true;
    ensureDb().catch((err) => console.warn("Lazy Firestore init notice:", err));
  }

  function scheduleTriggers() {
    if (typeof document === "undefined") return;
    const selectors = [
      "#editions", "#archive", "#results", "#competition", "#screening", "#submit",
      "#edition2027GalleryGrid", "#editionGalleryGrid", "#votingFilmsContainer", "#editionHeroSection"
    ];
    if (typeof IntersectionObserver === "function") {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            triggerLoad();
            break;
          }
        }
      }, { rootMargin: "320px 0px" });
      selectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) io.observe(el);
      });
    }

    const startAfterPaint = () => {
      const form = document.getElementById("submissionForm");
      if (form) form.addEventListener("focusin", triggerLoad, { once: true });
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(triggerLoad, { timeout: 1600 });
      } else {
        setTimeout(triggerLoad, 1200);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(startAfterPaint), { once: true });
    } else {
      requestAnimationFrame(startAfterPaint);
    }
  }

  scheduleTriggers();

  window.FestivalFirebasePublic = {
    ensureDb,
    ensureStorage,
    onReady,
    triggerLoad
  };
})();
