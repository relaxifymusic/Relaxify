/* =========================================
   RELAXIFY
   INDIAN MUSIC PLAYER
========================================= */


/* =========================================
   API
========================================= */

const API_URL =
  "https://relaxify-api.djboy4696.workers.dev";


/* =========================================
   ELEMENTS
========================================= */

const searchButton =
  document.getElementById("searchButton");

const searchPanel =
  document.getElementById("searchPanel");

const searchInput =
  document.getElementById("searchInput");

const searchSuggestions =
  document.getElementById("searchSuggestions");

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

const youtubePlayer =
  document.getElementById("youtubePlayer");


/* =========================================
   PLAYER STATE
========================================= */

let player = null;

let playerReady = false;

let isPlaying = false;

let progressTimer = null;

let queue = [];

let currentIndex = -1;

let searchTimer = null;


/* =========================================
   INDIAN MUSIC SEARCHES
========================================= */

const indianQueries = [

  "Hindi trending songs India",

  "latest Hindi songs India",

  "Bollywood latest songs",

  "Hindi romantic songs",

  "Arijit Singh latest songs",

  "Hindi love songs",

  "Indian trending music",

  "new Bollywood songs",

  "Hindi hit songs",

  "latest Bollywood songs"

];


/* =========================================
   LOAD YOUTUBE API
========================================= */

function loadYouTubeAPI() {

  if (
    document.getElementById(
      "youtube-api"
    )
  ) {

    return;

  }


  const script =
    document.createElement(
      "script"
    );


  script.id =
    "youtube-api";


  script.src =
    "https://www.youtube.com/iframe_api";


  document.head.appendChild(
    script
  );

}


loadYouTubeAPI();


/* =========================================
   YOUTUBE READY
========================================= */

window.onYouTubeIframeAPIReady =
  function () {

    player =
      new YT.Player(
        youtubePlayer,
        {

          height: "1",

          width: "1",

          playerVars: {

            playsinline: 1,

            controls: 0,

            rel: 0,

            modestbranding: 1

          },

          events: {

            onReady:
              function () {

                playerReady =
                  true;

                status.textContent =
                  "Ready";

              },


            onStateChange:
              function (event) {

                if (
                  event.data ===
                  YT.PlayerState.PLAYING
                ) {

                  isPlaying =
                    true;

                  playButton.textContent =
                    "❚❚";

                  startProgress();

                }


                if (
                  event.data ===
                  YT.PlayerState.PAUSED
                ) {

                  isPlaying =
                    false;

                  playButton.textContent =
                    "▶";

                  stopProgress();

                }


                if (
                  event.data ===
                  YT.PlayerState.ENDED
                ) {

                  isPlaying =
                    false;

                  stopProgress();

                  playNext();

                }

              }

          }

        }
      );

  };


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
   SEARCH INPUT
========================================= */

searchInput.addEventListener(
  "input",
  function () {

    const query =
      searchInput.value.trim();


    clearTimeout(
      searchTimer
    );


    if (!query) {

      searchSuggestions.innerHTML =
        "";

      return;

    }


    searchTimer =
      setTimeout(
        function () {

          searchSuggestionsAPI(
            query
          );

        },
        350
      );

  }
);


/* =========================================
   SEARCH SUGGESTIONS
========================================= */

async function searchSuggestionsAPI(
  query
) {

  searchSuggestions.innerHTML =
    `
      <div class="suggestion-loading">
        Searching...
      </div>
    `;


  try {

    const finalQuery =
      `${query} Hindi Indian song`;


    const url =
      `${API_URL}/search?q=${
        encodeURIComponent(
          finalQuery
        )
      }`;


    const response =
      await fetch(
        url
      );


    if (!response.ok) {

      throw new Error(
        "Search failed"
      );

    }


    const data =
      await response.json();


    let items =
      Array.isArray(
        data.items
      )
        ? data.items
        : [];


    items =
      items.filter(
        function (item) {

          return (
            item &&
            item.id &&
            item.id.videoId
          );

        }
      );


    items =
      items.slice(
        0,
        6
      );


    if (
      items.length === 0
    ) {

      searchSuggestions.innerHTML =
        `
          <div class="suggestion-loading">
            No songs found
          </div>
        `;

      return;

    }


    renderSuggestions(
      items
    );

  }

  catch (error) {

    console.error(
      error
    );


    searchSuggestions.innerHTML =
      `
        <div class="suggestion-loading">
          Search unavailable
        </div>
      `;

  }

}


/* =========================================
   RENDER SUGGESTIONS
========================================= */

function renderSuggestions(
  items
) {

  searchSuggestions.innerHTML =
    "";


  items.forEach(
    function (
      item
    ) {

      const snippet =
        item.snippet ||
        {};


      const videoId =
        item.id.videoId;


      const title =
        cleanText(
          snippet.title ||
          "Hindi Song"
        );


      const channel =
        cleanText(
          snippet.channelTitle ||
          "Indian Music"
        );


      const thumbnail =
        snippet?.thumbnails?.default?.url ||
        "";


      const suggestion =
        document.createElement(
          "button"
        );


      suggestion.type =
        "button";


      suggestion.className =
        "suggestion";


      suggestion.innerHTML = `

        <img
          src="${thumbnail}"
          alt=""
        >

        <span>

          <strong>
            ${escapeHTML(title)}
          </strong>

          <small>
            ${escapeHTML(channel)}
          </small>

        </span>

      `;


      suggestion.addEventListener(
        "click",
        function () {

          queue =
            items;

          currentIndex =
            items.indexOf(
              item
            );


          searchPanel.classList.remove(
            "open"
          );


          searchInput.value =
            "";


          searchSuggestions.innerHTML =
            "";


          playSong(
            currentIndex
          );

        }
      );


      searchSuggestions.appendChild(
        suggestion
      );

    }
  );

}


