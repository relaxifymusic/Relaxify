// ============================================
// RELAXIFY — APP.JS
// ============================================

const CONFIG = window.RELAXIFY_CONFIG || {};

const $ = (selector) => document.querySelector(selector);


// ============================================
// STATE
// ============================================

const state = {
  currentTrack: null,
  previousTrack: null,

  recentSearches: JSON.parse(
    localStorage.getItem("relaxify_recent_searches") || "[]"
  ),

  searchTimer: null,
  searchRequestId: 0,

  youtubeReady: false,
  youtubePlayer: null,
  youtubeState: -1,

  lyricsVisible: false,
  lyrics: [],
  lyricTimer: null
};


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {

  setupSearch();
  setupPlayerControls();
  setupLyrics();
  setupBrowserBack();

  renderRecentSearches();

  initializeYouTube();

  // Preload first track.
  // It remains paused until Play is pressed.
  loadDefaultTrack();
});


// ============================================
// YOUTUBE API
// ============================================

function initializeYouTube() {

  const script = document.createElement("script");

  script.src = "https://www.youtube.com/iframe_api";

  document.head.appendChild(script);


  window.onYouTubeIframeAPIReady = () => {

    state.youtubeReady = true;

    state.youtubePlayer = new YT.Player(
      "audioPlayer",
      {
        width: "1",
        height: "1",

        videoId: "",

        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0
        },

        events: {
          onReady: handleYouTubeReady,
          onStateChange: handleYouTubeStateChange
        }
      }
    );
  };
}


function handleYouTubeReady() {

  if (!state.currentTrack) {
    return;
  }

  if (state.currentTrack.source === "youtube") {

    state.youtubePlayer.cueVideoById(
      state.currentTrack.id
    );
  }
}


// ============================================
// YOUTUBE PLAYER STATE
// ============================================

function handleYouTubeStateChange(event) {

  state.youtubeState = event.data;

  updatePlayButton();


  if (
    event.data === YT.PlayerState.ENDED
  ) {

    playNext();
  }
}


// ============================================
// DEFAULT TRACK
// ============================================

function loadDefaultTrack() {

  const defaultTrack = {

    id: "",

    title: "Search for a song",

    artist: "RELAXIFY",

    artwork: "assets/default-art.jpg",

    source: "youtube"
  };


  state.currentTrack = defaultTrack;

  updatePlayerUI();
}


// ============================================
// LOAD TRACK
// ============================================

function loadTrack(track, autoplay = false) {

  if (!track) {
    return;
  }


  state.previousTrack = state.currentTrack;

  state.currentTrack = track;


  updatePlayerUI();


  if (
    track.source === "youtube" &&
    state.youtubeReady &&
    state.youtubePlayer
  ) {

    state.youtubePlayer.cueVideoById(
      track.id
    );


    // Important:
    // Search result is loaded first.
    // If autoplay is requested, immediately play.
    if (autoplay) {

      state.youtubePlayer.playVideo();
    }
  }
}


// ============================================
// PLAYER UI
// ============================================

function updatePlayerUI() {

  const track = state.currentTrack;

  if (!track) {
    return;
  }


  const title =
    track.title || "Unknown Song";

  const artist =
    track.artist || "Unknown Artist";

  const artwork =
    track.artwork ||
    track.thumbnail ||
    "assets/default-art.jpg";


  $("#songTitle").textContent = title;

  $("#artistName").textContent = artist;

  $("#albumArt").src = artwork;


  $("#progressBar").value = 0;


  updatePlayButton();
}


// ============================================
// PLAY / PAUSE
// ============================================

function togglePlay() {

  if (!state.currentTrack) {
    return;
  }


  if (
    !state.currentTrack.id ||
    !state.youtubeReady ||
    !state.youtubePlayer
  ) {

    showToast(
      "Search and select a song first."
    );

    return;
  }


  if (
    state.youtubeState ===
    YT.PlayerState.PLAYING
  ) {

    state.youtubePlayer.pauseVideo();

  } else {

    state.youtubePlayer.playVideo();
  }
}


// ============================================
// PLAY BUTTON UI
// ============================================

function updatePlayButton() {

  const button = $("#playButton");

  if (!button) {
    return;
  }


  if (
    state.youtubeState ===
    YT.PlayerState.PLAYING
  ) {

    button.textContent = "❚❚";

    button.setAttribute(
      "aria-label",
      "Pause"
    );

  } else {

    button.textContent = "▶";

    button.setAttribute(
      "aria-label",
      "Play"
    );
  }
}


