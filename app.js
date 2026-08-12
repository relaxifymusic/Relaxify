// ============================================
// RELAXIFY — APP.JS
// Complete corrected version
// ============================================

"use strict";

const CONFIG = window.RELAXIFY_CONFIG || {};

const $ = (selector) => document.querySelector(selector);


// ============================================
// STATE
// ============================================

const state = {
  currentTrack: null,
  previousTrack: null,

  searchResults: [],

  recentSearches: JSON.parse(
    localStorage.getItem("relaxify_recent_searches") || "[]"
  ),

  searchTimer: null,
  searchRequestId: 0,

  youtubeReady: false,
  youtubePlayer: null,
  youtubeState: -1,
  youtubeApiLoading: false,

  lyricsVisible: false,
  lyrics: [],
  lyricTimer: null
};


// ============================================
// CONSTANTS
// ============================================

const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupPlayerControls();
  setupLyrics();
  setupBrowserBack();
  setupGlobalClicks();

  renderRecentSearches();

  initializeYouTube();

  loadDefaultTrack();
});


// ============================================
// DEFAULT TRACK
// ============================================

function loadDefaultTrack() {
  const defaultTrack = {
    id: "",
    title: "Search for a song",
    artist: "RELAXIFY",
    artwork: "assets/default-art.svg",
    source: "youtube"
  };

  state.currentTrack = defaultTrack;

  updatePlayerUI();
}


// ============================================
// YOUTUBE API
// ============================================

function initializeYouTube() {
  if (state.youtubeApiLoading || state.youtubeReady) {
    return;
  }

  state.youtubeApiLoading = true;

  // If API is already loaded
  if (window.YT && window.YT.Player) {
    state.youtubeReady = true;
    createYouTubePlayer();
    return;
  }

  // Prevent loading the script twice
  const existingScript = document.querySelector(
    'script[src="https://www.youtube.com/iframe_api"]'
  );

  const previousCallback = window.onYouTubeIframeAPIReady;

  window.onYouTubeIframeAPIReady = () => {
    state.youtubeReady = true;
    state.youtubeApiLoading = false;

    if (typeof previousCallback === "function") {
      try {
        previousCallback();
      } catch (error) {
        console.error(
          "Previous YouTube callback error:",
          error
        );
      }
    }

    createYouTubePlayer();
  };

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");

  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;

  script.onerror = () => {
    state.youtubeApiLoading = false;

    showToast(
      "YouTube player could not load."
    );
  };

  document.head.appendChild(script);
}


// ============================================
// CREATE YOUTUBE PLAYER
// ============================================

function createYouTubePlayer() {
  const host = $("#audioPlayer");

  if (!host) {
    console.error(
      "audioPlayer element not found."
    );

    return;
  }

  if (
    state.youtubePlayer &&
    typeof state.youtubePlayer.destroy === "function"
  ) {
    return;
  }

  try {
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
          rel: 0,
          modestbranding: 1
        },

        events: {
          onReady: handleYouTubeReady,
          onStateChange: handleYouTubeStateChange,
          onError: handleYouTubeError
        }
      }
    );
  } catch (error) {
    console.error(
      "YouTube player creation failed:",
      error
    );

    showToast(
      "YouTube player initialization failed."
    );
  }
}


// ============================================
// YOUTUBE READY
// ============================================

function handleYouTubeReady() {
  state.youtubeReady = true;

  state.youtubeState = YT_STATE.CUED;

  if (
    state.currentTrack &&
    state.currentTrack.source === "youtube" &&
    state.currentTrack.id
  ) {
    cueTrack(
      state.currentTrack
    );
  }

  updatePlayButton();
}


// ============================================
// CUE TRACK
// ============================================

function cueTrack(track) {
  if (
    !track ||
    !track.id ||
    !state.youtubePlayer
  ) {
    return;
  }

  try {
    state.youtubePlayer.cueVideoById(
      track.id
    );
  } catch (error) {
    console.error(
      "Could not cue YouTube video:",
      error
    );
  }
}


// ============================================
// LOAD TRACK
// ============================================

