const sourceLangSelect = document.getElementById("sourceLang");
const targetLangSelect = document.getElementById("targetLang");
const translationApiSelect = document.getElementById("translationApi");
const libreTranslateSettings = document.getElementById("libreTranslateSettings");
const libreTranslateUrlInput = document.getElementById("libreTranslateUrl");
const libreTranslateApiKeyInput = document.getElementById("libreTranslateApiKey");
const deeplSettings = document.getElementById("deeplSettings");
const deeplApiKeyInput = document.getElementById("deeplApiKey");
const deeplUrlInput = document.getElementById("deeplUrl");
const lingvaSettings = document.getElementById("lingvaSettings");
const lingvaUrlInput = document.getElementById("lingvaUrl");
const fallbackSettings = document.getElementById("fallbackSettings");
const fallbackToGoogleCheckbox = document.getElementById("fallbackToGoogle");
const status = document.getElementById("status");

function showSaved() {
  status.textContent = "[ok] config saved";
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
}

function updateApiSettingsVisibility() {
  const api = translationApiSelect.value;
  deeplSettings.style.display = api === "deepl" ? "block" : "none";
  libreTranslateSettings.style.display = api === "libretranslate" ? "block" : "none";
  lingvaSettings.style.display = api === "lingva" ? "block" : "none";
  fallbackSettings.style.display = api !== "google" ? "block" : "none";
}

// Load saved preferences
browser.storage.local
  .get([
    "sourceLang",
    "targetLang",
    "translationApi",
    "deeplApiKey",
    "deeplUrl",
    "libreTranslateUrl",
    "libreTranslateApiKey",
    "lingvaUrl",
    "fallbackToGoogle",
  ])
  .then((result) => {
    if (result.sourceLang) sourceLangSelect.value = result.sourceLang;
    if (result.targetLang) targetLangSelect.value = result.targetLang;
    if (result.translationApi) translationApiSelect.value = result.translationApi;
    if (result.deeplApiKey) deeplApiKeyInput.value = result.deeplApiKey;
    if (result.deeplUrl) deeplUrlInput.value = result.deeplUrl;
    if (result.libreTranslateUrl) libreTranslateUrlInput.value = result.libreTranslateUrl;
    if (result.libreTranslateApiKey) libreTranslateApiKeyInput.value = result.libreTranslateApiKey;
    if (result.lingvaUrl) lingvaUrlInput.value = result.lingvaUrl;
    fallbackToGoogleCheckbox.checked = !!result.fallbackToGoogle;
    updateApiSettingsVisibility();
  });

// Save on change
sourceLangSelect.addEventListener("change", () => {
  browser.storage.local.set({ sourceLang: sourceLangSelect.value }).then(showSaved);
});

targetLangSelect.addEventListener("change", () => {
  browser.storage.local.set({ targetLang: targetLangSelect.value }).then(showSaved);
});

translationApiSelect.addEventListener("change", () => {
  updateApiSettingsVisibility();
  browser.storage.local.set({ translationApi: translationApiSelect.value }).then(showSaved);
});

deeplApiKeyInput.addEventListener("change", () => {
  browser.storage.local.set({ deeplApiKey: deeplApiKeyInput.value }).then(showSaved);
});

deeplUrlInput.addEventListener("change", () => {
  browser.storage.local.set({ deeplUrl: deeplUrlInput.value }).then(showSaved);
});

libreTranslateUrlInput.addEventListener("change", () => {
  browser.storage.local.set({ libreTranslateUrl: libreTranslateUrlInput.value }).then(showSaved);
});

libreTranslateApiKeyInput.addEventListener("change", () => {
  browser.storage.local
    .set({ libreTranslateApiKey: libreTranslateApiKeyInput.value })
    .then(showSaved);
});

lingvaUrlInput.addEventListener("change", () => {
  browser.storage.local.set({ lingvaUrl: lingvaUrlInput.value }).then(showSaved);
});

fallbackToGoogleCheckbox.addEventListener("change", () => {
  browser.storage.local.set({ fallbackToGoogle: fallbackToGoogleCheckbox.checked }).then(showSaved);
});
