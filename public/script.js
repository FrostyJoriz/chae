const inputField = document.getElementById("cookieInput");
const outputArea = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");
const refreshBtn = document.getElementById("refreshBtn");
const message = document.getElementById("message");

refreshBtn.addEventListener("click", async () => {
  const rawCookie = inputField.value.trim();

  if (!rawCookie) {
    message.textContent = "❌ Please enter a cookie.";
    message.style.color = "red";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/refresh?cookie=${encodeURIComponent(rawCookie)}`);
    const data = await response.json();

    if (data.cookie) {
      outputArea.value = data.cookie;
      message.textContent = "✅ Cookie refreshed successfully.";
      message.style.color = "limegreen";
    } else {
      throw new Error(data.error || "Unknown error");
    }
  } catch (err) {
    outputArea.value = "";
    message.textContent = "❌ " + err.message;
    message.style.color = "red";
  }
});

copyBtn.addEventListener("click", () => {
  if (!outputArea.value) return;

  outputArea.select();
  document.execCommand("copy");

  message.textContent = "📋 Copied to clipboard.";
  message.style.color = "blueviolet";
});
