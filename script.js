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


/* =========================================
   MUSIC QUEUE
========================================= */

let musicQueue = [];

let currentIndex = -1;

let isPlaying = false;


/* =========================================
   SPECIAL PLAYLIST SEARCHES
========================================= */

const PLAYLIST_QUERIES = {

  relax:
    "calm ambient instrumental music no vocals",

  drive:
    "night drive synthwave chill electronic music",

  sleep:
    "deep sleep ambient instrumental music no vocals",

  lofi:
    "lofi hip hop instrumental chill beats no vocals",

  meditation:
    "peaceful meditation instrumental ambient music"

};


/* =========================================
   SEARCH FORM
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
   MOOD / PLAYLIST BUTTONS
========================================= */

document
  .querySelectorAll(
    ".quick-moods button, .playlist-card"
  )
  .forEach(function(button) {

    button.addEventListener(
      "click",
      function() {

        let query =
          button.dataset.query || "";

        const text =
          button.textContent.toLowerCase();


        if (text.includes("relax")) {

          query =
            PLAYLIST_QUERIES.relax;

        }

        else if (
          text.includes("car")
        ) {

          query =
            PLAYLIST_QUERIES.drive;

        }

        else if (
          text.includes("sleep")
        ) {

          query =
            PLAYLIST_QUERIES.sleep;

        }

        else if (
          text.includes("lo-fi") ||
          text.includes("lofi")
        ) {

          query =
            PLAYLIST_QUERIES.lofi;

        }

        else if (
          text.includes("meditation")
        ) {

          query =
            PLAYLIST_QUERIES.meditation;

        }


        searchInput.value =
          query;


        searchYouTube(
          query
        );

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
    getPrettyTitle(query);


  results.innerHTML = `

    <div class="empty-state">

      <div>◌</div>

      <h3>
        Finding something peaceful...
      </h3>

      <p>
        Searching for the right music.
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
        "API Error: " +
        response.status
      );

    }


    const data =
      await response.json();


    let videos =
      Array.isArray(data.items)
        ? data.items
        : [];


    /*
      Remove invalid results.
    */

    videos =
      videos.filter(
        function(video) {

          return Boolean(
            video &&
            video.id &&
            video.id.videoId
          );

        }
      );


    /*
      Extra filtering for special playlists.
      This reduces irrelevant videos.
    */

    if (
      isSpecialPlaylist(query)
    ) {

      videos =
        filterMusicResults(
          videos,
          query
        );

    }


    if (
      videos.length === 0
    ) {

      showEmptyResults();

      return;
    }


    musicQueue =
      videos;


    currentIndex = -1;

    isPlaying = false;


    renderResults(
      videos
    );


    status.textContent =
      `${videos.length} songs found`;


    /*
      IMPORTANT:
      Do NOT automatically play
      the first result.
    */

  }

  catch (error) {

    console.error(
      "Relaxify search error:",
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
          Please check your connection
          and try again.
        </p>

      </div>

    `;

  }

}


/* =========================================
   SPECIAL PLAYLIST DETECTION
========================================= */

function isSpecialPlaylist(query) {

  const q =
    query.toLowerCase();


  return (
    q.includes("ambient") ||
    q.includes("synthwave") ||
    q.includes("night drive") ||
    q.includes("deep sleep") ||
    q.includes("lofi") ||
    q.includes("meditation")
  );

}


/* =========================================
   FILTER MUSIC RESULTS
========================================= */

function filterMusicResults(
  videos,
  query
) {

  const q =
    query.toLowerCase();


  const unwanted = [

    "bird",

    "birds",

    "chirping",

    "sparrow",

    "parrot",

    "rooster",

    "animal",

    "forest sounds",

    "nature sounds",

    "rain sounds",

    "asmr",

    "podcast",

    "news",

    "interview",

    "reaction",

    "shorts"

  ];


  /*
    Keep results that don't contain
    unwanted nature/content keywords.
  */

  const filtered =
    videos.filter(
      function(video) {

        const title =
          String(
            video?.snippet?.title || ""
          ).toLowerCase();


        return !unwanted.some(
          function(word) {

            return title.includes(word);

          }
        );

      }
    );


  /*
    If filtering removed everything,
    use original results rather than
    showing an empty page.
  */

  return filtered.length
    ? filtered
    : videos;

}


/* =========================================
   RENDER RESULTS
========================================= */

function renderResults(
  videos
) {

  results.innerHTML = "";


  videos.forEach(
    function(video, index) {

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


      const playButton =
        card.querySelector(
          ".play-button"
        );


      playButton.addEventListener(
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


  const video =
    musicQueue[index];


  const videoId =
    video?.id?.videoId;


  const snippet =
    video?.snippet || {};


  if (!videoId) {
    return;
  }


  currentIndex =
    index;


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


  /*
    Update player
  */

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

    albumArt.textContent = "";

  }
  else {

    albumArt.style.backgroundImage =
      "";

    albumArt.textContent =
      "♪";

  }


  /*
    YouTube player
  */

  youtubePlayer.src =
    `https://www.youtube.com/embed/${
      encodeURIComponent(videoId)
    }?autoplay=1&rel=0&playsinline=1`;


  youtubeContainer.style.display =
    "block";


  isPlaying = true;


  playButton.textContent =
    "❚❚";


  status.textContent =
    `Playing ${currentIndex + 1} of ${musicQueue.length}`;


  const playerSection =
    document.getElementById(
      "playerSection"
    );


  if (playerSection) {

    playerSection.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

}


/* =========================================
   PLAY / PAUSE
========================================= */

playButton.addEventListener(
  "click",
  function() {

    if (
      currentIndex === -1
    ) {

      if (musicQueue.length) {

        playSong(0);

      }

      return;
    }


    /*
      Reloading with autoplay is used
      for reliable mobile playback.
    */

    const video =
      musicQueue[currentIndex];


    const videoId =
      video?.id?.videoId;


    if (!videoId) {
      return;
    }


    if (isPlaying) {

      youtubePlayer.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "pauseVideo",
          args: []
        }),
        "*"
      );


      isPlaying = false;

      playButton.textContent =
        "▶";

    }
    else {

      youtubePlayer.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: []
        }),
        "*"
      );


      isPlaying = true;

      playButton.textContent =
        "❚❚";

    }

  }
);


