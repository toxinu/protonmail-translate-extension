// Background script — handles translation API requests on behalf of the content script

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
const DEEPL_DEFAULT_URL = "https://api-free.deepl.com/";
const LIBRETRANSLATE_DEFAULT_URL = "https://libretranslate.com/";
const LINGVA_DEFAULT_URL = "https://lingva.ml/";

function translateWithGoogle(text, sourceLang, targetLang) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: sourceLang,
    tl: targetLang,
    dt: "t",
    q: text,
  });

  const url = `${GOOGLE_TRANSLATE_URL}?${params}`;
  console.log(`[Protonmail Translate] Google Translate GET ${url}`);

  return fetch(url)
    .then((resp) => {
      console.log(`[Protonmail Translate] Google Translate response: ${resp.status}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    })
    .then((data) => {
      return data[0].map((segment) => segment[0]).join("");
    });
}

function translateWithDeepL(text, sourceLang, targetLang, apiUrl, apiKey) {
  const baseUrl = (apiUrl || DEEPL_DEFAULT_URL).replace(/\/+$/, "");

  const params = new URLSearchParams({
    text: text,
    target_lang: targetLang.toUpperCase(),
  });
  if (sourceLang && sourceLang !== "auto") {
    params.set("source_lang", sourceLang.toUpperCase());
  }

  const url = `${baseUrl}/v2/translate`;
  console.log(`[Protonmail Translate] DeepL POST ${url}`);

  return fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
    .then((resp) => {
      console.log(`[Protonmail Translate] DeepL response: ${resp.status}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    })
    .then((data) => {
      return data.translations.map((t) => t.text).join("");
    });
}

function translateWithLibreTranslate(text, sourceLang, targetLang, apiUrl, apiKey) {
  const baseUrl = (apiUrl || LIBRETRANSLATE_DEFAULT_URL).replace(/\/+$/, "");

  const body = {
    q: text,
    source: sourceLang,
    target: targetLang,
    format: "text",
  };
  if (apiKey) {
    body.api_key = apiKey;
  }

  const url = `${baseUrl}/translate`;
  console.log(`[Protonmail Translate] LibreTranslate POST ${url}`, body);

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((resp) => {
      console.log(`[Protonmail Translate] LibreTranslate response: ${resp.status}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    })
    .then((data) => {
      return data.translatedText;
    });
}

function translateWithLingva(text, sourceLang, targetLang, apiUrl) {
  const baseUrl = (apiUrl || LINGVA_DEFAULT_URL).replace(/\/+$/, "");
  const encodedText = encodeURIComponent(text);

  const url = `${baseUrl}/api/v1/${sourceLang}/${targetLang}/${encodedText}`;
  console.log(`[Protonmail Translate] Lingva GET ${url}`);

  return fetch(url)
    .then((resp) => {
      console.log(`[Protonmail Translate] Lingva response: ${resp.status}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    })
    .then((data) => {
      return data.translation;
    });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "translate") return;

  const {
    text,
    sourceLang,
    targetLang,
    translationApi,
    deeplApiKey,
    deeplUrl,
    libreTranslateUrl,
    libreTranslateApiKey,
    lingvaUrl,
    fallbackToGoogle,
  } = message;

  const api = translationApi || "google";
  console.log(`[Protonmail Translate] Request: api=${api}, ${sourceLang} → ${targetLang}, text length=${text.length}`);

  let translationPromise;
  if (api === "deepl") {
    translationPromise = translateWithDeepL(text, sourceLang, targetLang, deeplUrl, deeplApiKey);
  } else if (api === "lingva") {
    translationPromise = translateWithLingva(text, sourceLang, targetLang, lingvaUrl);
  } else if (api === "libretranslate") {
    translationPromise = translateWithLibreTranslate(
      text,
      sourceLang,
      targetLang,
      libreTranslateUrl,
      libreTranslateApiKey
    );
  } else {
    translationPromise = translateWithGoogle(text, sourceLang, targetLang);
  }

  if (fallbackToGoogle && api !== "google") {
    translationPromise = translationPromise.catch((err) => {
      console.warn(`[Protonmail Translate] ${api} failed: ${err.message}, falling back to Google Translate`);
      return translateWithGoogle(text, sourceLang, targetLang);
    });
  }

  translationPromise
    .then((translation) => {
      console.log(`[Protonmail Translate] Success: translation length=${translation.length}`);
      sendResponse({ ok: true, translation });
    })
    .catch((err) => {
      console.error(`[Protonmail Translate] Error:`, err.message);
      sendResponse({ ok: false, error: err.message });
    });

  // Return true to indicate we will call sendResponse asynchronously
  return true;
});
