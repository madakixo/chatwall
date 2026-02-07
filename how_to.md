Deployment and Android Packaging Guide
This guide covers two main ways to distribute your LoveWall application:

Web Deployment: Hosting it as a website (e.g., Vercel, Netlify).
Android App: Packaging it as a native Android app using Capacitor.
1. Web Deployment (Vercel/Netlify)
Since this is a Vite + React application, deployment is straightforward.

Option A: Vercel (Recommended)
Push to GitHub: Ensure your project is pushed to a GitHub repository.
Import to Vercel:
Go to Vercel and log in.
Click "Add New..." -> "Project".
Select your GitHub repository.
Configure Build:
Framework Preset: Vite
Build Command: vite build (or leave default)
Output Directory: dist (or leave default)
Environment Variables:
Add GEMINI_API_KEY in the Environment Variables section.
Deploy: Click Deploy.
Option B: Netlify
Push to GitHub.
Import to Netlify:
Go to Netlify.
"Add new site" -> "Import an existing project".
Connect GitHub and select your repo.
Build Settings:
Build command: npm run build
Publish directory: dist
Environment Variables:
Go to Site settings -> Environment variables and add GEMINI_API_KEY.
Deploy.
2. Package as Android App (using Capacitor)
Capacitor allows you to wrap your web app into a native Android container.

Prerequisites
Node.js installed.
Android Studio installed (for building the APK).
Step 1: Install Capacitor
Run the following commands in your project root:

bash
# Install Capacitor core and CLI
npm install @capacitor/core @capacitor/cli @capacitor/android
# Initialize Capacitor (Answer the prompts: App Name="LoveWall", App ID="com.lovewall.app")
npx cap init
Step 2: Build the Web App
You must build your React app before syncing it to Android.

bash
# Build the project
npm run build
Step 3: Add Android Platform and Sync
bash
# Add Android platform
npx cap add android
# Sync the web build to the Android project
npx cap sync
Step 4: Configure Android Permissions (Optional but Recommended)
If your app uses Geolocation or Camera (which LoveWall does), you need to declare permissions in android/app/src/main/AndroidManifest.xml.

Open android/app/src/main/AndroidManifest.xml and add these inside the <manifest> tag:

xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-feature android:name="android.hardware.camera" />
Step 5: Build and Run on Android
Open in Android Studio:
bash
npx cap open android
Wait for Gradle sync to finish.
Run on Device/Emulator:
Connect an Android device (Enable USB Debugging) or create an Emulator.
Click the Run button (green play icon) in Android Studio.
Step 6: Generate Signed APK (for Play Store or Sharing)
In Android Studio, go to Build -> Generate Signed Bundle / APK.
Select APK.
Create a new Key store (remember the password).
Select release build variant.
The APK will be generated in android/app/release/.
Troubleshooting
Blank Screen on Android? Ensure your 
vite.config.ts
 has the base set correctly. Sometimes relative paths are safer for Capacitor. Update 
vite.config.ts
:
typescript
export default defineConfig({
  base: './', // Add this line
  plugins: [react()],
  // ...
})
Then run npm run build and npx cap sync again.
