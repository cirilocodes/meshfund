# MeshFund EAS Build & Deployment Guide

Complete guide for building and deploying your MeshFund mobile app using Expo Application Services (EAS).

## Prerequisites

1. **Expo CLI & EAS CLI Installation**
```bash
npm install -g @expo/cli eas-cli
```

2. **Expo Account Setup**
```bash
npx expo login
eas login
```

3. **Project Setup**
```bash
cd mobile
npm install
```

## 1. EAS Build Configuration

### Configure EAS Build
Your `mobile/eas.json` already contains the build configuration:

```json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Update App Configuration
Ensure your `mobile/app.config.js` has correct settings:

```javascript
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
      backgroundColor: "#1E3A8A"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.meshfund.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1E3A8A"
      },
      package: "com.meshfund.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: process.env.API_URL || "https://api.meshfund.com"
    }
  }
};
```

## 2. Backend Deployment

### Deploy Backend to Replit
Your backend is already running on Replit. For production:

1. **Set Environment Variables**
```bash
# In your Replit secrets, add:
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
PAYPAL_CLIENT_ID=your_live_paypal_client_id
PAYPAL_CLIENT_SECRET=your_live_paypal_secret
SENDGRID_API_KEY=SG.your_live_sendgrid_key
TWILIO_ACCOUNT_SID=your_live_twilio_sid
TWILIO_AUTH_TOKEN=your_live_twilio_token
TWILIO_PHONE_NUMBER=your_live_twilio_number
JWT_SECRET=your_very_secure_production_jwt_secret
NODE_ENV=production
```

2. **Update API URL in Mobile App**
In `mobile/src/services/api.ts`, update the production URL:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'
  : 'https://your-replit-app-name.replit.app/api';
```

## 3. Build for Development

### iOS Development Build
```bash
cd mobile
eas build --platform ios --profile development
```

### Android Development Build
```bash
cd mobile
eas build --platform android --profile development
```

### Install Development Build
After build completes:
- **iOS**: Install via Expo Go or TestFlight
- **Android**: Download APK from EAS dashboard

## 4. Build for Preview/Testing

### Preview Builds (Internal Testing)
```bash
# iOS Preview
eas build --platform ios --profile preview

# Android Preview  
eas build --platform android --profile preview
```

These builds are perfect for:
- Internal team testing
- Beta user testing
- Client demos

## 5. Production Builds

### Build for App Stores
```bash
# iOS Production Build (App Store)
eas build --platform ios --profile production

# Android Production Build (Google Play)
eas build --platform android --profile production
```

### Build Both Platforms Simultaneously
```bash
eas build --platform all --profile production
```

## 6. App Store Submission

### iOS App Store Submission

1. **Generate iOS Build**
```bash
eas build --platform ios --profile production
```

2. **Submit to App Store**
```bash
eas submit --platform ios
```

3. **Required Information**
- Apple Developer Account
- App Store Connect credentials
- App metadata and screenshots

### Google Play Store Submission

1. **Generate Android Build**
```bash
eas build --platform android --profile production
```

2. **Submit to Google Play**
```bash
eas submit --platform android
```

3. **Required Information**
- Google Play Console account
- Google Play credentials
- App metadata and screenshots

## 7. Environment Configuration

### Development Environment
```bash
# mobile/.env.development
API_URL=http://localhost:5000/api
ENVIRONMENT=development
```

### Production Environment
```bash
# mobile/.env.production
API_URL=https://your-replit-app-name.replit.app/api
ENVIRONMENT=production
```

## 8. Build Optimization

### Reduce Bundle Size
Add to `mobile/metro.config.js`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable tree shaking
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
```

### Bundle Analysis
```bash
npx expo export --analyze
```

## 9. Testing & Quality Assurance

### Pre-submission Checklist

**✅ Functionality**
- [ ] User registration/login works
- [ ] Group creation and joining
- [ ] Payment processing (Stripe/PayPal)
- [ ] Real-time notifications
- [ ] All navigation flows

**✅ Performance**
- [ ] App loads under 3 seconds
- [ ] Smooth navigation
- [ ] No memory leaks
- [ ] Offline functionality

**✅ Security**
- [ ] API endpoints secured
- [ ] JWT tokens properly handled
- [ ] Sensitive data encrypted
- [ ] Payment data PCI compliant

**✅ App Store Requirements**
- [ ] Privacy policy included
- [ ] Terms of service
- [ ] Proper app metadata
- [ ] Required screenshots
- [ ] Age rating appropriate

## 10. Continuous Deployment

### Automated Builds with GitHub Actions

Create `.github/workflows/eas-build.yml`:

```yaml
name: EAS Build
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check for EXPO_TOKEN
        run: |
          if [ -z "${{ secrets.EXPO_TOKEN }}" ]; then
            echo "You must provide an EXPO_TOKEN secret"
            exit 1
          fi

      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: npm
          cache-dependency-path: mobile/package-lock.json

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: |
          cd mobile
          npm ci

      - name: Build on EAS
        run: |
          cd mobile
          eas build --platform all --non-interactive
```

## 11. Over-the-Air Updates

### Deploy Updates Without Rebuilding
```bash
cd mobile
eas update --branch production --message "Bug fixes and improvements"
```

### Configure Update Channels
In `mobile/app.config.js`:
```javascript
export default {
  expo: {
    // ... other config
    updates: {
      url: "https://u.expo.dev/your-project-id"
    },
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};
```

## 12. Monitoring & Analytics

### Add Error Tracking
```bash
cd mobile
npm install @sentry/react-native
```

### Configure Sentry (Optional)
```javascript
// mobile/App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
});
```

## 13. Final Deployment Steps

### Complete Deployment Checklist

1. **✅ Backend Deployed**
   - Server running on Replit
   - Database connected (Neon PostgreSQL)
   - Environment variables set
   - API endpoints tested

2. **✅ Mobile App Built**
   - EAS builds successful
   - App tested on real devices
   - All features working
   - Performance optimized

3. **✅ App Store Submission**
   - iOS submitted to App Store
   - Android submitted to Google Play
   - App metadata complete
   - Screenshots uploaded

4. **✅ Go Live**
   - Apps approved and published
   - Backend in production mode
   - Users can download and use
   - Monitoring systems active

## 14. Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear EAS build cache
eas build --clear-cache

# Check build logs
eas build:list
```

**App Crashes**
- Check Expo Go console logs
- Review native device logs
- Test on multiple devices

**API Connection Issues**
- Verify backend URL is correct
- Check CORS settings
- Validate SSL certificates

## 15. Support & Resources

### Documentation
- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)

### Community Support
- [Expo Discord](https://chat.expo.dev/)
- [Expo Forums](https://forums.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

---

**🎉 Congratulations!** Your MeshFund app is now ready for the world. Users can participate in savings circles, make secure payments, and build financial communities globally.

**Next Steps:**
- Monitor app performance and user feedback
- Plan feature updates and improvements
- Scale backend infrastructure as user base grows
- Consider additional payment methods and regions