function loadTrack(
  track,
  autoplay = false
) {
  if (!track) {
    return;
  }

  if (
    state.currentTrack &&
    state.currentTrack.id !== track.id
  ) {
    state.previousTrack =
      state.currentTrack;
  }

  state.currentTrack = track;

  state.youtubeState =
    YT_STATE.CUED;

  updatePlayerUI();

  if (
    track.source !== "youtube"
  ) {
    showToast(
      "Unsupported audio source."
    );

    return;
  }

  if (
    !track.id
  ) {
    return;
  }

  if (
    !state.youtubeReady ||
    !state.youtubePlayer
  ) {
    showToast(
      "YouTube player is still loading."
    );

    return;
  }

  try {
    if (autoplay) {
      state.youtubePlayer.loadVideoById(
        track.id
      );
    } else {
      state.youtubePlayer.cueVideoById(
        track.id
      );
    }
  } catch (error) {
    console.error(
      "Track loading error:",
      error
    );

    showToast(
      "Could not load this song."
    );
  }
}


// ============================================
// YOUTUBE STATE CHANGE
// ============================================

function handleYouTubeStateChange(event) {
  state.youtubeState =
    event.data;

  updatePlayButton();

  if (
    event.data ===
    YT_STATE.PLAYING
  ) {
    updateProgress();
  }

  if (
    event.data ===
    YT_STATE.ENDED
  ) {
    playNext();
  }
}


// ============================================
// YOUTUBE ERROR
// ============================================

function handleYouTubeError(event) {
  console.error(
    "YouTube player error:",
    event.data
  );

  const messages = {
    2: "Invalid YouTube video.",
    5: "This video cannot be played.",
    100: "Video not found or removed.",
    101: "This video cannot be played here.",
    150: "This video cannot be played here."
  };

  showToast(
    messages[event.data] ||
    "YouTube playback error."
  );

  updatePlayButton();
}


// ============================================
// PLAYER UI
// ============================================

function updatePlayerUI() {
  const track =
    state.currentTrack;

  if (!track) {
    return;
  }

  const title =
    track.title ||
    "Unknown Song";

  const artist =
    track.artist ||
    "Unknown Artist";

  const artwork =
    track.artwork ||
    track.thumbnail ||
    "assets/default-art.svg";

  const titleElement =
    $("#songTitle");

  const artistElement =
    $("#artistName");

  const artworkElement =
    $("#albumArt");

  const progress =
    $("#progressBar");

  if (titleElement) {
    titleElement.textContent =
      title;
  }

  if (artistElement) {
    artistElement.textContent =
      artist;
  }

  if (artworkElement) {
    artworkElement.src =
      artwork;

    artworkElement.onerror = () => {
      artworkElement.src =
        "assets/default-art.svg";
    };
  }

  if (progress) {
    progress.value = 0;
  }

  updatePlayButton();
}


// ============================================
// PLAY / PAUSE
// ============================================

function togglePlay() {
  if (!state.currentTrack) {
    return;
  }

  if (!state.currentTrack.id) {
    showToast(
      "Search and select a song first."
    );

    return;
  }

  if (
    !state.youtubeReady ||
    !state.youtubePlayer
  ) {
    showToast(
      "YouTube player is loading..."
    );

    return;
  }

  try {
    if (
      state.youtubeState ===
      YT_STATE.PLAYING
    ) {
      state.youtubePlayer.pauseVideo();

      return;
    }

    if (
      state.youtubeState ===
      YT_STATE.PAUSED ||
      state.youtubeState ===
      YT_STATE.CUED ||
      state.youtubeState ===
      YT_STATE.UNSTARTED
    ) {
      state.youtubePlayer.playVideo();

      return;
    }

    state.youtubePlayer.playVideo();

  } catch (error) {
    console.error(
      "Play/pause error:",
      error
    );

    showToast(
      "Unable to control playback."
    );
  }
}


// ============================================
// PLAY BUTTON UI
// ============================================

