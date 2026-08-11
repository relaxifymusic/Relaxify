/* =========================================
   RELAXIFY + SPOTIFY
========================================= */

const CLIENT_ID =
  "1fec839a7e514123bb4b036ce63e42da";

const REDIRECT_URI =
  "https://relaxifymusic.github.io/Relaxify/";


/* =========================================
   SPOTIFY SCOPES
========================================= */

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state"
].join(" ");


/* =========================================
   ELEMENTS
========================================= */

const spotifyButton =
  document.getElementById("spotifyButton");

const searchButton =
  document.getElementById("searchButton");

const searchPanel =
  document.getElementById("searchPanel");

const searchInput =
  document.getElementById("searchInput");

const searchForm =
  document.getElementById("searchPanel");

const songTitle =
  document.getElementById("songTitle");

const artistName =
  document.getElementById("artistName");

const cover =
  document.getElementById("cover");

const playButton =
  document.getElementById("playButton");

const previousButton =
  document.getElementById("previousButton");

const nextButton =
  document.getElementById("nextButton");

const progress =
  document.getElementById("progress");

const currentTime =
  document.getElementById("currentTime");

const duration =
  document.getElementById("duration");

const status =
  document.getElementById("status");


/* =========================================
   STATE
========================================= */

let accessToken = null;

let refreshToken = null;

let tokenExpiresAt = 0;

let spotifyPlayer = null;

let spotifyDeviceId = null;

let currentTrack = null;

let isPlaying = false;

let progressTimer = null;


/* =========================================
   PKCE HELPERS
========================================= */

function randomString(length = 64) {

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  let result = "";

  const values =
    crypto.getRandomValues(
      new Uint8Array(length)
    );


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    result +=
      characters[
        values[i] %
        characters.length
      ];

  }


  return result;

}


async function sha256(plain) {

  const encoder =
    new TextEncoder();

  const data =
    encoder.encode(plain);

  return crypto.subtle.digest(
    "SHA-256",
    data
  );

}


function base64UrlEncode(input) {

  return btoa(
    String.fromCharCode(
      ...new Uint8Array(input)
    )
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

}


/* =========================================
   SPOTIFY LOGIN
========================================= */

async function loginSpotify() {

  const verifier =
    randomString(64);


  const challenge =
    base64UrlEncode(
      await sha256(verifier)
    );


  const state =
    randomString(32);


  sessionStorage.setItem(
    "spotify_verifier",
    verifier
  );


  sessionStorage.setItem(
    "spotify_state",
    state
  );


  const params =
    new URLSearchParams({

      response_type: "code",

      client_id: CLIENT_ID,

      scope: SCOPES,

      redirect_uri: REDIRECT_URI,

      state: state,

      code_challenge_method:
        "S256",

      code_challenge:
        challenge

    });


  window.location.href =
    "https://accounts.spotify.com/authorize?" +
    params.toString();

}


/* =========================================
   HANDLE CALLBACK
========================================= */

async function handleCallback() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const code =
    params.get("code");


  const returnedState =
    params.get("state");


  const error =
    params.get("error");


  if (error) {

    status.textContent =
      "Spotify login cancelled.";

    window.history.replaceState(
      {},
      document.title,
      REDIRECT_URI
    );

    return;

  }


  if (!code) {
    return;
  }


  const savedState =
    sessionStorage.getItem(
      "spotify_state"
    );


  if (
    !savedState ||
    savedState !== returnedState
  ) {

    status.textContent =
      "Spotify security check failed.";

    return;

  }


  const verifier =
    sessionStorage.getItem(
      "spotify_verifier"
    );


  try {

    const response =
      await fetch(
        "https://accounts.spotify.com/api/token",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/x-www-form-urlencoded"

          },

          body:
            new URLSearchParams({

              grant_type:
                "authorization_code",

              code:
                code,

              redirect_uri:
                REDIRECT_URI,

              client_id:
                CLIENT_ID,

              code_verifier:
                verifier

            })

        }
      );


    if (!response.ok) {

      throw new Error(
        "Spotify token request failed"
      );

    }


    const data =
      await response.json();


    accessToken =
      data.access_token;


    refreshToken =
      data.refresh_token;


    tokenExpiresAt =
      Date.now() +
      (
        Number(
          data.expires_in
        ) * 1000
      );


    sessionStorage.setItem(
      "spotify_access_token",
      accessToken
    );


    sessionStorage.setItem(
      "spotify_refresh_token",
      refreshToken || ""
    );


    sessionStorage.setItem(
      "spotify_expires_at",
      String(
        tokenExpiresAt
      )
    );


    sessionStorage.removeItem(
      "spotify_verifier"
    );


    sessionStorage.removeItem(
      "spotify_state"
    );


    window.history.replaceState(
      {},
      document.title,
      REDIRECT_URI
    );


    status.textContent =
      "Spotify connected";


    spotifyButton.classList.add(
      "connected"
    );


    await startSpotifyPlayer();

  }

  catch (error) {

    console.error(error);

    status.textContent =
      "Spotify connection failed.";

  }

}


