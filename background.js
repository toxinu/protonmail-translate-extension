// Background script — handles translation API requests on behalf of the content script

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "translate") return;

  const params = new URLSearchParams({
    client: "gtx",
    sl: message.sourceLang,
    tl: message.targetLang,
    dt: "t",
    q: message.text,
  });

  fetch(`${GOOGLE_TRANSLATE_URL}?${params}`)
    .then((resp) => {
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    })
    .then((data) => {
      const translation = data[0].map((segment) => segment[0]).join("");
      sendResponse({ ok: true, translation });
    })
    .catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });

  // Return true to indicate we will call sendResponse asynchronously
  return true;
});
