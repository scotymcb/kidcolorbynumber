# KidColorByNumber PWA 🎨

A Progressive Web App for kids (ages 6-8) that turns any photo into a fun color-by-number activity. It's installable, works completely offline, and processes all images directly on your device to ensure privacy.



### ✨ Features

* **PWA & Offline-First:** Install on your Android device ("Add to Home Screen") and use it anywhere, even without an internet connection.
* **Create from Photos:** Use the camera, upload a photo, or search for images online to create new projects.
* **Automatic Image Processing:** Client-side logic resizes, simplifies colors, and generates numbered SVG regions ready for coloring.
* **Kid-Friendly UX:** Large buttons, simple touch-to-fill interaction, and an undo/redo stack.
* **Auto-Save:** Progress is saved automatically to your device after every tap.
* **Export & Share:** Download finished artwork as a PNG or PDF, or print the blank template.
* **Parental Controls:** Online search requires confirmation and can be disabled. All data is stored locally.

---

### 🚀 Deployment to GitHub Pages

This app is designed to be hosted for free on GitHub Pages.

1.  **Fork/Clone this Repository:** Create your own copy of this code on GitHub.
2.  **Configure API Keys (Optional):** See the section below to enable online image search.
3.  **Enable GitHub Pages:**
    * In your new repository, go to `Settings` > `Pages`.
    * Under "Build and deployment", select the Source as `Deploy from a branch`.
    * Choose the `main` branch and the `/ (root)` folder.
    * Click `Save`. Your site will be live at `https://<your-username>.github.io/<repository-name>/` within a few minutes.

---

### 🔑 Configuration: API Keys for Image Search

To enable the "Search for Image" feature, you need an API key from an image provider.

**⚠️ Security Warning:** Never commit your secret API keys directly into your public GitHub repository. For personal use or testing, you can add it locally, but for a public-facing app, **use a serverless proxy**.

#### Option 1: Unsplash API (Recommended)

1.  Go to the [Unsplash Developers](https://unsplash.com/developers) portal and create an account.
2.  Create a new application. You will be given an **Access Key**.
3.  Open the `js/app.js` file and find the `CONFIG` object at the top.
4.  Paste your Unsplash Access Key into the `unsplashApiKey` placeholder.

```javascript
// In js/app.js
const CONFIG = {
    // ... other settings
    unsplashApiKey: 'YOUR_UNSPLASH_ACCESS_KEY_HERE', // <-- PASTE KEY HERE
};
```

#### Option 2: Serverless Proxy (Production Method)

To protect your API key, you should proxy requests through a serverless function (e.g., using Netlify, Vercel, or AWS Lambda).

1.  Create a simple serverless function that accepts a search query.
2.  This function adds your secret API key on the server-side and forwards the request to the Unsplash API.
3.  It then returns the response to your PWA.
4.  In `js/app.js`, update the `searchImages` function to call your proxy URL instead of the Unsplash API directly.

---

### 📱 How to Test on Android

1.  **Open the URL:** Navigate to your deployed GitHub Pages URL in Chrome on an Android tablet or phone.
2.  **Install the App:**
    * After a few moments, a custom "Install App" button should appear at the top.
    * Tap it, and then tap "Install" in the browser prompt.
    * The app will be added to your home screen.
3.  **Test Offline Mode:**
    * Turn on **Airplane Mode**.
    * Open the app from your home screen. It should load instantly.
    * Create a new project using one of the bundled sample images.
    * Color the image, use undo/redo, and close the app.
    * Re-open the app. Your progress should be restored perfectly.
4.  **Test Online Sync:**
    * While still in Airplane Mode, try searching for an image (e.g., "cat"). The app should tell you the request is queued.
    * Turn off Airplane Mode and ensure you have Wi-Fi/data.
    * A "Sync" button should appear, or the app might sync automatically. Tap it if needed.
    * The queued search will execute, and the new image will be processed and added to your projects.

---

### ⚙️ Developer Tuning & Parameters

You can easily adjust the app's behavior by modifying the `CONFIG` object in `js/app.js`.

* `maxImageDimension`: Max width/height for processed images. Larger values are slower.
* `paletteSize`: The number of colors (4-12 is ideal) to reduce the image to.
* `undoStackLimit`: How many actions can be undone.
* `imageTraceOptions`: Advanced settings for `imagetracer.js` to control SVG detail and smoothing.

---

### 🛠️ Technology Stack

* **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **PWA:** Service Worker, Web App Manifest
* **Persistence:** [localForage](https://github.com/localForage/localForage) (for easy IndexedDB interaction)
* **Image Tracing:** [imagetracer.js](https://github.com/jankovicsandras/imagetracerjs) (for Raster-to-SVG conversion)
* **PDF Export:** [jsPDF](https://github.com/parallax/jsPDF)
* **Hosting:** GitHub Pages

---

### 🔒 Security & Privacy

* **On-Device Processing:** All image manipulation happens in your browser. Your photos are never uploaded to a server.
* **Parental Consent:** The app asks for confirmation before fetching any images from the internet.
* **API Keys:** The recommended setup uses a serverless proxy to protect API keys.
* **Image Attribution:** The Unsplash API requires attribution. The app includes a link to the source image as required by their terms.

### 🐛 Known Limitations

* **Complex Images:** Photos with many gradients, fine textures, or low contrast may not produce clean, colorable regions. The app works best with cartoon-like or graphic images.
* **Performance:** Image processing is CPU-intensive. On older or low-power devices, processing a large image may take several seconds.
