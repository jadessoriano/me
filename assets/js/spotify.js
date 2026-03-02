// Spotify Integration
// -------------------
// 1. Go to https://developer.spotify.com/dashboard and create an app
// 2. Set redirect URI to: https://localhost (or your site URL)
// 3. Fill in your credentials below
// 4. Run the one-time auth flow (see getRefreshToken below) to get a refresh token

const SPOTIFY_CLIENT_ID = 'YOUR_CLIENT_ID';
const SPOTIFY_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const SPOTIFY_REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

async function getAccessToken() {
  var basic = btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET);
  var response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + basic,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(SPOTIFY_REFRESH_TOKEN),
  });
  var data = await response.json();
  return data.access_token;
}

async function getNowPlaying() {
  var token = await getAccessToken();
  var headers = { 'Authorization': 'Bearer ' + token };

  // Try currently playing first
  var response = await fetch(NOW_PLAYING_ENDPOINT, { headers: headers });

  if (response.status === 200) {
    var data = await response.json();
    if (data.item) {
      return {
        isPlaying: data.is_playing,
        track: data.item.name,
        artist: data.item.artists.map(function(a) { return a.name; }).join(', '),
        url: data.item.external_urls.spotify,
      };
    }
  }

  // Fallback to recently played
  response = await fetch(RECENTLY_PLAYED_ENDPOINT, { headers: headers });
  if (response.status === 200) {
    var data = await response.json();
    if (data.items && data.items.length > 0) {
      var item = data.items[0].track;
      var playedAt = new Date(data.items[0].played_at);
      return {
        isPlaying: false,
        track: item.name,
        artist: item.artists.map(function(a) { return a.name; }).join(', '),
        url: item.external_urls.spotify,
        playedAt: playedAt,
      };
    }
  }

  return null;
}

function timeAgo(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  var minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  var days = Math.floor(hours / 24);
  return days + 'd ago';
}

async function updateNowPlaying() {
  try {
    var data = await getNowPlaying();
    if (!data) return;

    var trackEl = document.querySelector('.track-name');
    var artistEl = document.querySelector('.artist-name');
    var statusEl = document.querySelector('.listen-status');
    var linkEl = document.querySelector('.now-playing-link');

    if (trackEl) trackEl.textContent = data.track;
    if (artistEl) artistEl.textContent = data.artist;

    if (statusEl) {
      if (data.isPlaying) {
        statusEl.textContent = 'Now playing';
      } else if (data.playedAt) {
        statusEl.textContent = timeAgo(data.playedAt);
      } else {
        statusEl.textContent = 'Recently played';
      }
    }

    if (linkEl && data.url) {
      linkEl.href = data.url;
    }
  } catch (e) {
    // Silently fail — keep the static fallback
  }
}

// Run on load and refresh every 30 seconds
if (SPOTIFY_CLIENT_ID !== 'YOUR_CLIENT_ID') {
  updateNowPlaying();
  setInterval(updateNowPlaying, 30000);
}
