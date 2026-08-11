/* =========================================
   RELAXIFY — INDIAN TRENDING MUSIC PLAYER
========================================= */

const API_URL =
  "https://relaxify-api.djboy4696.workers.dev";


/* =========================================
   ELEMENTS
========================================= */

const songTitle = document.getElementById("songTitle");
const artistName = document.getElementById("artistName");
const cover = document.getElementById("cover");

const playButton = document.getElementById("playButton");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");

const progress = document.getElementById("progress");
const volume = document.getElementById("volume");

const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");

const status = document.getElementById("status");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");

const voiceButton = document.getElementById("voiceButton");
const voiceControl = document.getElementById("voiceControl");
const voiceStatus = document.getElementById("voiceStatus");

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
let pendingAutoPlay = false;


/* =========================================
   DEFAULT TRENDING SEARCH
========================================= */

const DEFAULT_QUERY =
  "India trending Hindi songs new Bollywood songs 2026";


/* =========================================
   LOAD YOUTUBE IFRAME API
========================================= */

function loadYouTubeAPI() {

  if (
    document.getElementById("youtube-api")
  ) {
    return;
  }

  const script =
    document.createElement("script");

  script.id =
    "youtube-api";

  script.src =
    "https://www.youtube.com/iframe_api";

  document.head.appendChild(script);
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

                playerReady = true;

                player.setVolume(
                  Number(volume.value)
                );

                status.textContent =
                  "Ready";

                if (
                  pendingAutoPlay &&
                  queue.length
                ) {

                  pendingAutoPlay = false;

                  playSong(0);
                }
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

                  status.textContent =
                    "Playing";

                }


                if (
                  event.data ===
                  YT.PlayerState.PAUSED
                ) {

                  isPlaying = false;

                  playButton.textContent =
                    "▶";

                  stopProgress();

                  status.textContent =
                    "Paused";
                }


                if (
                  event.data ===
                  YT.PlayerState.ENDED
                ) {

                  isPlaying = false;

                  stopProgress();

                  playNext();
                }

              }

          }

        }
      );

  };


/* =========================================
   SEARCH
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

    searchIndianMusic(
      query,
      true
    );
  }
);


/* =========================================
   SEARCH INDIAN MUSIC
========================================= */

async function searchIndianMusic(
  query,
  autoPlay = false
) {

  status.textContent =
    "Finding Indian songs...";


  try {

    const finalQuery =
      `${query} Hindi Indian Bollywood official song`;


    const url =
      `${API_URL}/search?q=${
        encodeURIComponent(finalQuery)
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


    let items =
      Array.isArray(data.items)
        ? data.items
        : [];


    /*
      Remove invalid results.
    */

    items =
      items.filter(
        function (item) {

          return Boolean(
            item &&
            item.id &&
            item.id.videoId &&
            item.snippet
          );

        }
      );


    if (!items.length) {

      status.textContent =
        "No Indian songs found";

      return;
    }


    /*
      New queue.
    */

    queue = items;

    currentIndex = -1;


    renderResults(items);


    status.textContent =
      `${items.length} Indian songs found`;


    /*
      Automatically start first song.
    */

    if (autoPlay) {

      if (playerReady) {

        playSong(0);

      }
      else {

        pendingAutoPlay = true;

        status.textContent =
          "Loading music...";
      }

    }

  }
  catch (error) {

    console.error(error);

    status.textContent =
      "Unable to load songs";

  }

}


/* =========================================
   RENDER RESULTS
========================================= */

function renderResults(items) {

  results.innerHTML = "";


  items.forEach(
    function (item, index) {

      const snippet =
        item.snippet || {};

      const videoId =
        item?.id?.videoId;


      if (!videoId) {
        return;
      }


      const title =
        escapeHTML(
          snippet.title ||
          "Indian Song"
        );


      const channel =
        escapeHTML(
          snippet.channelTitle ||
          "YouTube"
        );


      const thumbnail =
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        "";


      const card =
        document.createElement("div");


      card.className =
        "result-card";


      card.innerHTML = `

        <img
          class="result-thumb"
          src="${thumbnail}"
          alt=""
          loading="lazy"
        >

        <div class="result-info">

          <div class="result-title">
            ${title}
          </div>

          <div class="result-channel">
            ${channel}
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


      results.appendChild(card);

    }
  );

}


/* =========================================
   PLAY SONG
========================================= */

function playSong(index) {

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


  if (!playerReady) {

    pendingAutoPlay = true;

    status.textContent =
      "Loading player...";

    return;
  }


  player.loadVideoById(
    videoId
  );


  player.setVolume(
    Number(volume.value)
  );


  progress.value = 0;

  currentTime.textContent =
    "0:00";

  duration.textContent =
    "0:00";


  isPlaying = true;

  playButton.textContent =
    "❚❚";


  status.textContent =
    `Playing ${index + 1} of ${queue.length}`;

}


/* =========================================
   PLAY / PAUSE
========================================= */

