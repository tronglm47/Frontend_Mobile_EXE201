import "dotenv/config";

export default {
  "expo": {
    "name": "V-Living",
    "slug": "V-Living",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/Logo Icons.png",
    "scheme": "vliving",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "package": "com.vliving.app",
      "versionCode": 1,
      "displayName": "V-Living",
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/Logo Icons.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/Logo Icons.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "permissions": [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.INTERNET"
      ]
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ]
    ],
    "extra": {
      "apiBaseUrl": process.env.EXPO_PUBLIC_API_BASE_URL,
      "eas": {
        "projectId": "1415ee34-5936-42c5-9618-0a48b7301884"
      }
    },
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
