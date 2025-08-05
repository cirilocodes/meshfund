# MeshFund Mobile App - Build & Deployment Guide

## Overview

MeshFund mobile app is built with React Native and Expo, designed for cross-platform deployment on iOS and Android. This guide covers building, testing, and deploying the app using Expo Application Services (EAS).

## Prerequisites

### Required Software
- Node.js 18+ 
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli`

### Required Accounts
- **Expo Account**: Sign up at [expo.dev](https://expo.dev)
- **Apple Developer Account**: Required for iOS builds and App Store deployment
- **Google Play Console Account**: Required for Android builds and Play Store deployment

## Project Setup

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment
The app requires several environment variables for API communication:

```bash
# Create .env file in mobile directory
API_BASE_URL=http://localhost:5000
WS_URL=ws://localhost:5000/ws
```

### 3. EAS Configuration
The project includes `eas.json` with build profiles:

- **development**: For internal testing with development client
- **preview**: For internal distribution (TestFlight/Internal Testing)
- **production**: For App Store/Play Store submission

## Building the App

### Login to EAS
```bash
eas login
```

### Configure Project
```bash
eas build:configure
```

### Development Builds
For testing on physical devices during development:

```bash
# iOS development build
eas build --profile development --platform ios

# Android development build  
eas build --profile development --platform android

# Both platforms
eas build --profile development --platform all
```

### Preview Builds
For internal testing and stakeholder review:

```bash
# iOS preview (TestFlight)
eas build --profile preview --platform ios

# Android preview (Internal Testing)
eas build --profile preview --platform android
```

### Production Builds
For App Store and Play Store submission:

```bash
# iOS production build
eas build --profile production --platform ios

# Android production build
eas build --profile production --platform android

# Both platforms
eas build --profile production --platform all
```

## Testing & Distribution

### Development Testing
1. Install Expo Go app on your device
2. Run development server: `npm start`
3. Scan QR code with Expo Go (iOS) or camera (Android)

### Internal Distribution

#### iOS (TestFlight)
1. Build with preview profile: `eas build --profile preview --platform ios`
2. Submit to TestFlight: `eas submit --platform ios`
3. Add testers in App Store Connect
4. Distribute via TestFlight

#### Android (Internal Testing)
1. Build with preview profile: `eas build --profile preview --platform android`
2. Submit to Play Console: `eas submit --platform android`
3. Set up Internal Testing track
4. Add testers via email or link

### Production Deployment

#### App Store (iOS)
1. Build production version: `eas build --profile production --platform ios`
2. Submit for review: `eas submit --platform ios`
3. Configure App Store listing
4. Release after approval

#### Play Store (Android)
1. Build production version: `eas build --profile production --platform android`
2. Submit to Play Console: `eas submit --platform android`
3. Configure Play Store listing
4. Release to production

## Configuration Files

### app.config.js
Main Expo configuration including:
- App metadata (name, version, icon)
- Platform-specific settings
- Permissions and features
- Plugin configurations

### eas.json
EAS Build configuration with:
- Build profiles for different environments
- Platform-specific build settings
- Resource allocation
- Distribution methods

## Environment Variables

The app uses the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `API_BASE_URL` | Backend API URL | Yes |
| `WS_URL` | WebSocket server URL | Yes |
| `EXPO_PUBLIC_API_URL` | Public API URL for client | Yes |

## Build Optimization

### Bundle Size Optimization
- Use Metro bundler tree-shaking
- Optimize images and assets
- Remove unused dependencies
- Enable Hermes (Android) for performance

### Performance Optimization
- Implement lazy loading for screens
- Optimize image loading and caching
- Use FlatList for large data sets
- Minimize JavaScript bundle size

## Troubleshooting

### Common Build Issues

#### "Module not found" errors
```bash
# Clear Metro cache
npx expo start --clear

# Reset EAS build cache
eas build --clear-cache
```

#### iOS build failures
- Check bundle identifier uniqueness
- Verify Apple Developer account access
- Update Xcode compatibility

#### Android build failures
- Check package name uniqueness
- Verify Google Play Console access
- Update Android SDK/NDK versions

### Platform-Specific Issues

#### iOS
- **Code signing errors**: Verify Apple Developer account and certificates
- **TestFlight delays**: Allow 24-48 hours for review
- **App Store rejection**: Review App Store guidelines and requirements

#### Android
- **APK vs AAB**: Use AAB for Play Store, APK for internal testing
- **64-bit requirement**: Ensure 64-bit compatibility
- **Target SDK**: Keep updated to latest Android requirements

## Security Considerations

### API Security
- Use HTTPS for all API communication
- Implement proper authentication tokens
- Validate all user inputs
- Use Expo SecureStore for sensitive data

### Code Security
- Obfuscate production builds
- Remove development tools from production
- Implement certificate pinning
- Regular security audits

## Monitoring & Analytics

### Crash Reporting
- Expo crashes are automatically reported
- Implement custom error boundaries
- Use Sentry for detailed error tracking

### Performance Monitoring
- Monitor app startup time
- Track screen navigation performance
- Analyze bundle size and load times
- User engagement analytics

## Maintenance

### Regular Updates
- Keep Expo SDK updated
- Update dependencies monthly
- Monitor security vulnerabilities
- Performance optimization reviews

### Release Schedule
- Patch releases: Bug fixes and security updates
- Minor releases: New features and improvements  
- Major releases: Platform updates and breaking changes

## Support & Documentation

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build Documentation**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)
- **React Native Documentation**: [reactnative.dev](https://reactnative.dev)
- **Project Repository**: Internal documentation and issue tracking

For technical support, contact the development team or create an issue in the project repository.