async function refreshCookie() {
  const input = document.getElementById('cookieInput').value.trim();
  const resultBox = document.getElementById('result');
  const errorBox = document.getElementById('error');

  resultBox.value = '';
  errorBox.textContent = '';

  try {
    const res = await fetch(`https://chaebol.onrender.com/refresh?cookie=${encodeURIComponent(input)}`);
    const data = await res.json();

    if (data.cookie) {
      resultBox.value = data.cookie;
    } else {
      errorBox.textContent = `❌ ${data.error || 'Failed to refresh cookie.'}`;
    }
  } catch (err) {
    errorBox.textContent = `❌ Request failed with status code ${err?.status || 401}`;
  }
}

function copyToClipboard() {
  const text = document.getElementById('result').value;
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  });
}
