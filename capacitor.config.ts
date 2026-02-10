import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tarunh.vouch',
  appName: 'Vouch',
  webDir: 'public', // Unused when server.url is set, but required
  server: {
    // IMPORTANT: For local development on a physical device,
    // replace this with your computer's local IP address (e.g., http://192.168.1.50:3000)
    // For production, use the deployed URL (e.g., https://tas.tarunh.com)
    url: process.env.NODE_ENV === 'production'
      ? 'https://tas.tarunh.com'
      : 'http://192.168.178.180:3000',
    cleartext: true, // Allow http for dev
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
      backgroundColor: '#000000'
    }
  }
};

export default config;
