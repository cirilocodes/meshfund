export default {
  expo: {
    name: "MeshFund",
    slug: "meshfund",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1E40AF"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.meshfund.app",
      buildNumber: "1.0.0",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to capture documents for identity verification.",
        NSMicrophoneUsageDescription: "This app uses the microphone for video calls and support.",
        NSLocationWhenInUseUsageDescription: "This app uses location to help find nearby groups and verify transactions."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1E40AF"
      },
      package: "com.meshfund.app",
      versionCode: 1,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.INTERNET",
        "android.permission.VIBRATE",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-local-authentication",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow MeshFund to use camera for document verification and KYC compliance."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#1E40AF",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "meshfund-production-id"
      }
    },
    owner: "meshfund"
  }
};