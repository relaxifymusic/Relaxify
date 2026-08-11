// ========================================
// RELAXIFY
// YouTube Search + Playlists + Player
// ========================================

const API_URL =
  "https://relaxify-api.djboy4696.workers.dev";


// ========================================
// ELEMENTS
// ========================================

const searchForm =
  document.getElementById("searchForm");

const searchInput =
  document.getElementById("searchInput");

const results =
  document.getElementById("results");

const resultsTitle =
  document.getElementById("resultsTitle");

const status =
  document.getElementById("status");

const playerContainer =
  document.getElementById("playerContainer");

const playerArtwork =
  document.getElementById("playerArtwork");

const playerTitle =
  document.getElementById("playerTitle");

const playerChannel =
  document.getElementById("playerChannel");

const playPause =
  document.getElementById("playPause");

const previousTrack =
  document.getElementById("previousTrack");

const nextTrack =
  document.getElementById("nextTrack");

const progressBar =
  document.getElementById("progressBar");

const currentTime =
  document.getElementById("currentTime");

const totalTime =
  document.getElementById("totalTime");

const volumeBar =
  document.getElementById("volumeBar");


// ========================================
// STATE
// ========================================

let youtube;

let youtubeReady = false;

let currentTracks = [];

let currentIndex = -1;

let currentQuery = "";

let progressTimer = null;


// ========================================
// PLAYLISTS
// ========================================

const PLAYLISTS = {

  relax: {
    title: "Relaxing music",
    query:
      "relaxing peaceful music"
  },

  drive: {
    title: "Car Drive",
    query:
      "best car drive music"
  },

  sleep: {
    title: "Sleep music",
    query:
      "deep sleep relaxing music"
  },

  lofi: {
    title: "Lo-fi",
    query:
      "lofi chill beats"
  }

};


// ========================================
// YOUTUBE API READY
// ========================================

window.onYouTubeIframeAPIReady =
  function () {

    youtubeReady = true;

    createYouTubePlayer();

  };


// ========================================
// CREATE PLAYER
// ========================================

function createYouTubePlayer() {

  const playerElement =
    document.getElementById(
      "youtubePlayer"
    );

  if (!playerElement) {
    return;
  }


  youtube =
    new YT.Player(
      "youtubePlayer",
      {

        width: "1",
        height: "1",

        videoId: "",

        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1
        },

        events: {

          onReady:
            function (event) {

              event.target.setVolume(70);

            },

          onStateChange:
            handlePlayerStateChange,

          onError:
            function (event) {

              console.error(
                "YouTube error:",
                event.data
              );

              status.textContent =
                "Playback error";

            }

        }

      }
    );

}


// ========================================
// PLAYER STATE
// ========================================

function handlePlayerStateChange(event) {

  if (!youtube) {
    return;
  }


  if (
    event.data ===
    YT.PlayerState.PLAYING
  ) {

    playPause.textContent =
      "❚❚";

    startProgress();

  }


  else if (
    event.data ===
    YT.PlayerState.PAUSED
  ) {

    playPause.textContent =
      "▶";

    stopProgress();

  }


  else if (
    event.data ===
    YT.PlayerState.ENDED
  ) {

    stopProgress();

    playNext();

  }

}


// ========================================
// SEARCH
// ========================================

searchForm.addEventListener(
  "submit",
  function (event) {

    event.preventDefault();

    const query =
      searchInput.value.trim();

    if (!query) {

      searchInput.focus();

      return;
    }

    searchYouTube(query);

  }
);


// ========================================
// QUICK SEARCH
// ========================================

document
  .querySelectorAll(
    ".quick-searches button"
  )
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const query =
            button.dataset.query;

          searchInput.value =
            query;

          searchYouTube(query);

        }
      );

    }
  );


// ========================================
// PLAYLIST BUTTONS
// ========================================

document
  .querySelectorAll(
    ".playlist-card"
  )
  .forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const playlistName =
            button.dataset.playlist;

          const playlist =
            PLAYLISTS[playlistName];

          if (!playlist) {
            return;
          }

          searchInput.value =
            playlist.query;

          searchYouTube(
            playlist.query,
            playlist.title
          );

        }
      );

    }
  );