function updatePlayButton() {
  const button =
    $("#playButton");

  if (!button) {
    return;
  }

  const isPlaying =
    state.youtubeState ===
    YT_STATE.PLAYING;

  button.textContent =
    isPlaying ? "❚❚" : "▶";

  button.setAttribute(
    "aria-label",
    isPlaying
      ? "Pause"
      : "Play"
  );
}


// ============================================
// NEXT SONG
// ============================================

function playNext() {
  const tracks =
    state.searchResults;

  if (!tracks.length) {
    showToast(
      "Search for songs to use Next."
    );

    return;
  }

  if (!state.currentTrack) {
    loadTrack(
      tracks[0],
      true
    );

    return;
  }

  const currentIndex =
    tracks.findIndex(
      (track) =>
        track.id ===
        state.currentTrack.id
    );

  if (
    currentIndex === -1
  ) {
    loadTrack(
      tracks[0],
      true
    );

    return;
  }

  const nextIndex =
    currentIndex + 1;

  if (
    nextIndex >= tracks.length
  ) {
    showToast(
      "No next song available."
    );

    return;
  }

  loadTrack(
    tracks[nextIndex],
    true
  );
}


// ============================================
// PREVIOUS SONG
// ============================================

function playPrevious() {
  if (
    state.youtubePlayer &&
    state.youtubeReady
  ) {
    try {
      const currentTime =
        state.youtubePlayer
          .getCurrentTime();

      // If song has played more than 5 seconds,
      // restart the same song.
      if (
        currentTime > 5
      ) {
        state.youtubePlayer.seekTo(
          0,
          true
        );

        return;
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (
    state.previousTrack
  ) {
    const previous =
      state.previousTrack;

    state.previousTrack =
      state.currentTrack;

    loadTrack(
      previous,
      true
    );

    return;
  }

  const tracks =
    state.searchResults;

  if (!tracks.length) {
    showToast(
      "No previous song available."
    );

    return;
  }

  const currentIndex =
    tracks.findIndex(
      (track) =>
        track.id ===
        state.currentTrack?.id
    );

  if (
    currentIndex > 0
  ) {
    loadTrack(
      tracks[currentIndex - 1],
      true
    );

    return;
  }

  showToast(
    "No previous song available."
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
    YT_STATE.PLAYING
  ) {
    return;
  }

  try {
    const duration =
      state.youtubePlayer
        .getDuration();

    const current =
      state.youtubePlayer
        .getCurrentTime();

    if (
      !duration ||
      !Number.isFinite(duration)
    ) {
      return;
    }

    const percentage =
      (
        current /
        duration
      ) * 100;

    const progress =
      $("#progressBar");

    if (progress) {
      progress.value =
        Math.min(
          100,
          Math.max(
            0,
            percentage
          )
        );
    }
  } catch (error) {
    // Ignore temporary YouTube API errors.
  }
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

  try {
    const duration =
      state.youtubePlayer
        .getDuration();

    if (
      !duration ||
      !Number.isFinite(duration)
    ) {
      return;
    }

    const percentage =
      Number(value);

    const time =
      duration *
      (
        percentage / 100
      );

    state.youtubePlayer.seekTo(
      time,
      true
    );
  } catch (error) {
    console.error(
      "Seek error:",
      error
    );
  }
}


// ============================================
// PLAYER CONTROLS SETUP
// ============================================

function setupPlayerControls() {
  const playButton =
    $("#playButton");

  const nextButton =
    $("#nextButton");

  const previousButton =
    $("#previousButton");

  const progressBar =
    $("#progressBar");

  if (playButton) {
    playButton.addEventListener(
      "click",
      togglePlay
    );
  }

  if (nextButton) {
    nextButton.addEventListener(
      "click",
      playNext
    );
  }

  if (previousButton) {
    previousButton.addEventListener(
      "click",
      playPrevious
    );
  }

  if (progressBar) {
    progressBar.addEventListener(
      "input",
      (event) => {
        seekSong(
          event.target.value
        );
      }
    );
  }
}


// ============================================
// SEARCH SETUP
// ============================================

function setupSearch() {
  const searchButton =
    $("#searchButton");

  const searchInput =
    $("#searchInput");

  const clearButton =
    $("#clearSearchButton");

  if (searchButton) {
    searchButton.addEventListener(
      "click",
      openSearch
    );
  }

  if (clearButton) {
    clearButton.addEventListener(
      "click",
      clearSearch
    );
  }

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      (event) => {
        const query =
          event.target.value.trim();

        clearTimeout(
          state.searchTimer
        );

        if (!query) {
          state.searchResults =
            [];

          renderRecentSearches();

          return;
        }

        state.searchTimer =
          setTimeout(
            () => {
              searchSongs(query);
            },
            Number(
              CONFIG.SEARCH_DEBOUNCE_MS
            ) || 250
          );
      }
    );

    searchInput.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter"
        ) {
          event.preventDefault();

          const query =
            searchInput.value.trim();

          if (query) {
            searchSongs(query);
          }
        }
      }
    );
  }
}


