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

const youtubePlayer =
  document.getElementById("youtubePlayer");


/* =========================================
   STATE
========================================= */

let queue = [];

let currentIndex = -1;

let player = null;

let playerReady = false;

let isPlaying = false;

let progressTimer = null;


/* =========================================
   DEFAULT INDIAN MUSIC SEARCH
========================================= */

const DEFAULT_QUERY =
  "latest trending new Hindi Indian songs 2026";


/* =========================================
   LOAD YOUTUBE API
========================================= */

const ytScript =
  document.createElement("script");

ytScript.src =
  "https://www.youtube.com/iframe_api";

document.head.appendChild(
  ytScript
);


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

                playerReady = true;

              },


            onStateChange:
              function (event) {

                if (
                  event.data ===
                  YT.PlayerState.PLAYING
                ) {

                  isPlaying = true;

                  playButton.textContent =
                    "❚❚";

                  startProgress();

                }


                if (
                  event.data ===
                  YT.PlayerState.PAUSED
                ) {

                  isPlaying = false;

                  playButton.textContent =
                    "▶";

                  stopProgress();

                }


                if (
                  event.data ===
                  YT.PlayerState.ENDED
                ) {

                  isPlaying = false;

                  playNext();

                }

              }

          }

        }
      );

  };


/* =========================================
   FIRST PLAY
========================================= */

playButton.addEventListener(
  "click",
  function () {

    if (!playerReady) {
      return;
    }

    if (currentIndex === -1) {

      loadDefaultSongs();

      return;

    }

    if (isPlaying) {

      player.pauseVideo();

    } else {

      player.playVideo();

    }

  }
);


/* =========================================
   LOAD DEFAULT SONGS
========================================= */

async function loadDefaultSongs() {

  await searchSongs(
    DEFAULT_QUERY,
    true
  );

}


/* =========================================
   SEARCH FORM
========================================= */

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

    searchSongs(
      query,
      false
    );

  }
);


/* =========================================
   SEARCH SONGS
========================================= */

async function searchSongs(
  query,
  autoplay
) {

  results.innerHTML =
    `<div style="
      padding:10px;
      font-size:11px;
      color:rgba(255,255,255,.6);
    ">
      Searching...
    </div>`;


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


    const items =
      Array.isArray(data.items)
        ? data.items.filter(
            function (item) {

              return Boolean(
                item &&
                item.id &&
                item.id.videoId
              );

            }
          )
        : [];


    if (!items.length) {

      results.innerHTML =
        `<div style="
          padding:10px;
          font-size:11px;
          color:rgba(255,255,255,.6);
        ">
          No songs found.
        </div>`;

      return;

    }


    queue = items;

    currentIndex = -1;


    renderResults(
      items
    );


    if (autoplay) {

      playSong(0);

    }

  }

  catch (error) {

    console.error(
      "Relaxify search error:",
      error
    );


    results.innerHTML =
      `<div style="
        padding:10px;
        font-size:11px;
        color:rgba(255,255,255,.6);
      ">
        Search unavailable. Try again.
      </div>`;

  }

}


/* =========================================
   RENDER SEARCH RESULTS
========================================= */

function renderResults(
  items
) {

  results.innerHTML = "";


  items.slice(0, 8).forEach(
    function (item, index) {

      const snippet =
        item.snippet || {};


      const videoId =
        item?.id?.videoId;


      if (!videoId) {
        return;
      }


      const title =
        cleanText(
          snippet.title ||
          "Indian Song"
        );


      const channel =
        cleanText(
          snippet.channelTitle ||
          "YouTube"
        );


      const thumbnail =
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        "";


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "result-card";


      card.innerHTML = `

        <img
          class="result-thumb"
          src="${thumbnail}"
          alt=""
        >

        <div class="result-info">

          <div class="result-title">
            ${escapeHTML(title)}
          </div>

          <div class="result-channel">
            ${escapeHTML(channel)}
          </div>

        </div>

        <button
          class="result-play"
          type="button"
        >
          ▶
        </button>

      `;


      card
        .querySelector(
          ".result-play"
        )
        .addEventListener(
          "click",
          function () {

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


  const item =
    queue[index];


  const videoId =
    item?.id?.videoId;


  const snippet =
    item?.snippet || {};


  if (!videoId) {
    return;
  }


  currentIndex =
    index;


  songTitle.textContent =
    cleanText(
      snippet.title ||
      "Indian Music"
    );


  artistName.textContent =
    cleanText(
      snippet.channelTitle ||
      "YouTube"
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


  if (!playerReady) {
    return;
  }


  player.loadVideoById(
    videoId
  );


  playButton.textContent =
    "❚❚";

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

  if (!queue.length) {

    loadDefaultSongs();

    return;

  }


  let nextIndex =
    currentIndex + 1;


  if (
    nextIndex >= queue.length
  ) {

    /*
      Queue khatam hone par
      naye trending songs load
      honge.
    */

    loadDefaultSongs();

    return;

  }


  playSong(
    nextIndex
  );

}


/* =========================================
   PREVIOUS SONG
========================================= */

previousButton.addEventListener(
  "click",
  function () {

    if (!queue.length) {
      return;
    }


    let previousIndex =
      currentIndex - 1;


    if (previousIndex < 0) {

      previousIndex =
        queue.length - 1;

    }


    playSong(
      previousIndex
    );

  }
);


/* =========================================
   PROGRESS BAR
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
   PROGRESS UPDATE
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
          !Number.isFinite(total)
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


function stopProgress() {

  if (progressTimer) {

    clearInterval(
      progressTimer
    );

    progressTimer = null;

  }

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


  const secondsPart =
    Math.floor(
      seconds % 60
    );


  return (
    minutes +
    ":" +
    String(
      secondsPart
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
