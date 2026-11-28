// BIOMOTOR Android app settings (Capacitor)
// The app opens the live platform (app.biomotorsports.com), so every platform update reaches the app at once – no new APK
// needed for new pages. Native parts (Bluetooth for the Device Nexus, file sharing) are built into the APK.
// No internet: the copy of the platform inside the app opens instead (errorPath).
module.exports = {
  appId: 'com.biomotor.sportsfitness',
  appName: 'BIOMOTOR',
  webDir: 'www',
  server: { url: 'https://app.biomotorsports.com', androidScheme: 'https', errorPath: 'index.html' },
  android: { backgroundColor: '#ffffff' }
};
