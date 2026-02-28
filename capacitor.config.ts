import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.puresoul.app',
    appName: 'PureSoul',
    webDir: 'dist/public',

    // Use HTTPS scheme on Android (avoids mixed-content issues)
    server: {
        androidScheme: 'https',
        // In development you can point to your local server:
        // url: 'http://192.168.1.x:4000',
        // cleartext: true,
    },

    plugins: {
        // Push notifications (requires APNs cert for iOS, FCM for Android)
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },

        // Encrypted local storage (replaces raw localStorage for sensitive data)
        Preferences: {},

        // Status bar styling
        StatusBar: {
            style: 'DEFAULT',
            backgroundColor: '#ffffff',
        },

        // Haptic feedback
        Haptics: {},

        // Splash screen
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#ffffff',
            androidSplashResourceName: 'splash',
            showSpinner: false,
        },
    },

    ios: {
        contentInset: 'automatic',
    },

    android: {
        allowMixedContent: false,
    },
};

export default config;