playButton.addEventListener(
  "click",
  function () {

    /*
      First play:
      Load current Indian trending songs.
    */

    if (
      currentIndex === -1
    ) {

      pendingAutoPlay = true;

      searchIndianMusic(
        DEFAULT_QUERY,
        true
      );

      return;
    }


    if (!playerReady) {

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
   NEXT
========================================= */

nextButton.addEventListener(
  "click",
  function () {

    playNext();

  }
);


function playNext() {

  /*
    If there is no queue,
    get fresh trending songs.
  */

  if (!queue.length) {

    searchIndianMusic(
      DEFAULT_QUERY,
      true
    );

    return;
  }


  let nextIndex =
    currentIndex + 1;


  /*
    When queue ends,
    fetch fresh trending songs.
  */

  if (
    nextIndex >= queue.length
  ) {

    searchIndianMusic(
      DEFAULT_QUERY,
      true
    );

    return;
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
  function () {

    if (!queue.length) {

      return;
    }


    let previousIndex =
      currentIndex - 1;


    if (
      previousIndex < 0
    ) {

      previousIndex =
        queue.length - 1;
    }


    playSong(
      previousIndex
    );

  }
);


/* =========================================
   VOLUME
========================================= */

volume.addEventListener(
  "input",
  function () {

    if (!playerReady) {
      return;
    }


    player.setVolume(
      Number(volume.value)
    );

  }
);


/* =========================================
   PROGRESS / FAST FORWARD
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
      Number(progress.value);


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
          !Number.isFinite(total)
        ) {

          return;
        }


        progress.value =
          (
            current /
            total
          ) *
          100;


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
   VOICE CONTROL
========================================= */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


let recognition = null;


if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();


  recognition.lang =
    "en-IN";


  recognition.continuous =
    false;


  recognition.interimResults =
    false;


  recognition.onstart =
    function () {

      voiceStatus.textContent =
        "Listening...";

      voiceButton.classList.add(
        "listening"
      );

    };


  recognition.onend =
    function () {

      voiceButton.classList.remove(
        "listening"
      );

    };


  recognition.onerror =
    function () {

      voiceStatus.textContent =
        "Couldn't hear that.";

    };


  recognition.onresult =
    function (event) {

      const command =
        event.results[0][0]
          .transcript
          .toLowerCase()
          .trim();


      voiceStatus.textContent =
        `Heard: "${command}"`;


      handleVoiceCommand(
        command
      );

    };

}


/* =========================================
   VOICE BUTTONS
========================================= */

voiceButton.addEventListener(
  "click",
  startVoice
);


voiceControl.addEventListener(
  "click",
  startVoice
);


function startVoice() {

  if (!recognition) {

    voiceStatus.textContent =
      "Voice control is not supported.";

    return;
  }


  try {

    recognition.start();

  }
  catch (error) {

    console.log(error);

  }

}


/* =========================================
   VOICE COMMANDS
========================================= */

function handleVoiceCommand(
  command
) {

  if (
    command.includes("pause")
  ) {

    if (playerReady) {
      player.pauseVideo();
    }

    return;
  }


  if (
    command.includes("resume") ||
    command === "play"
  ) {

    if (
      currentIndex === -1
    ) {

      searchIndianMusic(
        DEFAULT_QUERY,
        true
      );

    }
    else if (playerReady) {

      player.playVideo();

    }

    return;
  }


  if (
    command.includes("next") ||
    command.includes("skip")
  ) {

    playNext();

    return;
  }


  if (
    command.includes("previous") ||
    command.includes("back")
  ) {

    previousButton.click();

    return;
  }


  if (
    command.includes("volume up")
  ) {

    changeVolume(10);

    return;
  }


  if (
    command.includes("volume down")
  ) {

    changeVolume(-10);

    return;
  }


  if (
    command.includes("mute")
  ) {

    volume.value = 0;

    volume.dispatchEvent(
      new Event("input")
    );

    return;
  }


  /*
    Example:
    "play Arijit Singh"
  */

  const playMatch =
    command.match(
      /^play (.+)$/
    );


  if (
    playMatch &&
    playMatch[1]
  ) {

    searchIndianMusic(
      `${playMatch[1]} Indian Hindi song`,
      true
    );

    return;
  }


  /*
    Example:
    "search romantic songs"
  */

  const searchMatch =
    command.match(
      /^search (.+)$/
    );


  if (
    searchMatch &&
    searchMatch[1]
  ) {

    searchIndianMusic(
      searchMatch[1],
      true
    );

    return;
  }


  voiceStatus.textContent =
    "Try: play, pause, next, previous";

}


/* =========================================
   CHANGE VOLUME
========================================= */

function changeVolume(amount) {

  let value =
    Number(volume.value);


  value += amount;


  value =
    Math.max(
      0,
      Math.min(
        100,
        value
      )
    );


  volume.value =
    value;


  volume.dispatchEvent(
    new Event("input")
  );

}


/* =========================================
   FORMAT TIME
========================================= */

function formatTime(seconds) {

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
   SECURITY
========================================= */

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


      return entities[character];

    }
  );

}


/* =========================================
   CLEAN TEXT
========================================= */

function cleanText(text) {

  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.innerHTML =
    String(text);


  return textarea.value;

}
