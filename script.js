/* =========================================
   RELAXIFY MUSIC ENGINE
========================================= */

const API_URL =
  "https://relaxify-api.djboy4696.workers.dev";


/* =========================================
   ELEMENTS
========================================= */

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

const youtubeContainer =
  document.getElementById("youtubeContainer");

const youtubePlayer =
  document.getElementById("youtubePlayer");

const trackTitle =
  document.getElementById("trackTitle");

const trackArtist =
  document.getElementById("trackArtist");

const albumArt =
  document.getElementById("albumArt");

const playButton =
  document.getElementById("playButton");

const nextButton =
  document.getElementById("nextButton");

const previousButton =
  document.getElementById("previousButton");

const currentTime =
  document.getElementById("currentTime");

const duration =
  document.getElementById("duration");

const progressBar =
  document.getElementById("progressBar");


/* =========================================
   MUSIC QUEUE
========================================= */

let musicQueue = [];

let currentIndex = -1;

let isPlaying = false;


/* =========================================
   SEARCH
========================================= */

searchForm.addEventListener(
  "submit",
  function(event) {

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


/* =========================================
   MOOD BUTTONS
========================================= */

document
  .querySelectorAll(
    ".quick-moods button, .playlist-card"
  )
  .forEach(function(button) {

    button.addEventListener(
      "click",
      function() {

        const query =
          button.dataset.query;

        if (!query) return;

        searchInput.value = query;

        searchYouTube(query);
      }
    );

  });


/* =========================================
   SEARCH YOUTUBE
========================================= */

async function searchYouTube(query) {

  status.textContent =
    "Searching...";

  resultsTitle.textContent =
    `"${query}"`;

  results.innerHTML = `
    <div class="empty-state">

      <div>◌</div>

      <h3>
        Finding your music...
      </h3>

      <p>
        Please wait a moment.
      </p>

    </div>
  `;


  try {

    const url =
      `${API_URL}/search?q=${encodeURIComponent(query)}`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        "API Error: " + response.status
      );

    }


    const data =
      await response.json();


    const videos =
      Array.isArray(data.items)
        ? data.items
        : [];


    const validVideos =
      videos.filter(function(video) {

        return video &&
          video.id &&
          video.id.videoId;

      });


    if (validVideos.length === 0) {

      showEmptyResults();

      return;
    }


    musicQueue =
      validVideos;


    currentIndex = -1;


    renderResults(
      validVideos
    );


    status.textContent =
      `${validVideos.length} songs found`;


    /*
      Start the first song automatically
      when user clicked a playlist/mood.
    */

    playSong(0);

  }

  catch (error) {

    console.error(
      "Relaxify error:",
      error
    );


    status.textContent =
      "Search failed";


    results.innerHTML = `

      <div class="empty-state">

        <div>!</div>

        <h3>
          Unable to search
        </h3>

        <p>
          Please try again in a moment.
        </p>

      </div>

    `;
  }

}


/* =========================================
   RENDER RESULTS
========================================= */

