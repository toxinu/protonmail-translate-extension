# Protonmail Translate

A Firefox extension that adds a **Translate** button to emails in [Protonmail](https://mail.proton.me) webmail.

## Features

- One-click translation of email content directly in the Protonmail interface
- Toggle between translated and original text
- Configurable target language via the popup menu
- Automatic source language detection
- Uses Google Translate (more options welcome)

## Supported Languages

All the Google Translate supported languages.

## Installation

### From source (temporary, for development)

1. Clone or download this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...**
4. Select the `manifest.json` file from this directory

The extension will remain active until you restart Firefox.

### Permanent install (unsigned)

1. Go to `about:config` and set `xpinstall.signatures.required` to `false` (Firefox Developer Edition / Nightly only)
2. Zip the extension files and rename to `.xpi`
3. Drag the `.xpi` file into Firefox

## Usage

1. Open [Protonmail](https://mail.proton.me) and open an email
2. A **Translate** button appears above the email body
3. Click it to translate — click **Show original** to revert
4. To change the target language, click the extension icon in the toolbar and pick a language from the dropdown

## Notes

- Protonmail's DOM structure may change over time, which could break the selector used to find email bodies. The extension currently targets `[data-testid="message-content:body"]`.
- This extension uses Manifest V2 for Firefox compatibility. A Manifest V3 migration may be needed in the future.
- Partially written with AI as it is very simple extension.

## License

MIT