/* =========================================
   PLAY BUTTON
========================================= */

playButton.addEventListener(
  "click",
  async function () {

    if (!playerReady) {

      status.textContent =
        "Player loading...";

      return;

    }


    /*
      First press:
      Get a new Indian song.
    */

    if (
      currentIndex === -1
    ) {

      await loadNewIndianSong();

      return;

    }


    if (isPlaying) {

      player.pauseVideo();

    }
    else {

      player.playVideo();

    }

  }
);


/* =========================================
   LOAD NEW INDIAN SONG
========================================= */

async function loadNewIndianSong() {

  status.textContent =
    "Finding a good Hindi song...";


  const randomIndex =
    Math.floor(
      Math.random() *
      indianQueries.length
    );


  const query =
    indianQueries[
      randomIndex
    ];


  try {

    const url =
      `${API_URL}/search?q=${
        encodeURIComponent(
          query
        )
      }`;


    const response =
      await fetch(
        url
      );


    if (!response.ok) {

      throw new Error(
        "Music search failed"
      );

    }


    const data =
      await response.json();


    let items =
      Array.isArray(
        data.items
      )
        ? data.items
        : [];


    items =
      items.filter(
        function (item) {

          return (
            item &&
            item.id &&
            item.id.videoId
          );

        }
      );


    if (
      items.length === 0
    ) {

      status.textContent =
        "No song found. Try again.";

      return;

    }


    /*
      Shuffle results so
      every Play can give
      a different song.
    */

    items =
      shuffle(
        items
      );


    queue =
      items;


    currentIndex =
      0;


    playSong(
      currentIndex
    );

  }

  catch (error) {

    console.error(
      error
    );


    status.textContent =
      "Unable to find music.";

  }

}


/* =========================================
   PLAY SONG
========================================= */

function playSong(
  index
) {

  if (
    !queue.length ||
    index < 0 ||
    index >= queue.length
  ) {

    return;

  }


  if (!playerReady) {

    status.textContent =
      "Player loading...";

    return;

  }


  const item =
    queue[index];


  const videoId =
    item?.id?.videoId;


  const snippet =
    item?.snippet ||
    {};


  if (!videoId) {

    return;

  }


  currentIndex =
    index;


  songTitle.textContent =
    cleanText(
      snippet.title ||
      "Hindi Song"
    );


  artistName.textContent =
    cleanText(
      snippet.channelTitle ||
      "Indian Music"
    );


  const thumbnail =
    snippet?.thumbnails?.high?.url ||
    snippet?.thumbnails?.medium?.url ||
    snippet?.thumbnails?.default?.url ||
    "";


  if (thumbnail) {

    cover.style.backgroundImage =
      `url("${thumbnail}")`;


    const note =
      cover.querySelector(
        ".cover-note"
      );


    if (note) {

      note.style.display =
        "none";

    }

  }


  progress.value =
    0;


  currentTime.textContent =
    "0:00";


  duration.textContent =
    "0:00";


  status.textContent =
    "Loading song...";


  player.loadVideoById(
    videoId
  );

}


/* =========================================
   NEXT SONG
========================================= */

nextButton.addEventListener(
  "click",
  function () {

    playNext();

  }
);


function playNext() {

  /*
    If queue has another song,
    play it.
  */

  if (
    queue.length &&
    currentIndex <
      queue.length - 1
  ) {

    playSong(
      currentIndex + 1
    );

    return;

  }


  /*
    Queue finished:
    Find another Indian song.
  */

  currentIndex =
    -1;


  loadNewIndianSong();

}


/* =========================================
   PREVIOUS
========================================= */

previousButton.addEventListener(
  "click",
  function () {

    if (
      queue.length &&
      currentIndex > 0
    ) {

      playSong(
        currentIndex - 1
      );

    }

  }
);


/* =========================================
   PROGRESS
========================================= */

progress.addEventListener(
  "input",
  function () {

    if (!playerReady) {
      return;
    }


    const total =
      player.getDuration();


    if (!total) {
      return;
    }


    const percentage =
      Number(
        progress.value
      );


    player.seekTo(
      total *
      percentage /
      100,
      true
    );

  }
);


/* =========================================
   PROGRESS TIMER
========================================= */

function startProgress() {

  stopProgress();


  progressTimer =
    setInterval(
      function () {

        if (!playerReady) {
          return;
        }


        const total =
          player.getDuration();


        const current =
          player.getCurrentTime();


        if (
          !total ||
          !Number.isFinite(
            total
          )
        ) {

          return;

        }


        progress.value =
          (
            current /
            total
          ) * 100;


        currentTime.textContent =
          formatTime(
            current
          );


        duration.textContent =
          formatTime(
            total
          );

      },
      500
    );

}


/* =========================================
   STOP PROGRESS
========================================= */

function stopProgress() {

  if (
    progressTimer
  ) {

    clearInterval(
      progressTimer
    );


    progressTimer =
      null;

  }

}


/* =========================================
   SHUFFLE
========================================= */

function shuffle(
  array
) {

  const copy =
    [...array];


  for (
    let i =
      copy.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    [
      copy[i],
      copy[j]
    ] =
    [
      copy[j],
      copy[i]
    ];

  }


  return copy;

}


/* =========================================
   FORMAT TIME
========================================= */

function formatTime(
  seconds
) {

  if (
    !Number.isFinite(
      seconds
    )
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
   SECURITY
========================================= */

function escapeHTML(
  text
) {

  return String(
    text
  ).replace(
    /[&<>"']/g,
    function (
      character
    ) {

      const entities = {

        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        '"':
          "&quot;",

        "'":
          "&#039;"

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

  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.innerHTML =
    String(text);


  return textarea.value;

}
