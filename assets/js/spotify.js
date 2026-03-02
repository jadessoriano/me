// Spotify Integration via Vercel serverless function
// Credentials are stored as Vercel environment variables — not in this file.

var SPOTIFY_API = '/api/spotify';

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
    var response = await fetch(SPOTIFY_API);
    if (!response.ok) return;

    var data = await response.json();
    if (data.error || !data.track) return;

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
        statusEl.textContent = timeAgo(new Date(data.playedAt));
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

updateNowPlaying();
setInterval(updateNowPlaying, 30000);
