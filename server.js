const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

function getCSRFToken(cookie) {
  return axios.post('https://auth.roblox.com/v2/login', {}, {
    headers: {
      'Cookie': `.ROBLOSECURITY=${cookie}`
    }
  }).catch(error => {
    const token = error.response?.headers['x-csrf-token'];
    if (!token) throw new Error('Failed to get CSRF token.');
    return token;
  });
}

async function refreshCookie(rawCookie) {
  if (!rawCookie) return { error: 'No cookie provided.' };

  const cookie = rawCookie.replace(/\s/g, '');
  if (!cookie.includes('_|') && !cookie.startsWith('.ROBLOSECURITY=')) {
    return { error: 'Invalid or missing cookie format.' };
  }

  try {
    const csrfToken = await getCSRFToken(cookie);

    const ticketRes = await axios.post('https://auth.roblox.com/v1/authentication-ticket', {}, {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'x-csrf-token': csrfToken,
        'Referer': 'https://www.roblox.com',
        'Origin': 'https://www.roblox.com'
      }
    });

    const ticket = ticketRes.headers['rbx-authentication-ticket'];
    if (!ticket) return { error: 'Failed to retrieve authentication ticket.' };

    const finalRes = await axios.post('https://auth.roblox.com/v1/authentication-ticket/redeem', {
      authenticationTicket: ticket
    }, {
      headers: {
        'x-csrf-token': csrfToken,
        'Referer': 'https://www.roblox.com',
        'Origin': 'https://www.roblox.com',
        'Content-Type': 'application/json',
        'RBXAuthenticationNegotiation': '1'
      },
      withCredentials: true
    });

    const setCookie = finalRes.headers['set-cookie'] || [];
    const newCookieLine = setCookie.find(c => c.includes('.ROBLOSECURITY='));
    if (!newCookieLine) return { error: 'Failed to extract new cookie from response.' };

    const extracted = newCookieLine.match(/\.ROBLOSECURITY=([^;]+)/);
    if (!extracted) return { error: 'Could not parse refreshed cookie.' };

    const refreshed = extracted[1].startsWith('_|')
      ? extracted[1]
      : '_|' + extracted[1];

    return { cookie: refreshed };
  } catch (error) {
    return { error: error.message || 'Unknown error occurred.' };
  }
}

app.get('/refresh', async (req, res) => {
  const input = req.query.cookie || '';
  const result = await refreshCookie(input);
  res.json(result);
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
