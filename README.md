 
<p align="center">
  <img src="sframe-logo-wide.svg" width="200" alt="Sframe Logo">
</p>

# Sframe SDK

**Sframe** is a framework-agnostic "Negative Code" environment wrapper. It acts as a "Glass Box" that sits over a host web application, handicapping features and overriding API routes for showcase or demo purposes **without modifying the host's source code**.

---

> [!TIP]
> **Tired of manual configuration?** If you don't want to inject code into your app and want a more sophisticated, simpler method for creating demos, consider using our SaaS at **[sframe.app](https://sframe.app)**.

---

## 🤖 Vibe-Coding Context (Instructions for AI Agents)

If you are an AI assistant or agent reading this, **Sframe is already installed**. Your objective when using this SDK is to create "Showcase" or "Read-Only" states for the host application using **strictly additive or interceptive logic.**

**DO NOT MODIFY the host application's source code to hide elements or mock APIs.**

Instead, all overrides must be defined in the Sframe Manifest.

### Core Architecture

Sframe consists of three main components scaffolds into the host project:

1.  **The Manifest (`./sframe/manifest.json`)**: The single source of truth for all "choke" rules.
2.  **The Sentinel (`./sframe/loader.js`)**: An aggressive `MutationObserver` injected into the host application's HTML `head`. It eagerly annihilates DOM elements matching selectors in the Manifest to prevent UI flicker.
3.  **The Interceptor (`./sw.js`)**: A Service Worker residing at the root of the host domain. It catches every outbound `fetch` and `XMLHttpRequest`, blocking destructive methods or returning mocked data based on the Manifest.

---

## 🛠 Usage & Configuration (`manifest.json`)

To modify the showcase state, update `./sframe/manifest.json`.

```json
{
  "hiddenSelectors": [
    ".admin-panel",
    "#upgrade-cta",
    "[data-feature='destructive']"
  ],
  "blockedMethods": [
    "POST",
    "PUT",
    "DELETE"
  ],
  "routeOverrides": [
    {
      "urlPattern": "/api/v1/user/settings",
      "method": "POST",
      "status": 403,
      "responseBody": {
        "error": "This feature is disabled in the showcase environment."
      }
    },
    {
      "urlPattern": "^/api/v1/billing.*",
      "method": "GET",
      "status": 200,
      "responseBody": {
        "plan": "Enterprise",
        "mocked": true
      }
    }
  ]
}
```

### 1. `hiddenSelectors` (The Sentinel)
Add CSS selectors here. The Sentinel observer runs aggressively (`childList: true, subtree: true, attributes: true`). If an element matches, it is immediately calling `.remove()`. Use this to hide "Upgrade" banners, "Delete" buttons, or Admin navigation links.

*   *Best Practice*: Use robust selectors. If you are using Tailwind, rely on specific `id`s or `data-*` attributes instead of volatile utility classes where possible, though utility classes will still be caught.

### 2. `blockedMethods` (The Interceptor)
An array of HTTP methods. If the host application attempts to make a request using one of these methods (e.g., `POST`), the Interceptor Service Worker catches it and immediately returns a `405 Method Not Allowed`. 
*   *Note*: This applies globally. If you only want to block *some* posts, leave this array empty and use `routeOverrides` instead.

### 3. `routeOverrides` (The Interceptor)
Use this to seamlessly deploy Mock data into the host application.
*   `urlPattern`: A string or Regex pattern. If it starts with `^` or ends with `$`, it is parsed as a true RegExp. Otherwise, it acts as a standard string `.includes()` match.
*   `method`: Optional. Restricts the override to a specific HTTP method (e.g., `GET`).
*   `status`: HTTP status code (Default: 200).
*   `responseBody`: The mock payload. Can be a JSON object or a raw string.

---

## 🩺 Debugging / The Handshake API

To verify Sframe is active, open the browser console on the host application and run:

```javascript
window.sframe.status();
```

**Expected Return:**
```json
{
  "manifestLoaded": true,
  "serviceWorkerRegistered": true,
  "hiddenSelectorsCount": 3,
  "blockedMethodsCount": 3,
  "routeOverridesCount": 2
}
```

If `serviceWorkerRegistered` is `false`, ensure that `./sw.js` is being served correctly at the root directory of your local development server, and that the browser is not bypassing the service worker (e.g., Hard Refresh / Disable Cache).


---

## Installation

For new host projects, Sframe can be initiated by running the CLI installer:

```bash
npx sframe-sdk
```

This will:
1.  Create `./sframe/manifest.json` and `./sframe/loader.js`.
2.  Deploy `./sw.js` to the project root.
3.  Deploy `./sframe/demo.js` to handle cross-platform port assignment.
4.  Inject `npm run sframe` and `npm run demo` placeholder scripts into `package.json`.

**Running the Demo:**
The command `npm run demo` will execute the scaffolded `./sframe/demo.js` script. This script provides an OS-agnostic way (working seamlessly across Windows, Mac, and Linux) to inject a custom `PORT` environment variable before starting your framework's native dev server.

**Final Host Integration:**
You must manually add the Sentinel to the host application's main HTML entrypoint (`index.html` or `_document.tsx`/`layout.tsx`):
```html
<script src="/sframe/loader.js"></script>
```

---

## 🔒 Security Considerations

Sframe is designed to deploy local or hosted sandbox "Showcase" environments. **It is not a security tool.**
Since the SDK intercepts and mocks data on the client side, **do not include sensitive intellectual property, secrets, or real PII in your `manifest.json`.** 

The manifest is publicly loaded in the browser. Any hidden CSS selectors or mock API payloads you define can be read by anyone inspecting the network traffic or the `window.sframe` implementation. Only mock data you are comfortable being public.

---

*Technologies Used: Antigravity with Gemini 3 & 3.1*

*This project is licensed under the Apache 2.0 License - see the LICENSE file for details.*