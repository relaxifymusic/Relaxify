/* =========================================
   RELAXIFY
   SINGLE INDIAN SONG PLAYER
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

const searchForm =
  document.getElementById("searchPanel");

const searchInput =
  document.getElementById("searchInput");

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

let player = null;

let playerReady = false;

let isPlaying = false;

let currentSong = null;

let previousSongs = [];

let progressTimer = null;


/* =========================================
   DIFFERENT SEARCHES
   Used to avoid getting the same song
========================================= */

const songQueries = [

  "new Hindi songs 2026",

  "latest Bollywood songs 2026",

  "Hindi trending songs 2026",

  "new Hindi romantic songs 2026",

  "latest Indian songs 2026",

  "Hindi hit songs 2026",

  "new Bollywood music 2026",

  "Hindi popular songs 2026"

];

let queryIndex = 0;


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

                  playNewIndianSong();

                }

              }

          }

        }
      );

  };


/* =========================================
   PLAY BUTTON
========================================= */

playButton.addEventListener(
  "click",
  function () {

    if (!playerReady) {
      return;
    }


    if (!currentSong) {

      playNewIndianSong();

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
   NEXT
========================================= */

nextButton.addEventListener(
  "click",
  function () {

    playNewIndianSong();

  }
);


/* =========================================
   PREVIOUS
========================================= */

previousButton.addEventListener(
  "click",
  function () {

    if (!previousSongs.length) {
      return;
    }


    const oldSong =
      previousSongs.pop();


    if (!oldSong) {
      return;
    }


    playSong(
      oldSong,
      false
    );

  }
);


/* =========================================
   GET NEW SONG
========================================= */

async function playNewIndianSong() {

  if (!playerReady) {
    return;
  }


  const query =
    songQueries[
      queryIndex %
      songQueries.length
    ];


  queryIndex++;


  try {

    const url =
      `${API_URL}/search?q=${
        encodeURIComponent(query)
      }`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        "Search failed"
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

      return;

    }


    /*
      Pick a random result so that
      every Next doesn't always play
      the first result.
    */

    const randomIndex =
      Math.floor(
        Math.random() *
        Math.min(
          items.length,
          10
        )
      );


    const song =
      items[randomIndex];


    playSong(
      song,
      true
    );

  }

  catch (error) {

    console.error(
      "Relaxify:",
      error
    );

  }

}


/* =========================================
   PLAY SONG
========================================= */

function playSong(
  song,
  savePrevious
) {

  const videoId =
    song?.id?.videoId;


  if (!videoId) {
    return;
  }


  if (
    savePrevious &&
    currentSong
  ) {

    previousSongs.push(
      currentSong
    );


    /*
      Keep only recent songs.
    */

    if (
      previousSongs.length > 10
    ) {

      previousSongs.shift();

    }

  }


  currentSong =
    song;


  const snippet =
    song.snippet || {};


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


  progress.value = 0;

  currentTime.textContent =
    "0:00";

  duration.textContent =
    "0:00";


  player.loadVideoById(
    videoId
  );


  playButton.textContent =
    "❚❚";

}


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


    searchPanel.classList.remove(
      "open"
    );


    await searchAndPlay(
      query
    );

  }
);


/* =========================================
   SEARCH AND DIRECTLY PLAY ONE SONG
========================================= */

async function searchAndPlay(
  query
) {

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
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        "Search failed"
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
      return;
    }


    /*
      Search result list show nahi hogi.
      Directly ek song play hoga.
    */

    const song =
      items[0];


    playSong(
      song,
      true
    );

  }

  catch (error) {

    console.error(
      "Search error:",
      error
    );

  }

}


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


    player.seekTo(
      total *
      Number(progress.value) /
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
          formatTime(current);


        duration.textContent =
          formatTime(total);

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
   TIME
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
    String(secs).padStart(
      2,
      "0"
    )
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