/* =========================================
   LOAD SAVED TOKEN
========================================= */

function loadSavedToken() {

  accessToken =
    sessionStorage.getItem(
      "spotify_access_token"
    );


  refreshToken =
    sessionStorage.getItem(
      "spotify_refresh_token"
    );


  tokenExpiresAt =
    Number(
      sessionStorage.getItem(
        "spotify_expires_at"
      ) || 0
    );


  if (
    accessToken
  ) {

    spotifyButton.classList.add(
      "connected"
    );

    status.textContent =
      "Spotify connected";

  }

}


/* =========================================
   REFRESH TOKEN
========================================= */

async function refreshAccessToken() {

  if (!refreshToken) {

    await loginSpotify();

    return null;

  }


  const response =
    await fetch(
      "https://accounts.spotify.com/api/token",
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded"

        },

        body:
          new URLSearchParams({

            grant_type:
              "refresh_token",

            refresh_token:
              refreshToken,

            client_id:
              CLIENT_ID

          })

      }
    );


  if (!response.ok) {

    throw new Error(
      "Unable to refresh Spotify token"
    );

  }


  const data =
    await response.json();


  accessToken =
    data.access_token;


  if (
    data.refresh_token
  ) {

    refreshToken =
      data.refresh_token;

  }


  tokenExpiresAt =
    Date.now() +
    (
      Number(
        data.expires_in
      ) * 1000
    );


  sessionStorage.setItem(
    "spotify_access_token",
    accessToken
  );


  sessionStorage.setItem(
    "spotify_refresh_token",
    refreshToken
  );


  sessionStorage.setItem(
    "spotify_expires_at",
    String(
      tokenExpiresAt
    )
  );


  return accessToken;

}


/* =========================================
   VALID TOKEN
========================================= */

async function getToken() {

  if (
    !accessToken ||
    Date.now() >
      tokenExpiresAt - 60000
  ) {

    return refreshAccessToken();

  }


  return accessToken;

}


/* =========================================
   SPOTIFY WEB PLAYER
========================================= */

window.onSpotifyWebPlaybackSDKReady =
  async function () {

    if (!accessToken) {
      return;
    }


    await startSpotifyPlayer();

  };


async function startSpotifyPlayer() {

  if (!accessToken) {
    return;
  }


  if (spotifyPlayer) {
    return;
  }


  spotifyPlayer =
    new Spotify.Player({

      name:
        "Relaxify Web Player",

      volume:
        0.8,

      getOAuthToken:
        async function (callback) {

          try {

            const token =
              await getToken();

            callback(token);

          }

          catch (error) {

            console.error(
              error
            );

          }

        }

    });


  spotifyPlayer.addListener(
    "ready",
    function (data) {

      spotifyDeviceId =
        data.device_id;


      status.textContent =
        "Spotify ready";

    }
  );


  spotifyPlayer.addListener(
    "not_ready",
    function () {

      spotifyDeviceId =
        null;

      status.textContent =
        "Spotify player offline";

    }
  );


  spotifyPlayer.addListener(
    "player_state_changed",
    function (state) {

      if (!state) {
        return;
      }


      const track =
        state.track_window
          ?.current_track;


      if (track) {

        updateTrackUI(
          track
        );

      }


      isPlaying =
        !state.paused;


      playButton.textContent =
        isPlaying
          ? "❚❚"
          : "▶";


      progress.value =
        state.duration
          ? (
              state.position /
              state.duration
            ) * 100
          : 0;


      currentTime.textContent =
        formatTime(
          state.position / 1000
        );


      duration.textContent =
        formatTime(
          state.duration / 1000
        );

    }
  );


  spotifyPlayer.addListener(
    "initialization_error",
    function (data) {

      console.error(data);

      status.textContent =
        "Spotify player initialization error.";

    }
  );


  spotifyPlayer.addListener(
    "authentication_error",
    function (data) {

      console.error(data);

      status.textContent =
        "Spotify authentication error.";

    }
  );


  spotifyPlayer.addListener(
    "account_error",
    function (data) {

      console.error(data);

      status.textContent =
        "Spotify Premium is required.";

    }
  );


  spotifyPlayer.addListener(
    "playback_error",
    function (data) {

      console.error(data);

      status.textContent =
        "Spotify playback error.";

    }
  );


  spotifyPlayer.addListener(
    "autoplay_failed",
    function () {

      status.textContent =
        "Tap Play to start Spotify.";

    }
  );


  await spotifyPlayer.connect();

}


/* =========================================
   CONNECT BUTTON
========================================= */

spotifyButton.addEventListener(
  "click",
  async function () {

    if (!accessToken) {

      await loginSpotify();

      return;

    }


    status.textContent =
      "Spotify already connected.";

  }
);


/* =========================================
   SEARCH BUTTON
========================================= */

searchButton.addEventListener(
  "click",
  function () {

    searchPanel.classList.toggle(
      "open"
    );


    if (
      searchPanel.classList.contains(
        "open"
      )
    ) {

      setTimeout(
        function () {

          searchInput.focus();

        },
        100
      );

    }

  }
);


