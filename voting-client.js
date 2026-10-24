/**
 * Ąžuolynas Film Festival - Real-Time Voting Engine
 * 
 * Features:
 * 1. Strict Anonymous / Firebase Auth: Enforces real Firebase Auth user ID.
 * 2. Atomic Batch Commits: Commits vote document and film counter increment in ONE Firestore batch.
 * 3. Authoritative Voting State: Subscribes to user's vote documents from Firestore (cross-tab / reload safe).
 * 4. Dual-language film fallback: Intelligently resolves filmTitle_en/filmTitle & synopsis_en/synopsis.
 * 5. Real-time updates: Subscribes to live submissions, votes, and festival settings.
 */
(function(window) {
  let currentUser = null;
  let allFilms = [];
  let allVotes = [];
  let userVotesByNomination = {}; // nominationId -> filmId
  let votingSettings = { votingOpen: true, showResults: "after_vote" };
  let isVotingInProgress = false;

  // Restore local cache for immediate paint
  try {
    const cached = localStorage.getItem("asiff_user_votes");
    if (cached) userVotesByNomination = JSON.parse(cached);
  } catch (e) {}

  async function initVotingEngine(callbacks = {}) {
    const { onFilmsUpdate, onResultsUpdate, onSettingsUpdate, onAuthReady, onError } = callbacks;

    // 1. Initialize Firebase Auth (Anonymous or Signed-in)
    if (window.firebase && window.firebase.auth) {
      try {
        const auth = window.firebase.auth();

        auth.onAuthStateChanged(async (user) => {
          if (user) {
            currentUser = user;
            if (onAuthReady) onAuthReady(user);
            listenToUserVotes(user.uid, onResultsUpdate);
            listenToVotes(onResultsUpdate);
          } else {
            try {
              const cred = await auth.signInAnonymously();
              currentUser = cred.user;
              if (onAuthReady) onAuthReady(currentUser);
              listenToUserVotes(currentUser.uid, onResultsUpdate);
              listenToVotes(onResultsUpdate);
            } catch (authErr) {
              console.warn("Anonymous auth initialization:", authErr.message);
              if (onError) onError(authErr);
            }
          }
        });
      } catch (e) {
        console.warn("Auth initialization notice:", e);
      }
    }

    // 2. Real-time Submissions listener (loads films in voting and auto-updates when films are added)
    listenToFilms(onFilmsUpdate, onError);

    // 3. Real-time Settings listener (open/closed switch)
    listenToSettings(onSettingsUpdate);
  }

  // Listen to the current authenticated user's votes from Firestore
  function listenToUserVotes(uid, resultsCallback) {
    if (!window.firebase || !window.firebase.firestore || !uid) return;
    try {
      const db = window.firebase.firestore();
      db.collection("votes").where("userId", "==", uid).onSnapshot((snapshot) => {
        const map = { ...userVotesByNomination };
        snapshot.forEach((doc) => {
          const d = doc.data();
          if (d.nominationId && d.filmId) {
            map[d.nominationId] = d.filmId;
          }
        });
        userVotesByNomination = map;
        try {
          localStorage.setItem("asiff_user_votes", JSON.stringify(map));
        } catch (e) {}

        if (resultsCallback) resultsCallback(computeVotingStats());
      }, (err) => {
        console.warn("User votes listener notice:", err);
      });
    } catch (e) {}
  }

  // Listen to all films participating in voting
  function listenToFilms(callback, onError) {
    if (window.firebase && window.firebase.firestore) {
      try {
        const db = window.firebase.firestore();
        db.collection("submissions").onSnapshot((snapshot) => {
          const films = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Include films marked for voting or with active votes
            if (data.inVoting === true || (data.votesCount && data.votesCount > 0) || data.status === "accepted" || data.status === "in_competition") {
              films.push({ id: doc.id, ...data });
            }
          });
          allFilms = films;
          if (callback) callback(films);
        }, (err) => {
          console.warn("Firestore submissions snapshot:", err);
          fallbackFilmsFetch(callback);
        });
        return;
      } catch (fsErr) {
        console.warn("Firestore error:", fsErr);
      }
    }
    fallbackFilmsFetch(callback);
  }

  async function fallbackFilmsFetch(callback) {
    try {
      const res = await fetch("/api/admin/submissions");
      if (res.ok) {
        const data = await res.json();
        const films = (data.submissions || []).filter(s => s.inVoting === true || s.votesCount > 0 || s.status === "accepted");
        allFilms = films;
        if (callback) callback(films);
      }
    } catch (e) {}
  }

  // Listen to all public vote tallies in real-time
  function listenToVotes(callback) {
    if (window.firebase && window.firebase.firestore) {
      try {
        const db = window.firebase.firestore();
        db.collection("votes").onSnapshot((snapshot) => {
          const votes = [];
          snapshot.forEach((doc) => {
            votes.push({ id: doc.id, ...doc.data() });
          });
          allVotes = votes;
          if (callback) callback(computeVotingStats());
        }, (err) => {
          console.warn("Votes listener notice:", err);
        });
      } catch (e) {}
    }
  }

  // Listen to festival settings (votingOpen switch)
  function listenToSettings(callback) {
    if (window.firebase && window.firebase.firestore) {
      try {
        const db = window.firebase.firestore();
        db.collection("settings").doc("global").onSnapshot((doc) => {
          if (doc.exists) {
            const d = doc.data();
            votingSettings.votingOpen = d.votingOpen !== false;
            votingSettings.showResults = d.showPublicResults || "after_vote";
            if (callback) callback(votingSettings);
          }
        }, () => {});
      } catch (e) {}
    }
  }

  function computeVotingStats() {
    const statsByNomination = {};
    const filmVoteCounts = {};

    // 1. Tally confirmed votes
    allVotes.forEach((v) => {
      if (!v.nominationId || !v.filmId) return;
      if (!statsByNomination[v.nominationId]) {
        statsByNomination[v.nominationId] = { totalVotes: 0, films: {} };
      }
      statsByNomination[v.nominationId].totalVotes++;
      filmVoteCounts[v.filmId] = (filmVoteCounts[v.filmId] || 0) + 1;
    });

    // 2. Factor in submission votesCount field
    allFilms.forEach((film) => {
      const nom = film.category || "General";
      if (!statsByNomination[nom]) {
        statsByNomination[nom] = { totalVotes: 0, films: {} };
      }
      const recorded = film.votesCount || 0;
      const computed = filmVoteCounts[film.id] || 0;
      const count = Math.max(recorded, computed);
      statsByNomination[nom].films[film.id] = count;
    });

    // 3. Compute totals
    Object.keys(statsByNomination).forEach((nom) => {
      const nomData = statsByNomination[nom];
      let sum = 0;
      Object.values(nomData.films).forEach(c => sum += c);
      nomData.totalVotes = sum;
    });

    return {
      statsByNomination,
      filmVoteCounts
    };
  }

  /**
   * Cast a vote using an atomic Firestore batch/transaction
   * Writes /votes/{nominationId}_{uid} and increments /submissions/{filmId}.votesCount by +1
   */
  async function castVote(nominationId, filmId) {
    if (!votingSettings.votingOpen) {
      throw new Error("Voting is currently closed / Balsavimas šiuo metu uždarytas.");
    }

    if (isVotingInProgress) {
      throw new Error("Vote registration in progress. Please wait / Balsas registruojamas, palaukite.");
    }

    if (!currentUser || !currentUser.uid) {
      throw new Error("Authenticating voter... Please try again in a second / Autorizuojamas balsuotojas... Bandykite po akimirkos.");
    }

    const cleanNom = String(nominationId).trim();
    if (userVotesByNomination[cleanNom]) {
      throw new Error("You have already voted in this category! / Jūs jau atidavėte balsą šioje nominacijoje.");
    }

    const voteDocId = `${cleanNom}_${currentUser.uid}`.replace(/[^a-zA-Z0-9_-]/g, "_");

    isVotingInProgress = true;
    try {
      if (window.firebase && window.firebase.firestore) {
        const db = window.firebase.firestore();
        const batch = db.batch();

        // 1. Vote record
        const voteRef = db.collection("votes").doc(voteDocId);
        batch.set(voteRef, {
          nominationId: cleanNom,
          filmId: filmId,
          userId: currentUser.uid,
          votedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. Atomic counter increment by exactly +1
        const filmRef = db.collection("submissions").doc(filmId);
        batch.update(filmRef, {
          votesCount: window.firebase.firestore.FieldValue.increment(1)
        });

        await batch.commit();
      } else {
        // Fallback via server route
        const res = await fetch("/api/admin/submissions/quick-vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: filmId, nominationId: cleanNom, userId: currentUser.uid })
        });
        if (!res.ok) throw new Error("Could not record vote.");
      }

      // Update state
      userVotesByNomination[cleanNom] = filmId;
      try {
        localStorage.setItem("asiff_user_votes", JSON.stringify(userVotesByNomination));
      } catch (e) {}

      return {
        success: true,
        nominationId: cleanNom,
        filmId
      };
    } finally {
      isVotingInProgress = false;
    }
  }

  function hasUserVotedIn(nominationId) {
    return !!userVotesByNomination[String(nominationId).trim()];
  }

  function getUserVoteFor(nominationId) {
    return userVotesByNomination[String(nominationId).trim()];
  }

  // Bilingual field fallback resolver
  function resolveFilmFields(film, lang = "en") {
    const isEn = lang === "en";
    return {
      title: isEn
        ? (film.filmTitle_en || film.filmTitle || film.title || "Untitled Film")
        : (film.filmTitle || film.filmTitle_en || film.title || "Filmas be pavadinimo"),
      synopsis: isEn
        ? (film.synopsis_en || film.synopsis || film.description || "Official Festival Selection.")
        : (film.synopsis || film.synopsis_en || film.description || "Festivalio konkursinės programos dalyvis."),
      director: film.director || film.directorName || film.name || (isEn ? "Independent Filmmaker" : "Nepriklausomas kūrėjas"),
      category: film.category || (isEn ? "General Category" : "Bendra nominacija")
    };
  }

  window.VotingEngine = {
    init: initVotingEngine,
    castVote,
    hasUserVotedIn,
    getUserVoteFor,
    computeStats: computeVotingStats,
    getSettings: () => votingSettings,
    resolveFilmFields,
    getCurrentUser: () => currentUser
  };
})(window);
