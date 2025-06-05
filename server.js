const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

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
  console.log('🔍 Raw input cookie:', rawCookie);

  if (!rawCookie) return { error: 'No cookie provided.' };

  const cookie = rawCookie.replace(/\s/g, '');
  console.log('🔧 Cleaned cookie:', cookie);

  if (!cookie.includes('_|') && !cookie.startsWith('.ROBLOSECURITY=')) {
    return { error: 'Invalid or missing cookie format.' };
  }

  try {
    const csrfToken = await getCSRFToken(cookie);

    const ticketResponse = await axios.post('https://auth.roblox.com/v1/authentication-ticket', {}, {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'x-csrf-token': csrfToken,
        'Referer': 'https://www.roblox.com',
        'Origin': 'https://www.roblox.com'
      }
    });

    const ticket = ticketResponse.headers['rbx-authentication-ticket'];
    if (!ticket) {
      return { error: 'Failed to retrieve authentication ticket' };
    }

    const finalResponse = await axios.post('https://auth.roblox.com/v1/authentication-ticket/redeem', {
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

    const setCookieHeader = finalResponse.headers['set-cookie'] || [];
    const newCookie = setCookieHeader.find(c => c.includes('.ROBLOSECURITY='));
    if (!newCookie) {
      return { error: 'Failed to extract new cookie from response.' };
    }

    const extracted = newCookie.match(/\.ROBLOSECURITY=([^;]+)/);
    if (!extracted) {
      return { error: 'Could not parse refreshed cookie.' };
    }

    // ✅ Return raw extracted cookie only, no added "_|"
    return { cookie: extracted[1] };

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
