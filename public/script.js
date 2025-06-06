const refreshBtn = document.getElementById('refreshBtn');
const cookieInput = document.getElementById('cookieInput');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const statusText = document.getElementById('statusText');

refreshBtn.addEventListener('click', async () => {
  const rawCookie = cookieInput.value.trim();
  if (!rawCookie) {
    statusText.innerText = '⚠️ Please enter a cookie.';
    return;
  }

  try {
    statusText.innerText = '⏳ Refreshing...';
    const res = await fetch(`/refresh?cookie=${encodeURIComponent(rawCookie)}`);
    const result = await res.json();

    if (result.cookie) {
      // ✅ Fix to avoid duplicating _l|
      output.value = result.cookie.startsWith('_l|') ? result.cookie : '_l|' + result.cookie;
      statusText.innerText = '✅ Refreshed successfully!';
    } else {
      output.value = '';
      statusText.innerText = `❌ ${result.error || 'Failed to refresh cookie.'}`;
    }
  } catch (err) {
    statusText.innerText = '❌ Request failed.';
    console.error(err);
  }
});

copyBtn.addEventListener('click', () => {
  output.select();
  document.execCommand('copy');
  statusText.innerText = '📋 Copied to clipboard!';
});
