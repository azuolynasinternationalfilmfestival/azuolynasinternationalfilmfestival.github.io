/**
 * Ąžuolynas Film Festival - Real-Time Voting Engine
 * Supports Anonymous Auth, 1-vote-per-person per nomination, and dynamic result animation.
 */
(function(window) {
  let currentUser = null;
  let allFilms = [];
  let allVotes = [];
  let votingSettings = { votingOpen: true, showResults: "after_vote" };
  let localVotedNominations = {};

  try {
    const cached = localStorage.getItem("asiff_user_votes");
    if (cached) localVotedNominations = JSON.parse(cached);
  } catch (e) {}

  async function initVotingEngine(callbacks = {}) {
    const { onFilmsUpdate, onResultsUpdate, onSettingsUpdate, onError } = callbacks;

    // 1. Initialize Anonymous Authentication
    if (window.firebase && window.firebase.auth) {
      try {
        const auth = window.firebase.auth();
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            currentUser = user;
            listenToVotes(onResultsUpdate);
          } else {
            try {
              const cred = await auth.signInAnonymously();
              currentUser = cred.user;
              listenToVotes(onResultsUpdate);
            } catch (authErr) {
              console.warn("Anonymous auth notice:", authErr);
              if (onError) onError(authErr);
            }
          }
        });
      } catch (e) {
        console.warn("Auth initialization notice:", e);
      }
    }

    // 2. Real-time Submissions listener for films in voting
    listenToFilms(onFilmsUpdate, onError);

    // 3. Real-time Settings listener (open/closed state)
    listenToSettings(onSettingsUpdate);
  }

  function listenToFilms(callback, onError) {
    if (window.firebase && window.firebase.firestore) {
      try {
        const db = window.firebase.firestore();
        db.collection("submissions").onSnapshot((snapshot) => {
          const films = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.inVoting === true || (data.votesCount && data.votesCount > 0)) {
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
        const films = (data.submissions || []).filter(s => s.inVoting === true || s.votesCount > 0);
        allFilms = films;
        if (callback) callback(films);
      }
    } catch (e) {}
  }

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

    // First collect votes from votes collection
    allVotes.forEach((v) => {
      if (!v.nominationId || !v.filmId) return;
      if (!statsByNomination[v.nominationId]) {
        statsByNomination[v.nominationId] = { totalVotes: 0, films: {} };
      }
      statsByNomination[v.nominationId].totalVotes++;
      filmVoteCounts[v.filmId] = (filmVoteCounts[v.filmId] || 0) + 1;
    });

    // Also factor in recorded votesCount on films if greater
    allFilms.forEach((film) => {
      const nom = film.category || "Bendra nominacija";
      if (!statsByNomination[nom]) {
        statsByNomination[nom] = { totalVotes: 0, films: {} };
      }
      const recorded = film.votesCount || 0;
      const computed = filmVoteCounts[film.id] || 0;
      const count = Math.max(recorded, computed);
      statsByNomination[nom].films[film.id] = count;
    });

    // Recalculate totals and percentages
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

  async function castVote(nominationId, filmId) {
    if (!votingSettings.votingOpen) {
      throw new Error("Balsavimas šiuo metu uždarytas (Voting is currently closed).");
    }

    const userId = currentUser ? currentUser.uid : "anon_" + Math.random().toString(36).substring(2, 10);
    const voteDocId = `${nominationId}_${userId}`.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Local double vote guard
    if (localVotedNominations[nominationId]) {
      throw new Error("Jūs jau atidavėte savo balsą šioje nominacijoje! (You have already voted in this category).");
    }

    if (window.firebase && window.firebase.firestore) {
      const db = window.firebase.firestore();
      
      // Atomic vote record
      await db.collection("votes").doc(voteDocId).set({
        nominationId,
        filmId,
        userId,
        votedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      // Increment submission votes count
      try {
        await db.collection("submissions").doc(filmId).update({
          votesCount: window.firebase.firestore.FieldValue.increment(1)
        });
      } catch (upErr) {
        console.warn("Could not increment votesCount on film doc:", upErr);
      }
    } else {
      // Fallback via server API
      const res = await fetch("/api/admin/submissions/quick-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: filmId, nominationId })
      });
      if (!res.ok) throw new Error("Nepavyko įrašyti balso.");
    }

    localVotedNominations[nominationId] = filmId;
    try {
      localStorage.setItem("asiff_user_votes", JSON.stringify(localVotedNominations));
    } catch (e) {}

    return {
      success: true,
      nominationId,
      filmId
    };
  }

  function hasUserVotedIn(nominationId) {
    return !!localVotedNominations[nominationId];
  }

  function getUserVoteFor(nominationId) {
    return localVotedNominations[nominationId];
  }

  window.VotingEngine = {
    init: initVotingEngine,
    castVote,
    hasUserVotedIn,
    getUserVoteFor,
    computeStats: computeVotingStats,
    getSettings: () => votingSettings
  };
})(window);
