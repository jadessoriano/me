export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

  var clientId = process.env.SPOTIFY_CLIENT_ID;
  var clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  var refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(500).json({ error: 'Missing Spotify credentials' });
  }

  try {
    // Get access token
    var basic = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    var tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + basic,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(refreshToken),
    });

    var tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get access token' });
    }

    var headers = { 'Authorization': 'Bearer ' + tokenData.access_token };

    // Try currently playing
    var nowRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: headers });

    if (nowRes.status === 200) {
      var now = await nowRes.json();
      if (now.item) {
        return res.status(200).json({
          isPlaying: now.is_playing,
          track: now.item.name,
          artist: now.item.artists.map(function(a) { return a.name; }).join(', '),
          url: now.item.external_urls.spotify,
        });
      }
    }

    // Fallback to recently played
    var recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers: headers });

    if (recentRes.status === 200) {
      var recent = await recentRes.json();
      if (recent.items && recent.items.length > 0) {
        var item = recent.items[0].track;
        return res.status(200).json({
          isPlaying: false,
          track: item.name,
          artist: item.artists.map(function(a) { return a.name; }).join(', '),
          url: item.external_urls.spotify,
          playedAt: recent.items[0].played_at,
        });
      }
    }

    return res.status(200).json({ error: 'No track data' });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error' });
  }
}
