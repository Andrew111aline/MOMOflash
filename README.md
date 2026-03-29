<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0c7e2642-b8e4-4252-93ad-2b37cce22d4c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Android PWA testing

Chrome on Android will not allow PWA installation from an insecure LAN address like `http://192.168.x.x:3000`.

Use one of these two ways:

1. Use a real HTTPS origin.
2. Use ADB reverse and open localhost on the phone:
   `npm run dev:android`
   `npm run android:reverse:dev`
   Open `http://127.0.0.1:3000` in Chrome on Android.

For production-like verification:

1. `npm run build`
2. `npm run preview:android`
3. `npm run android:reverse:preview`
4. Open `http://127.0.0.1:4173` in Chrome on Android.