function renderResults(videos) {

  results.innerHTML = "";


  videos.forEach(
    function(video, index) {

      const videoId =
        video?.id?.videoId;


      const snippet =
        video?.snippet || {};


      if (!videoId) return;


      const title =
        escapeHTML(
          snippet.title ||
          "Unknown song"
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


      const play =
        card.querySelector(
          ".play-button"
        );


      play.addEventListener(
        "click",
        function() {

          playSong(index);

        }
      );


      results.appendChild(
        card
      );

    }
  );

}


/* =========================================
   PLAY SONG
========================================= */

function playSong(index) {

  if (
    !musicQueue.length ||
    index < 0 ||
    index >= musicQueue.length
  ) {

    return;
  }


  currentIndex =
    index;


  const video =
    musicQueue[index];


  const videoId =
    video?.id?.videoId;


  const snippet =
    video?.snippet || {};


  if (!videoId) return;


  const title =
    snippet.title ||
    "Relaxify";


  const channel =
    snippet.channelTitle ||
    "YouTube";


  const thumbnail =
    snippet?.thumbnails?.high?.url ||
    snippet?.thumbnails?.medium?.url ||
    snippet?.thumbnails?.default?.url ||
    "";


  /* Update player */

  trackTitle.textContent =
    cleanText(title);


  trackArtist.textContent =
    cleanText(channel);


  if (thumbnail) {

    albumArt.style.backgroundImage =
      `url("${thumbnail}")`;

    albumArt.style.backgroundSize =
      "cover";

    albumArt.style.backgroundPosition =
      "center";

    albumArt.textContent =
      "";

  }
  else {

    albumArt.style.backgroundImage =
      "";

    albumArt.textContent =
      "♪";

  }


  /* YouTube */

  youtubePlayer.src =
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&enablejsapi=1&playsinline=1`;


  youtubeContainer.style.display =
    "block";


  isPlaying = true;


  playButton.textContent =
    "❚❚";


  status.textContent =
    `Playing ${currentIndex + 1} of ${musicQueue.length}`;


  /* Scroll player into view */

  document
    .getElementById("playerSection")
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

}


/* =========================================
   PLAY / PAUSE
========================================= */

playButton.addEventListener(
  "click",
  function() {

    if (currentIndex === -1) {

      if (musicQueue.length) {

        playSong(0);

      }

      return;
    }


    /*
      YouTube iframe API command.
      This works after the iframe has loaded.
    */

    const command =
      isPlaying
        ? "pauseVideo"
        : "playVideo";


    youtubePlayer.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: command,
        args: []
      }),
      "*"
    );


    isPlaying =
      !isPlaying;


    playButton.textContent =
      isPlaying
        ? "❚❚"
        : "▶";

  }
);


/* =========================================
   NEXT
========================================= */

nextButton.addEventListener(
  "click",
  function() {

    if (!musicQueue.length) return;


    let nextIndex =
      currentIndex + 1;


    if (
      nextIndex >=
      musicQueue.length
    ) {

      nextIndex = 0;

    }


    playSong(
      nextIndex
    );

  }
);


/* =========================================
   PREVIOUS
========================================= */

previousButton.addEventListener(
  "click",
  function() {

    if (!musicQueue.length) return;


    let previousIndex =
      currentIndex - 1;


    if (previousIndex < 0) {

      previousIndex =
        musicQueue.length - 1;

    }


    playSong(
      previousIndex
    );

  }
);


/* =========================================
   YOUTUBE MESSAGE LISTENER
   Detect video ending
========================================= */

window.addEventListener(
  "message",
  function(event) {

    if (!event.data) return;


    let data;


    try {

      data =
        typeof event.data === "string"
          ? JSON.parse(event.data)
          : event.data;

    }

    catch {

      return;

    }


    /*
      When YouTube sends state = 0,
      video has ended.
    */

    if (
      data.event === "onStateChange" &&
      data.info === 0
    ) {

      playNextAutomatically();

    }

  }
);


/* =========================================
   AUTO NEXT
========================================= */

function playNextAutomatically() {

  if (!musicQueue.length) return;


  let nextIndex =
    currentIndex + 1;


  /*
    Reached end of playlist?
    Start from first song again.
  */

  if (
    nextIndex >=
    musicQueue.length
  ) {

    nextIndex = 0;

  }


  playSong(
    nextIndex
  );

}


/* =========================================
   EMPTY RESULTS
========================================= */

function showEmptyResults() {

  status.textContent =
    "No results";


  results.innerHTML = `

    <div class="empty-state">

      <div>☾</div>

      <h3>
        No music found
      </h3>

      <p>
        Try searching for another song.
      </p>

    </div>

  `;

}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(text) {

  return String(text).replace(
    /[&<>"']/g,
    function(character) {

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


/* =========================================
   CLEAN TEXT
========================================= */

function cleanText(text) {

  const temp =
    document.createElement(
      "textarea"
    );


  temp.innerHTML =
    String(text);


  return temp.value;

}


/* =========================================
   INITIAL STATE
========================================= */

status.textContent =
  "Ready when you are";

trackTitle.textContent =
  "Relaxify";

trackArtist.textContent =
  "Choose something to listen to";