/* =========================================
   NEXT
========================================= */

nextButton.addEventListener(
  "click",
  function() {

    playNext();

  }
);


function playNext() {

  if (!musicQueue.length) {
    return;
  }


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


/* =========================================
   PREVIOUS
========================================= */

previousButton.addEventListener(
  "click",
  function() {

    if (!musicQueue.length) {
      return;
    }


    let previousIndex =
      currentIndex - 1;


    if (
      previousIndex < 0
    ) {

      previousIndex =
        musicQueue.length - 1;

    }


    playSong(
      previousIndex
    );

  }
);


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
        No suitable music found
      </h3>

      <p>
        Try another mood or search.
      </p>

    </div>

  `;

}


/* =========================================
   PRETTY TITLES
========================================= */

function getPrettyTitle(
  query
) {

  const q =
    query.toLowerCase();


  if (
    q.includes("synthwave") ||
    q.includes("night drive")
  ) {

    return "🚗 Car Drive";

  }


  if (
    q.includes("deep sleep")
  ) {

    return "🌙 Sleep";

  }


  if (
    q.includes("lofi")
  ) {

    return "☕ Lo-fi";

  }


  if (
    q.includes("meditation")
  ) {

    return "🧘 Meditation";

  }


  if (
    q.includes("ambient")
  ) {

    return "🌿 Relaxing";

  }


  return `Results for "${query}"`;

}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(
  text
) {

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

function cleanText(
  text
) {

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
