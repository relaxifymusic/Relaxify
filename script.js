// ========================================
// RELAXIFY API
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

const youtubePlayer =
  document.getElementById("youtubePlayer");

const closePlayer =
  document.getElementById("closePlayer");


// ========================================
// SEARCH FORM
// ========================================

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


// ========================================
// QUICK MOOD BUTTONS
// ========================================

document
  .querySelectorAll(".quick-searches button")
  .forEach(function(button) {

    button.addEventListener(
      "click",
      function() {

        const query =
          button.dataset.query;

        searchInput.value = query;

        searchYouTube(query);
      }
    );

  });


// ========================================
// SEARCH YOUTUBE
// ========================================

async function searchYouTube(query) {

  status.textContent =
    "Searching...";

  resultsTitle.textContent =
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
      `${API_URL}/search?q=${encodeURIComponent(query)}`;


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `HTTP error ${response.status}`
      );

    }


    const data =
      await response.json();


    const videos =
      Array.isArray(data.items)
        ? data.items
        : [];


    if (videos.length === 0) {

      showEmptyResults();

      return;
    }


    renderResults(videos);


    status.textContent =
      `${videos.length} results`;

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


  videos.forEach(function(video) {

    const videoId =
      video?.id?.videoId;


    const snippet =
      video?.snippet || {};


    const title =
      escapeHTML(
        snippet.title ||
        "Untitled video"
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


    if (!videoId) {

      return;
    }


    const card =
      document.createElement("article");


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
          data-video-id="${videoId}"
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

        playVideo(videoId);

      }
    );


    results.appendChild(card);

  });

}


// ========================================
// PLAY VIDEO
// ========================================

function playVideo(videoId) {

  if (!videoId) {

    return;
  }


  youtubePlayer.src =
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;


  playerContainer.classList.remove(
    "hidden"
  );


  playerContainer.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


// ========================================
// CLOSE PLAYER
// ========================================

closePlayer.addEventListener(
  "click",
  function() {

    youtubePlayer.src = "";

    playerContainer.classList.add(
      "hidden"
    );

  }
);


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
    function(character) {

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
