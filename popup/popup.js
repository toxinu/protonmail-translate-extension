const sourceLangSelect = document.getElementById("sourceLang");
const targetLangSelect = document.getElementById("targetLang");
const status = document.getElementById("status");

function showSaved() {
  status.textContent = "Saved!";
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
}

// Load saved preferences
browser.storage.local.get(["sourceLang", "targetLang"]).then((result) => {
  if (result.sourceLang) sourceLangSelect.value = result.sourceLang;
  if (result.targetLang) targetLangSelect.value = result.targetLang;
});

// Save on change
sourceLangSelect.addEventListener("change", () => {
  browser.storage.local.set({ sourceLang: sourceLangSelect.value }).then(showSaved);
});

targetLangSelect.addEventListener("change", () => {
  browser.storage.local.set({ targetLang: targetLangSelect.value }).then(showSaved);
});
