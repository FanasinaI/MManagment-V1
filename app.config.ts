import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'MManagment',
  slug: 'mmanagment',
  scheme: 'mmanagment',
  owner: 'fanasinai',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0A1428',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.mmanagment.app',
  },
  android: {
    package: 'com.mmanagment.app',
    adaptiveIcon: {
      backgroundColor: '#0A1428',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // RECEIVE_SMS / READ_SMS are declared in modules/sms-receiver's own
    // AndroidManifest.xml and merged in automatically during a native
    // build — no need to duplicate them here.
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-splash-screen',
    'expo-sqlite',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        color: '#E8BE6B',
      },
    ],
    'expo-local-authentication',
    'expo-sharing',
    'expo-font',
    '@react-native-community/datetimepicker',
  ],
  extra: {
    eas: {
      projectId: 'cf2c1e3f-00e8-4f19-931b-ef1fa1994ca4',
    },
  },
};

export default config;