// ============================================
// NEXT SONG
// ============================================

function playNext() {

  if (!state.currentTrack) {
    return;
  }


  // If search results exist,
  // move to the next available result.

  const results =
    document.querySelectorAll(
      ".search-result"
    );


  if (results.length > 0) {

    const tracks =
      window.RELAXIFY_SEARCH_RESULTS || [];


    const currentIndex =
      tracks.findIndex(
        (track) =>
          track.id ===
          state.currentTrack.id
      );


    if (
      currentIndex >= 0 &&
      currentIndex + 1 < tracks.length
    ) {

      loadTrack(
        tracks[currentIndex + 1],
        true
      );

      return;
    }
  }


  showToast(
    "No next song available."
  );
}


// ============================================
// PREVIOUS SONG
// ============================================

function playPrevious() {

  if (!state.previousTrack) {

    showToast(
      "No previous song."
    );

    return;
  }


  loadTrack(
    state.previousTrack,
    true
  );
}


// ============================================
// PROGRESS BAR
// ============================================

function updateProgress() {

  if (
    !state.youtubeReady ||
    !state.youtubePlayer
  ) {
    return;
  }


  if (
    state.youtubeState !==
    YT.PlayerState.PLAYING
  ) {
    return;
  }


  const duration =
    state.youtubePlayer.getDuration();

  const current =
    state.youtubePlayer.getCurrentTime();


  if (!duration) {
    return;
  }


  const percentage =
    (current / duration) * 100;


  $("#progressBar").value =
    percentage;
}


setInterval(
  updateProgress,
  500
);


// ============================================
// SEEK
// ============================================

function seekSong(value) {

  if (
    !state.youtubeReady ||
    !state.youtubePlayer
  ) {
    return;
  }


  const duration =
    state.youtubePlayer.getDuration();


  if (!duration) {
    return;
  }


  const time =
    duration *
    (Number(value) / 100);


  state.youtubePlayer.seekTo(
    time,
    true
  );
}


// ============================================
// PLAYER EVENT SETUP
// ============================================

function setupPlayerControls() {

  $("#playButton")
    .addEventListener(
      "click",
      togglePlay
    );


  $("#nextButton")
    .addEventListener(
      "click",
      playNext
    );


  $("#previousButton")
    .addEventListener(
      "click",
      playPrevious
    );


  $("#progressBar")
    .addEventListener(
      "input",
      (event) => {

        seekSong(
          event.target.value
        );
      }
    );
}


// ============================================
// SEARCH SETUP
// ============================================

function setupSearch() {

  const searchButton =
    $("#searchButton");

  const searchPanel =
    $("#searchPanel");

  const searchInput =
    $("#searchInput");

  const clearButton =
    $("#clearSearchButton");


  searchButton.addEventListener(
    "click",
    openSearch
  );


  clearButton.addEventListener(
    "click",
    clearSearch
  );


  searchInput.addEventListener(
    "input",
    (event) => {

      const query =
        event.target.value.trim();


      clearTimeout(
        state.searchTimer
      );


      if (!query) {

        renderRecentSearches();

        return;
      }


      state.searchTimer =
        setTimeout(
          () => {

            searchSongs(query);

          },
          CONFIG.SEARCH_DEBOUNCE_MS || 180
        );
    }
  );
}


// ============================================
// OPEN SEARCH
// ============================================

function openSearch() {

  const panel =
    $("#searchPanel");

  const button =
    $("#searchButton");


  panel.hidden = false;

  button.hidden = true;


  button.setAttribute(
    "aria-expanded",
    "true"
  );


  // C = subtle background blur

  $("#background").style.filter =
    "blur(3px)";


  $("#searchInput").focus();


  renderRecentSearches();
}


// ============================================
// CLOSE SEARCH
// ============================================

function closeSearch() {

  const panel =
    $("#searchPanel");

  const button =
    $("#searchButton");


  panel.hidden = true;

  button.hidden = false;


  button.setAttribute(
    "aria-expanded",
    "false"
  );


  $("#background").style.filter =
    "";


  // Search remains in the input
  // unless user explicitly clears it.
}


// ============================================
// BROWSER BACK
// ============================================

