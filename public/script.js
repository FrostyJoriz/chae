document.getElementById("refreshBtn").addEventListener("click", async () => {
  const input = document.getElementById("cookieInput").value.trim();

  if (!input) {
    showStatus("Please enter a cookie first.", true);
    return;
  }

  try {
    const response = await fetch(`/refresh?cookie=${encodeURIComponent(input)}`);
    const data = await response.text();

    if (!response.ok) {
      showStatus(`❌ Request failed with status code ${response.status}`, true);
      return;
    }

    // Ensure the output has exactly one _| prefix
    const cleaned = data.replace(/^(_\|)+/, ""); // remove any existing _|
    const result = "_|".concat(cleaned);         // add only one _|

    document.getElementById("output").value = result;
    showStatus("✅ Cookie refreshed successfully!");
  } catch (err) {
    showStatus(`❌ Error: ${err.message}`, true);
  }
});

document.getElementById("copyBtn").addEventListener("click", () => {
  const output = document.getElementById("output");
  output.select();
  document.execCommand("copy");
  showStatus("✅ Copied to clipboard!");
});

function showStatus(msg, isError = false) {
  const el = document.getElementById("statusText");
  el.textContent = msg;
  el.style.color = isError ? "red" : "lime";
}