// ============================================
// OPEN SEARCH
// ============================================

function openSearch() {
  const panel =
    $("#searchPanel");

  const button =
    $("#searchButton");

  const input =
    $("#searchInput");

  if (!panel) {
    return;
  }

  panel.hidden = false;

  if (button) {
    button.hidden = true;

    button.setAttribute(
      "aria-expanded",
      "true"
    );
  }

  const background =
    $("#background");

  if (background) {
    background.style.filter =
      "blur(3px)";
  }

  renderRecentSearches();

  if (input) {
    setTimeout(
      () => input.focus(),
      50
    );
  }
}


// ============================================
// CLOSE SEARCH
// ============================================

function closeSearch() {
  const panel =
    $("#searchPanel");

  const button =
    $("#searchButton");

  if (!panel) {
    return;
  }

  panel.hidden = true;

  if (button) {
    button.hidden = false;

    button.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  const background =
    $("#background");

  if (background) {
    background.style.filter =
      "";
  }
}


// ============================================
// GLOBAL CLICK HANDLING
// ============================================

function setupGlobalClicks() {
  document.addEventListener(
    "click",
    (event) => {
      const panel =
        $("#searchPanel");

      const container =
        $("#searchContainer");

      if (
        !panel ||
        panel.hidden ||
        !container
      ) {
        return;
      }

      if (
        !container.contains(
          event.target
        )
      ) {
        closeSearch();
      }
    }
  );
}


// ============================================
// BROWSER BACK / ESCAPE
// ============================================

function setupBrowserBack() {
  window.addEventListener(
    "popstate",
    () => {
      const panel =
        $("#searchPanel");

      if (
        panel &&
        !panel.hidden
      ) {
        closeSearch();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape"
      ) {
        const panel =
          $("#searchPanel");

        if (
          panel &&
          !panel.hidden
        ) {
          closeSearch();
        }

        if (
          state.lyricsVisible
        ) {
          hideLyrics();
        }
      }
    }
  );
}


// ============================================
// CLEAR SEARCH
// ============================================

function clearSearch() {
  const input =
    $("#searchInput");

  const results =
    $("#searchResults");

  if (input) {
    input.value = "";
  }

  state.searchResults =
    [];

  if (results) {
    results.innerHTML =
      "";
  }

  renderRecentSearches();

  if (input) {
    input.focus();
  }
}


// ============================================
// YOUTUBE SEARCH
// ============================================

async function searchSongs(query) {
  query =
    String(query || "").trim();

  if (!query) {
    return;
  }

  const requestId =
    ++state.searchRequestId;

  const resultsContainer =
    $("#searchResults");

  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML =
    createLoadingSkeleton();

  // Check API key
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
          CONFIG.REGION_CODE ||
          "IN",
        relevanceLanguage:
          CONFIG.RELEVANCE_LANGUAGE ||
          "hi",
        videoEmbeddable: "true"
      });

    const url =
      "https://www.googleapis.com/youtube/v3/search?" +
      params.toString() +
      "&key=" +
      encodeURIComponent(
        CONFIG.YOUTUBE_API_KEY
      );

    const response =
      await fetch(url);

    if (
      requestId !==
      state.searchRequestId
    ) {
      return;
    }

    if (!response.ok) {
      let errorMessage =
        `Search failed: ${response.status}`;

      try {
        const errorData =
          await response.json();

        const apiMessage =
          errorData?.error?.message;

        if (apiMessage) {
          errorMessage =
            apiMessage;
        }
      } catch (error) {
        // Ignore JSON parsing error.
      }

      throw new Error(
        errorMessage
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
          (item) =>
            item?.id?.videoId &&
            item?.snippet
        )
        .map(
          (item) => {
            const snippet =
              item.snippet;

            return {
              id:
                item.id.videoId,

              title:
                cleanText(
                  snippet.title
                ),

              artist:
                cleanText(
                  snippet.channelTitle
                ),

              artwork:
                snippet.thumbnails
                  ?.high?.url ||
                snippet.thumbnails
                  ?.medium?.url ||
                snippet.thumbnails
                  ?.default?.url ||
                "assets/default-art.svg",

              source:
                "youtube"
            };
          }
        );

    state.searchResults =
      tracks;

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
    if (
      requestId !==
      state.searchRequestId
    ) {
      return;
    }

    console.error(
      "YouTube search error:",
      error
    );

    resultsContainer.innerHTML = `
      <div class="search-message">
        <strong>Search unavailable</strong>
        <br>
        ${escapeHtml(
          error.message ||
          "Please try again."
        )}
      </div>
    `;
  }
}