/* =========================================
   SEARCH
========================================= */

searchForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    const query =
      searchInput.value.trim();


    if (!query) {
      return;
    }


    if (!accessToken) {

      status.textContent =
        "Connect Spotify first.";

      await loginSpotify();

      return;

    }


    searchPanel.classList.remove(
      "open"
    );


    await searchSpotify(
      query
    );

  }
);


/* =========================================
   SEARCH SPOTIFY
========================================= */

async function searchSpotify(
  query
) {

  try {

    const token =
      await getToken();


    const params =
      new URLSearchParams({

        q:
          query,

        type:
          "track",

        limit:
          "1",

        market:
          "IN"

      });


    const response =
      await fetch(
        "https://api.spotify.com/v1/search?" +
        params.toString(),
        {

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }
      );


    if (!response.ok) {

      throw new Error(
        "Spotify search failed"
      );

    }


    const data =
      await response.json();


    const track =
      data?.tracks?.items?.[0];


    if (!track) {

      status.textContent =
        "Song not found.";

      return;

    }


    await playTrack(
      track.uri
    );

  }

  catch (error) {

    console.error(error);

    status.textContent =
      "Unable to search Spotify.";

  }

}


/* =========================================
   PLAY TRACK
========================================= */

async function playTrack(
  uri
) {

  try {

    const token =
      await getToken();


    if (!spotifyDeviceId) {

      status.textContent =
        "Spotify player is starting...";

      await startSpotifyPlayer();

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      );

    }


    if (!spotifyDeviceId) {

      status.textContent =
        "Spotify player is not ready.";

      return;

    }


    /*
      Transfer playback to Relaxify
    */

    const transferResponse =
      await fetch(
        "https://api.spotify.com/v1/me/player",
        {

          method:
            "PUT",

          headers: {

            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              device_ids:
                [spotifyDeviceId],

              play:
                true

            })

        }
      );


    if (
      !transferResponse.ok &&
      transferResponse.status !== 204
    ) {

      console.warn(
        "Transfer response:",
        transferResponse.status
      );

    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          500
        )
    );


    /*
      Start selected track
    */

    const playResponse =
      await fetch(
        "https://api.spotify.com/v1/me/player/play",
        {

          method:
            "PUT",

          headers: {

            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              device_id:
                spotifyDeviceId,

              uris:
                [uri]

            })

        }
      );


    if (!playResponse.ok) {

      throw new Error(
        "Spotify could not start playback"
      );

    }


    status.textContent =
      "Playing on Relaxify";

  }

  catch (error) {

    console.error(error);

    status.textContent =
      "Tap Play or open Spotify once.";

  }

}


/* =========================================
   PLAY / PAUSE
========================================= */

playButton.addEventListener(
  "click",
  async function () {

    if (!spotifyPlayer) {

      if (!accessToken) {

        await loginSpotify();

        return;

      }


      await startSpotifyPlayer();

      return;

    }


    try {

      await spotifyPlayer.togglePlay();

    }

    catch (error) {

      console.error(error);

    }

  }
);


/* =========================================
   NEXT
========================================= */

nextButton.addEventListener(
  "click",
  async function () {

    if (!spotifyPlayer) {
      return;
    }


    await spotifyPlayer.nextTrack();

  }
);


/* =========================================
   PREVIOUS
========================================= */

previousButton.addEventListener(
  "click",
  async function () {

    if (!spotifyPlayer) {
      return;
    }


    await spotifyPlayer.previousTrack();

  }
);


/* =========================================
   SEEK
========================================= */

progress.addEventListener(
  "input",
  async function () {

    if (!spotifyPlayer) {
      return;
    }


    const state =
      await spotifyPlayer.getCurrentState();


    if (!state) {
      return;
    }


    const position =
      state.duration *
      Number(progress.value) /
      100;


    await spotifyPlayer.seek(
      position
    );

  }
);


/* =========================================
   UPDATE SONG UI
========================================= */

function updateTrackUI(
  track
) {

  currentTrack =
    track;


  songTitle.textContent =
    track.name;


  artistName.textContent =
    track.artists
      .map(
        artist =>
          artist.name
      )
      .join(", ");


  const image =
    track.album
      ?.images
      ?.[0]
      ?.url;


  if (image) {

    cover.style.backgroundImage =
      `url("${image}")`;


    const note =
      cover.querySelector(
        ".cover-note"
      );


    if (note) {

      note.style.display =
        "none";

    }

  }

}


/* =========================================
   FORMAT TIME
========================================= */

function formatTime(
  seconds
) {

  if (
    !Number.isFinite(seconds)
  ) {

    return "0:00";

  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const secs =
    Math.floor(
      seconds % 60
    );


  return (
    minutes +
    ":" +
    String(
      secs
    ).padStart(
      2,
      "0"
    )
  );

}


/* =========================================
   START
========================================= */

(async function () {

  loadSavedToken();

  await handleCallback();

})();
