const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/refresh', (req, res) => {
  const inputCookie = req.query.cookie;

  if (!inputCookie || !inputCookie.includes('.ROBLOSECURITY')) {
    return res.status(400).json({ error: 'Invalid cookie format.' });
  }

  const options = {
    hostname: 'auth.roblox.com',
    path: '/v2/logout',
    method: 'POST',
    headers: {
      'Cookie': `.ROBLOSECURITY=${inputCookie}`,
      'User-Agent': 'Roblox/WinInet',
    }
  };

  const request = https.request(options, (response) => {
    const newCookieLine = response.headers['set-cookie']?.find(c => c.includes('.ROBLOSECURITY'));
    if (!newCookieLine) {
      return res.status(401).json({ error: 'Cookie refresh failed (no Set-Cookie).' });
    }

    const extracted = newCookieLine.match(/\.ROBLOSECURITY=([^;]+)/);
    if (!extracted || !extracted[1]) {
      return res.status(401).json({ error: 'Failed to parse refreshed cookie.' });
    }

    let refreshed = extracted[1].trim();
    if (refreshed.startsWith('_|') || refreshed.startsWith('_||_')) {
      refreshed = refreshed.replace(/^(_\|)+/, '_|'); // Clean to exactly one _|
    } else {
      refreshed = '_|' + refreshed;
    }

    return res.json({ cookie: refreshed });
  });

  request.on('error', (err) => {
    console.error('HTTPS error:', err);
    return res.status(500).json({ error: 'Server error during refresh.' });
  });

  request.end();
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