function setupBrowserBack() {

  window.addEventListener(
    "popstate",
    () => {

      if (
        !$("#searchPanel").hidden
      ) {

        closeSearch();
      }
    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        !$("#searchPanel").hidden
      ) {

        closeSearch();
      }
    }
  );
}


// ============================================
// CLEAR SEARCH
// ============================================

function clearSearch() {

  $("#searchInput").value = "";

  $("#searchResults").innerHTML = "";

  renderRecentSearches();

  $("#searchInput").focus();
}


// ============================================
// YOUTUBE SEARCH
// ============================================

async function searchSongs(query) {

  const requestId =
    ++state.searchRequestId;


  const resultsContainer =
    $("#searchResults");


  resultsContainer.innerHTML =
    createLoadingSkeleton();


  if (
    !CONFIG.YOUTUBE_API_KEY
  ) {

    resultsContainer.innerHTML = `
      <div class="search-message">
        Add your YouTube API key in
        <strong>config.js</strong>
        to enable live search.
      </div>
    `;

    return;
  }


  try {

    const params =
      new URLSearchParams({

        part: "snippet",

        type: "video",

        maxResults: "15",

        q: query,

        regionCode:
          CONFIG.REGION_CODE || "IN",

        relevanceLanguage:
          CONFIG.RELEVANCE_LANGUAGE || "hi"
      });


    const response =
      await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}&key=${encodeURIComponent(CONFIG.YOUTUBE_API_KEY)}`
      );


    if (!response.ok) {

      throw new Error(
        `Search failed: ${response.status}`
      );
    }


    const data =
      await response.json();


    if (
      requestId !==
      state.searchRequestId
    ) {
      return;
    }


    const tracks =
      (data.items || [])
        .filter(
          item =>
            item.id &&
            item.id.videoId
        )
        .map(
          item => ({

            id:
              item.id.videoId,

            title:
              cleanText(
                item.snippet.title
              ),

            artist:
              item.snippet.channelTitle,

            artwork:
              item.snippet
                .thumbnails
                ?.high
                ?.url ||
              item.snippet
                .thumbnails
                ?.medium
                ?.url,

            source:
              "youtube"
          })
        );


    window.RELAXIFY_SEARCH_RESULTS =
      tracks;


    if (!tracks.length) {

      renderNoResults();

      return;
    }


    renderSearchResults(
      tracks
    );

  } catch (error) {

    console.error(error);


    resultsContainer.innerHTML = `
      <div class="search-message">
        Search temporarily unavailable.
        Please try again.
      </div>
    `;
  }
}


// ============================================
// CLEAN TEXT
// ============================================

function cleanText(text) {

  const temp =
    document.createElement("div");

  temp.innerHTML = text;

  return temp.textContent || "";
}


// ============================================
// SEARCH RESULTS
// ============================================

function renderSearchResults(
  tracks
) {

  const container =
    $("#searchResults");


  container.innerHTML = "";


  tracks.forEach(
    (track, index) => {

      const result =
        document.createElement("button");


      result.type = "button";

      result.className =
        "search-result";


      result.style.animationDelay =
        `${index * 25}ms`;


      result.innerHTML = `

        <img
          src="${escapeHtml(track.artwork)}"
          alt=""
        >

        <div>

          <div class="search-result-title">
            ${escapeHtml(track.title)}
          </div>

          <div class="search-result-artist">
            ${escapeHtml(track.artist)}
          </div>

        </div>
      `;


      result.addEventListener(
        "click",
        () => {

          addRecentSearch(
            $("#searchInput").value
          );


          // Song is loaded first.
          // Play button can immediately start it.

          loadTrack(
            track,
            false
          );


          showToast(
            "Song loaded"
          );
        }
      );


      container.appendChild(
        result
      );
    }
  );
}


// ============================================
// NO RESULTS
// ============================================

function renderNoResults() {

  $("#searchResults").innerHTML = `

    <div class="search-message">

      <strong>
        No results found
      </strong>

      <br>

      Try a similar song or artist.

    </div>
  `;
}


// ============================================
// LOADING SKELETON
// ============================================

function createLoadingSkeleton() {

  return `

    <div class="search-skeleton"></div>
    <div class="search-skeleton"></div>
    <div class="search-skeleton"></div>

  `;
}


// ============================================
// RECENT SEARCHES
// ============================================

function addRecentSearch(
  query
) {

  query =
    query.trim();


  if (!query) {
    return;
  }


  state.recentSearches =
    [
      query,

      ...state.recentSearches
        .filter(
          item =>
            item.toLowerCase() !==
            query.toLowerCase()
        )
    ];


  // Smart limit

  const maxItems =
    window.innerWidth < 600
      ? 6
      : 12;


  state.recentSearches =
    state.recentSearches
      .slice(
        0,
        maxItems
      );


  localStorage.setItem(
    "relaxify_recent_searches",
    JSON.stringify(
      state.recentSearches
    )
  );


  renderRecentSearches();
}


// ============================================
// RENDER RECENT
// ============================================

function renderRecentSearches() {

  const container =
    $("#searchResults");


  if (
    $("#searchInput").value.trim()
  ) {
    return;
  }


  if (
    !state.recentSearches.length
  ) {

    container.innerHTML = `
      <div class="search-message">
        Search for a song or artist.
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="recent-title">
      Recent searches
    </div>

    <div class="recent-searches"></div>
  `;


  const list =
    container.querySelector(
      ".recent-searches"
    );


  state.recentSearches.forEach(
    (query) => {

      const item =
        document.createElement(
          "button"
        );


      item.type = "button";

      item.className =
        "recent-search";


      item.innerHTML = `

        <span>
          ${escapeHtml(query)}
        </span>

        <span
          class="recent-delete"
          title="Delete"
        >
          ✕
        </span>
      `;


      item.addEventListener(
        "click",
        (event) => {

          if (
            event.target.classList
              .contains(
                "recent-delete"
              )
          ) {

            deleteRecentSearch(
              query
            );

            return;
          }


          $("#searchInput")
            .value = query;


          searchSongs(query);
        }
      );


      list.appendChild(item);
    }
  );
}


// ============================================
// DELETE RECENT SEARCH
// ============================================

function deleteRecentSearch(
  query
) {

  state.recentSearches =
    state.recentSearches
      .filter(
        item =>
          item !== query
      );


  localStorage.setItem(
    "relaxify_recent_searches",
    JSON.stringify(
      state.recentSearches
    )
  );


  renderRecentSearches();
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      character => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      })[character]
    );
}


// ============================================
// LYRICS
// ============================================

function setupLyrics() {

  $("#lyricsButton")
    .addEventListener(
      "click",
      toggleLyrics
    );
}


function toggleLyrics() {

  if (
    state.lyricsVisible
  ) {

    hideLyrics();

    return;
  }


  if (
    !state.lyrics.length
  ) {

    showToast(
      "Lyrics unavailable"
    );

    return;
  }


  showLyrics();
}


function showLyrics() {

  const area =
    $("#lyricsArea");


  area.innerHTML = "";


  state.lyrics.forEach(
    (line, index) => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "lyric-line";


      div.textContent =
        line.text || line;


      if (index === 0) {

        div.classList.add(
          "active"
        );
      }


      area.appendChild(
        div
      );
    }
  );


  state.lyricsVisible =
    true;


  area.style.opacity = "1";


  startLyricsClock();
}


function hideLyrics() {

  const area =
    $("#lyricsArea");


  area.style.opacity = "0";


  setTimeout(
    () => {

      area.innerHTML = "";

      area.style.opacity = "";

    },
    250
  );


  state.lyricsVisible =
    false;


  clearInterval(
    state.lyricTimer
  );
}


// ============================================
// TIMED LYRICS
// ============================================

function startLyricsClock() {

  clearInterval(
    state.lyricTimer
  );


  state.lyricTimer =
    setInterval(
      () => {

        if (
          !state.youtubePlayer ||
          !state.lyrics.length
        ) {
          return;
        }


        if (
          state.youtubeState !==
          YT.PlayerState.PLAYING
        ) {
          return;
        }


        const currentTime =
          state.youtubePlayer
            .getCurrentTime();


        let activeIndex = 0;


        state.lyrics.forEach(
          (line, index) => {

            if (
              Number(
                line.time || 0
              ) <= currentTime
            ) {

              activeIndex =
                index;
            }
          }
        );


        document
          .querySelectorAll(
            ".lyric-line"
          )
          .forEach(
            (element, index) => {

              element.classList.toggle(
                "active",
                index === activeIndex
              );
            }
          );

      },
      100
    );
}


// ============================================
// TOAST
// ============================================

function showToast(
  message
) {

  const toast =
    $("#toast");


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2200
    );
}
