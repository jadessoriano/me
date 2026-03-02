// Spotify Integration via Vercel serverless function

var SPOTIFY_API = window.location.hostname.includes('github.io')
  ? 'https://me-kz6e.vercel.app/api/spotify'
  : '/api/spotify';

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

function formatMs(ms) {
  var totalSeconds = Math.floor(ms / 1000);
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

async function updateNowPlaying() {
  try {
    var response = await fetch(SPOTIFY_API);
    if (!response.ok) return;

    var data = await response.json();
    if (data.error || !data.track) return;

    var trackEl = document.querySelector('.track-name');
    var artistEl = document.querySelector('.artist-name');
    var albumEl = document.querySelector('.album-name');
    var statusEl = document.querySelector('.listen-status');
    var linkEl = document.querySelector('.now-playing-link');
    var artEl = document.querySelector('.album-art');
    var progressEl = document.querySelector('.progress-fill');
    var currentTimeEl = document.querySelector('.time-current');
    var durationEl = document.querySelector('.time-duration');

    if (trackEl) trackEl.textContent = data.track;
    if (artistEl) artistEl.textContent = data.artist;
    if (albumEl) albumEl.textContent = data.album || '';

    // Album art + ambient glow
    var ambientEl = document.querySelector('.album-art-ambient');
    if (artEl && data.albumArt) {
      artEl.src = data.albumArt;
      artEl.alt = data.album || data.track;
      artEl.onload = function() {
        artEl.classList.add('loaded');
        if (ambientEl) {
          ambientEl.src = data.albumArt;
          ambientEl.onload = function() { ambientEl.classList.add('loaded'); };
        }
      };
    }

    // Ripple effect when playing
    var ripples = document.querySelectorAll('.ripple');
    ripples.forEach(function(r) {
      if (data.isPlaying) {
        r.classList.add('active');
      } else {
        r.classList.remove('active');
      }
    });

    // Extract accent color for ripple from album art
    if (artEl && data.albumArt && data.isPlaying) {
      try {
        var canvas = document.createElement('canvas');
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
          canvas.width = 1;
          canvas.height = 1;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 1, 1);
          var px = ctx.getImageData(0, 0, 1, 1).data;
          var color = 'rgba(' + px[0] + ',' + px[1] + ',' + px[2] + ',0.5)';
          ripples.forEach(function(r) { r.style.setProperty('--ripple-color', color); });
        };
        img.src = data.albumArt;
      } catch (e) {}
    }

    // Progress bar and time
    if (data.durationMs) {
      var progress = data.progressMs ? (data.progressMs / data.durationMs) * 100 : 0;
      if (progressEl) progressEl.style.width = progress + '%';
      if (currentTimeEl) currentTimeEl.textContent = formatMs(data.progressMs || 0);
      if (durationEl) durationEl.textContent = formatMs(data.durationMs);
    }

    // Status
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
