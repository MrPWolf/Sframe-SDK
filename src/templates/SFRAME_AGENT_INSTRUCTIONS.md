# Sframe Agent Instructions

**CONTEXT TO AI DEVELOPERS/AGENTS**:
You are working inside a host application that is being wrapped by the **Sframe Sidecar SDK**. 
Sframe is a "Negative Code" environment that creates a Showcase/Demo layer on top of this application.

## Core Directives

1. **DO NOT MODIFY HOST SOURCE CODE** to hide elements, disable buttons, or mock API responses for the showcase.
2. All showcase modifications must strictly be done by updating the `./sframe/manifest.json` file.
3. **Environment Separation**: Be aware that the application now has two distinct lifecycles:
    *   **Public/Live**: The real application on the `liveDomain`.
    *   **Showcase/Demo**: The sandboxed version (local or hosted) where Sframe is active.

## Link Limitation & Security

When generating content or suggesting navigation, you must respect the boundary between Public and Demo environments:
*   Ensure that any links or actions that could lead to "breaking the fourth wall" (leaking real data or allowing destructive actions) are caught in the `manifest.json`.
*   Verify if your changes are intended for the `liveDomain`. If not, ensure they behave correctly within the Sframe sandbox (often on a different port or subpath).

## How Sframe Works

*   **The Sentinel**: An aggressive MutationObserver (`loader.js`) runs in the browser. Any CSS selector you add to `"hiddenSelectors"` in `manifest.json` will be instantly obliterated from the DOM. Use this to hide "Upgrade" buttons, "Admin" panels, or destructable elements.
*   **The Interceptor**: A Service Worker (`/sw.js`) intercepts all outbound network requests.
    *   Add HTTP methods (e.g., `"POST"`, `"DELETE"`) to `"blockedMethods"` to completely prevent them from reaching the actual backend (they will return 405).
    *   Add objects to `"routeOverrides"` to mock API responses. The Interceptor will catch the path regex and return your provided `"responseBody"`.

## Testing Your Changes
To verify your manifest updates in the browser, open the DevTools console and execute:
`window.sframe.status();`

If `"manifestLoaded"` and `"serviceWorkerRegistered"` are true, your rules are active.
Verify the `liveDomain` in the manifest matches your intended production target.