// ============================================
// CLEAN TEXT
// ============================================

function cleanText(text) {
  const temp =
    document.createElement(
      "div"
    );

  temp.textContent =
    String(text || "");

  return temp.textContent;
}


// ============================================
// SEARCH RESULTS
// ============================================

function renderSearchResults(
  tracks
) {
  const container =
    $("#searchResults");

  if (!container) {
    return;
  }

  container.innerHTML =
    "";

  tracks.forEach(
    (track, index) => {
      const result =
        document.createElement(
          "button"
        );

      result.type =
        "button";

      result.className =
        "search-result";

      result.style.animationDelay =
        `${index * 25}ms`;

      const image =
        document.createElement(
          "img"
        );

      image.src =
        track.artwork ||
        "assets/default-art.svg";

      image.alt =
        "";

      image.loading =
        "lazy";

      image.onerror =
        () => {
          image.src =
            "assets/default-art.svg";
        };

      const information =
        document.createElement(
          "div"
        );

      const title =
        document.createElement(
          "div"
        );

      title.className =
        "search-result-title";

      title.textContent =
        track.title;

      const artist =
        document.createElement(
          "div"
        );

      artist.className =
        "search-result-artist";

      artist.textContent =
        track.artist;

      information.appendChild(
        title
      );

      information.appendChild(
        artist
      );

      result.appendChild(
        image
      );

      result.appendChild(
        information
      );

      result.addEventListener(
        "click",
        () => {
          const searchInput =
            $("#searchInput");

          addRecentSearch(
            searchInput
              ? searchInput.value
              : ""
          );

          loadTrack(
            track,
            false
          );

          showToast(
            "Song loaded"
          );

          // Keep search panel open
          // so user can choose another song.
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
  const container =
    $("#searchResults");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="search-message">
      <strong>No results found</strong>
      <br>
      Try another song or artist.
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
    String(query || "").trim();

  if (!query) {
    return;
  }

  state.recentSearches = [
    query,

    ...state.recentSearches.filter(
      (item) =>
        String(item).toLowerCase() !==
        query.toLowerCase()
    )
  ];

  const maxItems =
    window.innerWidth < 600
      ? 6
      : 12;

  state.recentSearches =
    state.recentSearches.slice(
      0,
      maxItems
    );

  try {
    localStorage.setItem(
      "relaxify_recent_searches",
      JSON.stringify(
        state.recentSearches
      )
    );
  } catch (error) {
    console.error(
      "Could not save recent searches:",
      error
    );
  }

  renderRecentSearches();
}


// ============================================
// RENDER RECENT SEARCHES
// ============================================

function renderRecentSearches() {
  const container =
    $("#searchResults");

  const input =
    $("#searchInput");

  if (!container) {
    return;
  }

  if (
    input &&
    input.value.trim()
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

      item.type =
        "button";

      item.className =
        "recent-search";

      const text =
        document.createElement(
          "span"
        );

      text.textContent =
        query;

      const deleteButton =
        document.createElement(
          "span"
        );

      deleteButton.className =
        "recent-delete";

      deleteButton.textContent =
        "✕";

      deleteButton.title =
        "Delete";

      item.appendChild(
        text
      );

      item.appendChild(
        deleteButton
      );

      item.addEventListener(
        "click",
        (event) => {
          if (
            event.target ===
            deleteButton
          ) {
            event.stopPropagation();

            deleteRecentSearch(
              query
            );

            return;
          }

          if (input) {
            input.value =
              query;
          }

          searchSongs(
            query
          );
        }
      );

      list.appendChild(
        item
      );
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
    state.recentSearches.filter(
      (item) =>
        item !== query
    );

  try {
    localStorage.setItem(
      "relaxify_recent_searches",
      JSON.stringify(
        state.recentSearches
      )
    );
  } catch (error) {
    console.error(error);
  }

  renderRecentSearches();
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {
  return String(value)
    .replace(
      /[&<>"']/g,
      (character) => {
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


// ============================================
// LYRICS
// ============================================

function setupLyrics() {
  const button =
    $("#lyricsButton");

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    toggleLyrics
  );
}


// ============================================
// TOGGLE LYRICS
// ============================================

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
      "Lyrics unavailable for this song."
    );

    return;
  }

  showLyrics();
}


// ============================================
// SHOW LYRICS
// ============================================

function showLyrics() {
  const area =
    $("#lyricsArea");

  if (!area) {
    return;
  }

  area.innerHTML =
    "";

  state.lyrics.forEach(
    (line, index) => {
      const div =
        document.createElement(
          "div"
        );

      div.className =
        "lyric-line";

      div.textContent =
        typeof line === "string"
          ? line
          : line.text || "";

      if (
        index === 0
      ) {
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

  area.style.opacity =
    "1";

  startLyricsClock();
}


// ============================================
// HIDE LYRICS
// ============================================

function hideLyrics() {
  const area =
    $("#lyricsArea");

  state.lyricsVisible =
    false;

  clearInterval(
    state.lyricTimer
  );

  if (!area) {
    return;
  }

  area.style.opacity =
    "0";

  setTimeout(
    () => {
      if (
        !state.lyricsVisible
      ) {
        area.innerHTML =
          "";

        area.style.opacity =
          "";
      }
    },
    250
  );
}


// ============================================
// SET LYRICS
// ============================================

function setLyrics(
  lyrics
) {
  if (
    !Array.isArray(lyrics)
  ) {
    state.lyrics = [];
    return;
  }

  state.lyrics =
    lyrics;

  if (
    state.lyricsVisible
  ) {
    showLyrics();
  }
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
          YT_STATE.PLAYING
        ) {
          return;
        }

        let currentTime = 0;

        try {
          currentTime =
            state.youtubePlayer
              .getCurrentTime();
        } catch (error) {
          return;
        }

        let activeIndex =
          0;

        state.lyrics.forEach(
          (line, index) => {
            const time =
              typeof line ===
              "string"
                ? 0
                : Number(
                    line.time || 0
                  );

            if (
              time <=
              currentTime
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
            (
              element,
              index
            ) => {
              element.classList.toggle(
                "active",
                index ===
                  activeIndex
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

  if (!toast) {
    return;
  }

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
      2500
    );
}


// ============================================
// PUBLIC HELPERS
// ============================================

// These can be used later by another script
// to add lyrics dynamically.

window.RELAXIFY = {
  loadTrack,
  searchSongs,
  setLyrics,
  showLyrics,
  hideLyrics,
  playNext,
  playPrevious,
  togglePlay
};