// ========================================
// SEARCH YOUTUBE
// ========================================

async function searchYouTube(
  query,
  customTitle = ""
) {

  currentQuery =
    query;

  status.textContent =
    "Searching...";


  resultsTitle.textContent =
    customTitle ||
    `Results for "${query}"`;


  results.innerHTML = `

    <div class="empty-state">

      <div class="empty-icon">
        ◌
      </div>

      <h3>
        Finding something peaceful...
      </h3>

      <p>
        Please wait a moment.
      </p>

    </div>

  `;


  try {

    const url =
      `${API_URL}/search?q=${
        encodeURIComponent(query)
      }`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    const videos =
      Array.isArray(data.items)
        ? data.items
        : [];


    currentTracks =
      videos.filter(
        function (video) {

          return Boolean(
            video?.id?.videoId
          );

        }
      );


    currentIndex = -1;


    if (
      currentTracks.length === 0
    ) {

      showEmptyResults();

      return;
    }


    renderResults(
      currentTracks
    );


    status.textContent =
      `${currentTracks.length} results`;

  }

  catch (error) {

    console.error(error);

    status.textContent =
      "Search error";

    results.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          !
        </div>

        <h3>
          Something went wrong
        </h3>

        <p>
          Please check your connection
          and try again.
        </p>

      </div>

    `;

  }

}


// ========================================
// RENDER RESULTS
// ========================================

function renderResults(videos) {

  results.innerHTML = "";


  videos.forEach(
    function (video, index) {

      const videoId =
        video?.id?.videoId;


      const snippet =
        video?.snippet || {};


      if (!videoId) {
        return;
      }


      const title =
        escapeHTML(
          snippet.title ||
          "Untitled"
        );


      const channel =
        escapeHTML(
          snippet.channelTitle ||
          "YouTube"
        );


      const thumbnail =
        snippet?.thumbnails?.high?.url ||
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        "";


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "card";


      card.innerHTML = `

        <img
          class="thumbnail"
          src="${thumbnail}"
          alt=""
          loading="lazy"
        >

        <div class="card-content">

          <div class="video-title">
            ${title}
          </div>

          <div class="channel">
            ${channel}
          </div>

          <button
            class="play-button"
            type="button"
          >
            ▶ Play
          </button>

        </div>

      `;


      const playButton =
        card.querySelector(
          ".play-button"
        );


      playButton.addEventListener(
        "click",
        function () {

          playTrack(index);

        }
      );


      results.appendChild(
        card
      );

    }
  );

}


// ========================================
// PLAY TRACK
// ========================================

function playTrack(index) {

  if (
    !currentTracks[index]
  ) {
    return;
  }


  const video =
    currentTracks[index];


  const videoId =
    video?.id?.videoId;


  if (!videoId) {
    return;
  }


  currentIndex =
    index;


  const snippet =
    video.snippet || {};


  const title =
    snippet.title ||
    "Untitled";


  const channel =
    snippet.channelTitle ||
    "YouTube";


  const thumbnail =
    snippet?.thumbnails?.high?.url ||
    snippet?.thumbnails?.medium?.url ||
    snippet?.thumbnails?.default?.url ||
    "";


  updatePlayerUI(
    title,
    channel,
    thumbnail
  );


  playerContainer
    .classList
    .remove("hidden");


  playerContainer
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });


  if (!youtubeReady) {

    status.textContent =
      "Player loading...";

    return;
  }


  if (!youtube) {

    createYouTubePlayer();

    setTimeout(
      function () {

        playYouTubeVideo(
          videoId
        );

      },
      1000
    );

    return;
  }


  playYouTubeVideo(
    videoId
  );

}


// ========================================
// PLAY YOUTUBE VIDEO
// ========================================

function playYouTubeVideo(
  videoId
) {

  if (
    !youtube ||
    !youtube.loadVideoById
  ) {
    return;
  }


  youtube.loadVideoById(
    videoId
  );


  youtube.setVolume(
    Number(volumeBar.value)
  );


  playPause.textContent =
    "❚❚";


  status.textContent =
    "Playing";


  startProgress();

}


// ========================================
// UPDATE PLAYER UI
// ========================================

function updatePlayerUI(
  title,
  channel,
  thumbnail
) {

  playerTitle.textContent =
    title;


  playerChannel.textContent =
    channel;


  if (thumbnail) {

    playerArtwork.src =
      thumbnail;

  }


  progressBar.value =
    0;


  currentTime.textContent =
    "0:00";


  totalTime.textContent =
    "0:00";

}


// ========================================
// PLAY / PAUSE
// ========================================

playPause.addEventListener(
  "click",
  function () {

    if (!youtube) {
      return;
    }


    const state =
      youtube.getPlayerState();


    if (
      state ===
      YT.PlayerState.PLAYING
    ) {

      youtube.pauseVideo();

      playPause.textContent =
        "▶";

    }

    else {

      youtube.playVideo();

      playPause.textContent =
        "❚❚";

    }

  }
);


// ========================================
// NEXT
// ========================================

nextTrack.addEventListener(
  "click",
  function () {

    playNext();

  }
);


function playNext() {

  if (
    currentTracks.length === 0
  ) {
    return;
  }


  let nextIndex =
    currentIndex + 1;


  if (
    nextIndex >=
    currentTracks.length
  ) {

    nextIndex = 0;

  }


  playTrack(
    nextIndex
  );

}


// ========================================
// PREVIOUS
// ========================================

previousTrack.addEventListener(
  "click",
  function () {

    if (
      currentTracks.length === 0
    ) {
      return;
    }


    let previousIndex =
      currentIndex - 1;


    if (
      previousIndex < 0
    ) {

      previousIndex =
        currentTracks.length - 1;

    }


    playTrack(
      previousIndex
    );

  }
);


// ========================================
// PROGRESS
// ========================================

function startProgress() {

  stopProgress();


  progressTimer =
    setInterval(
      function () {

        if (!youtube) {
          return;
        }


        const duration =
          youtube.getDuration();


        const current =
          youtube.getCurrentTime();


        if (
          !duration ||
          duration <= 0
        ) {
          return;
        }


        progressBar.value =
          (current / duration) * 100;


        currentTime.textContent =
          formatTime(current);


        totalTime.textContent =
          formatTime(duration);

      },
      500
    );

}


function stopProgress() {

  if (progressTimer) {

    clearInterval(
      progressTimer
    );

    progressTimer =
      null;

  }

}


// ========================================
// SEEK
// ========================================

progressBar.addEventListener(
  "input",
  function () {

    if (!youtube) {
      return;
    }


    const duration =
      youtube.getDuration();


    if (
      !duration ||
      duration <= 0
    ) {
      return;
    }


    const newTime =
      duration *
      (Number(progressBar.value) / 100);


    youtube.seekTo(
      newTime,
      true
    );

  }
);


// ========================================
// VOLUME
// ========================================

volumeBar.addEventListener(
  "input",
  function () {

    if (!youtube) {
      return;
    }


    youtube.setVolume(
      Number(volumeBar.value)
    );

  }
);


// ========================================
// TIME FORMAT
// ========================================

function formatTime(seconds) {

  seconds =
    Math.floor(
      Number(seconds) || 0
    );


  const minutes =
    Math.floor(
      seconds / 60
    );


  const remaining =
    seconds % 60;


  return `${minutes}:${String(
    remaining
  ).padStart(2, "0")}`;

}


// ========================================
// EMPTY RESULTS
// ========================================

function showEmptyResults() {

  status.textContent =
    "No results";


  results.innerHTML = `

    <div class="empty-state">

      <div class="empty-icon">
        ☾
      </div>

      <h3>
        No results found
      </h3>

      <p>
        Try another search.
      </p>

    </div>

  `;

}


// ========================================
// SECURITY
// ========================================

function escapeHTML(text) {

  return String(text).replace(
    /[&<>"']/g,
    function (character) {

      const entities = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      };


      return entities[
        character
      ];

    }
  );

}


// ========================================
// INITIAL STATUS
// ========================================

status.textContent =
  "Ready when you are";
