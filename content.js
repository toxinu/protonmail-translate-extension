// Protonmail Translate - Content Script
// Injects a "Translate" item into the Protonmail message dropdown menu

// SVG icon for the translate menu item (globe icon)
function createTranslateIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 256 256");
  svg.setAttribute("class", "icon-size-4 mr-2");
  svg.setAttribute("role", "img");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "6");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("d", "M235.57178,214.21094l-56-112a4.00006,4.00006,0,0,0-7.15528,0l-22.854,45.708a92.04522,92.04522,0,0,1-55.57275-20.5752A99.707,99.707,0,0,0,123.90723,60h28.08691a4,4,0,0,0,0-8h-60V32a4,4,0,0,0-8,0V52h-60a4,4,0,0,0,0,8h91.90772a91.74207,91.74207,0,0,1-27.91895,62.03357A91.67371,91.67371,0,0,1,65.23389,86.667a4,4,0,0,0-7.542,2.668,99.63009,99.63009,0,0,0,24.30469,38.02075A91.5649,91.5649,0,0,1,23.99414,148a4,4,0,0,0,0,8,99.54451,99.54451,0,0,0,63.99951-23.22461,100.10427,100.10427,0,0,0,57.65479,22.97192L116.4165,214.21094a4,4,0,1,0,7.15528,3.57812L138.46631,188H213.522l14.89453,29.78906a4,4,0,1,0,7.15528-3.57812ZM142.46631,180l33.52783-67.05566L209.522,180Z");
  svg.appendChild(path);
  return svg;
}
/**
 * Translate text via the background script (Google Translate API).
 */
async function translateText(text, sourceLang, targetLang, apiSettings) {
  const resp = await browser.runtime.sendMessage({
    type: "translate",
    text,
    sourceLang,
    targetLang,
    ...apiSettings,
  });
  if (!resp.ok) {
    throw new Error(resp.error || "Translation failed");
  }
  return resp.translation;
}

/**
 * Get the user's language preferences from storage.
 */
async function getTranslationPrefs() {
  const result = await browser.storage.local.get([
    "sourceLang",
    "targetLang",
    "translationApi",
    "deeplApiKey",
    "deeplUrl",
    "libreTranslateUrl",
    "libreTranslateApiKey",
    "lingvaUrl",
    "fallbackToGoogle",
  ]);
  return {
    sourceLang: result.sourceLang || "auto",
    targetLang: result.targetLang || "en",
    apiSettings: {
      translationApi: result.translationApi || "google",
      deeplApiKey: result.deeplApiKey || "",
      deeplUrl: result.deeplUrl || "",
      libreTranslateUrl: result.libreTranslateUrl || "",
      libreTranslateApiKey: result.libreTranslateApiKey || "",
      lingvaUrl: result.lingvaUrl || "",
      fallbackToGoogle: !!result.fallbackToGoogle,
    },
  };
}

/**
 * Get the actual content root (iframe body or element itself).
 */
function getContentRoot(el) {
  const iframe = el.querySelector("iframe");
  if (iframe) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc?.body) return iframeDoc.body;
    } catch (e) {
      console.error("[Protonmail Translate] Cannot access iframe:", e.message);
    }
  }
  return el;
}

/**
 * Collect all non-empty text nodes from a DOM tree.
 */
function collectTextNodes(root) {
  const nodes = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (parent && (parent.tagName === "SCRIPT" || parent.tagName === "STYLE")) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }
  return nodes;
}

const SEPARATOR = " ||| ";

/**
 * Translate all text nodes in the content root while preserving HTML structure.
 * Returns an array of { node, originalText } for restoring later.
 */
async function translateNodes(contentRoot, sourceLang, targetLang, apiSettings) {
  const textNodes = collectTextNodes(contentRoot);
  if (textNodes.length === 0) return [];

  const originals = textNodes.map((node) => ({
    node,
    originalText: node.textContent,
  }));

  const combined = textNodes.map((n) => n.textContent.trim()).join(SEPARATOR);
  const translated = await translateText(combined, sourceLang, targetLang, apiSettings);

  const parts = translated.split("|||");
  textNodes.forEach((node, i) => {
    if (i < parts.length) {
      node.textContent = parts[i].trim();
    }
  });

  return originals;
}

// Track translation state per message element
const translationState = new WeakMap();

/**
 * Perform translation on a message body element.
 */
async function handleTranslate(bodyEl) {
  const state = translationState.get(bodyEl);
  if (state?.translated) return; // already translated

  const contentRoot = getContentRoot(bodyEl);
  const textNodes = collectTextNodes(contentRoot);
  if (textNodes.length === 0) return;

  const { sourceLang, targetLang, apiSettings } = await getTranslationPrefs();
  const originals = await translateNodes(contentRoot, sourceLang, targetLang, apiSettings);
  translationState.set(bodyEl, { translated: true, originals });
}

/**
 * Restore original text on a message body element.
 */
function handleShowOriginal(bodyEl) {
  const state = translationState.get(bodyEl);
  if (!state?.translated) return;

  state.originals.forEach(({ node, originalText }) => {
    node.textContent = originalText;
  });
  translationState.set(bodyEl, { translated: false, originals: null });
}

/**
 * Find the message body element associated with the dropdown trigger button.
 * Walk up from the "..." button to the message container, then find the body inside it.
 */
function findMessageBodyFromTrigger(triggerBtn) {
  // Walk up to find the message container
  let el = triggerBtn;
  while (el) {
    const body = el.querySelector('[data-testid="message-content:body"]');
    if (body) return body;
    el = el.parentElement;
  }
  return null;
}

/**
 * Create the "Translate" menu item matching Protonmail's dropdown style.
 */
function createTranslateMenuItem(bodyEl) {
  const state = translationState.get(bodyEl);
  const isTranslated = state?.translated;

  const li = document.createElement("li");
  li.className = "dropdown-item";
  li.setAttribute("data-pm-translate", "true");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dropdown-item-button w-full px-4 py-2 text-left flex flex-nowrap items-center";
  btn.setAttribute("data-testid", "message-view-more-dropdown:translate");
  btn.appendChild(createTranslateIcon());
  const label = document.createElement("span");
  label.className = "flex-1 my-auto";
  label.textContent = isTranslated ? "Show original" : "Translate";
  btn.appendChild(label);

  btn.addEventListener("click", async () => {
    const label = btn.querySelector("span");
    if (isTranslated) {
      handleShowOriginal(bodyEl);
      // Close the dropdown by simulating escape
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    } else {
      label.textContent = "Translating...";
      btn.disabled = true;
      try {
        await handleTranslate(bodyEl);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      } catch (err) {
        console.error("[Protonmail Translate]", err);
        label.textContent = "Translation failed";
        setTimeout(() => {
          label.textContent = "Translate";
          btn.disabled = false;
        }, 2000);
      }
    }
  });

  li.appendChild(btn);
  return li;
}

/**
 * Inject the translate item into a newly opened dropdown menu.
 */
function injectIntoDropdown(dropdown) {
  // Don't inject twice
  if (dropdown.querySelector('[data-pm-translate]')) return;

  // Find which message triggered this dropdown by looking for the expanded button
  const triggerBtn = document.querySelector(
    '[data-testid="message-header-expanded:more-dropdown"][aria-expanded="true"]'
  );
  if (!triggerBtn) return;

  const bodyEl = findMessageBodyFromTrigger(triggerBtn);
  if (!bodyEl) return;

  const ul = dropdown.querySelector("ul");
  if (!ul) return;

  // Insert before the last separator (before "Report phishing")
  const items = ul.querySelectorAll(":scope > li");
  const lastSeparator = items[items.length - 2]; // the <hr> before "Report phishing"

  const separatorLi = document.createElement("li");
  separatorLi.className = "dropdown-item";
  separatorLi.setAttribute("data-pm-translate", "true");
  separatorLi.innerHTML = '<hr class="my-2">';

  const menuItem = createTranslateMenuItem(bodyEl);

  if (lastSeparator) {
    ul.insertBefore(separatorLi, lastSeparator);
    ul.insertBefore(menuItem, lastSeparator);
  } else {
    ul.appendChild(separatorLi);
    ul.appendChild(menuItem);
  }
}

// Watch for dropdown menus appearing in the DOM
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      // Check if the added node is the dropdown or contains it
      const dropdown =
        node.matches?.('[data-testid="dropdown-button"]')
          ? node
          : node.querySelector?.('[data-testid="dropdown-button"]');
      if (dropdown) {
        injectIntoDropdown(dropdown);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
