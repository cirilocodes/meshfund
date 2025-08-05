# Overview

MeshFund is a production-ready comprehensive digital savings circle platform that enables users to participate in rotating savings and credit associations (ROSCAs) globally. The application consists of a React Native mobile app and an Express.js backend API, facilitating secure group savings, automated payouts, and multi-currency support with integrated payment processing through Stripe and PayPal.

## Current Status (August 5, 2025)
✅ **Backend API**: Fully functional Express.js server running on port 5000  
✅ **Database**: PostgreSQL schema deployed with Drizzle ORM  
✅ **Authentication**: JWT-based auth with bcrypt password hashing working  
✅ **Payment Processing**: Stripe and PayPal integrations active with API keys  
✅ **Real-time Communication**: WebSocket server operational  
✅ **API Testing**: All core endpoints verified and working  
✅ **Group Management**: Create groups, add members, manage contributions  
✅ **User Registration**: Complete user onboarding flow functional  
✅ **Mobile App**: Complete React Native app with navigation, UI components, and state management  
✅ **Mobile Screens**: All core screens implemented (Dashboard, Groups, Auth, Create Group, Group Details)  
✅ **Mobile Navigation**: Tab and stack navigation with proper routing  
✅ **EAS Build Configuration**: Production-ready build setup for iOS and Android deployment
✅ **Migration Completed**: Successfully migrated from Replit Agent to Replit environment
✅ **API Services**: Complete mobile service layer (auth, groups, contributions, payouts)
✅ **Business Rules**: Comprehensive validation and business logic implementation
✅ **Deployment Guide**: Complete EAS build and deployment documentation created

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React Native with Expo**: Cross-platform mobile application supporting iOS and Android
- **TypeScript**: Type-safe development with comprehensive interface definitions
- **Custom Design System**: Consistent UI components (Button, Input, Card) with MeshFund branding
- **Zustand**: Lightweight state management for auth, groups, and application state
- **React Navigation**: Native stack and tab navigation with proper screen organization
- **EAS Build**: Production-ready build configuration for app store deployment

## Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket support for live notifications and updates
- **Rate Limiting**: Express rate limiter for API protection
- **Security**: Helmet.js for security headers, CORS configuration

## Data Storage Solutions
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Schema Design**: Comprehensive relational schema including users, groups, group members, contributions, payouts, notifications, and disputes
- **Data Relationships**: Foreign key relationships with proper cascade behaviors
- **Secure Storage**: Expo SecureStore for sensitive mobile data (tokens, credentials)

## Authentication and Authorization
- **JWT Tokens**: 7-day expiration with secure secret management
- **Password Security**: Bcrypt with 12 salt rounds
- **Multi-factor Verification**: Email and phone number verification support
- **KYC Integration**: Know Your Customer verification workflow
- **Role-based Access**: Group admin permissions and member-level access control

## Payment Processing Architecture
- **Stripe Integration**: Primary payment processor for card transactions and subscriptions
- **PayPal Integration**: Secondary payment option using PayPal Server SDK
- **Multi-currency Support**: USD, EUR, GBP, GHS, NGN, KES with proper conversion handling
- **Payment Methods**: Support for cards, PayPal, bank transfers, mobile money, and cryptocurrency
- **Transaction Tracking**: Complete audit trail for all financial transactions

# External Dependencies

## Payment Services
- **Stripe**: Primary payment processing with React Stripe.js integration
- **PayPal Server SDK**: Alternative payment method with OAuth integration
- **Multi-currency**: Support for 6 major currencies with real-time conversion

## Communication Services
- **SendGrid**: Email delivery service for notifications and verification
- **Twilio**: SMS service for phone verification and payment reminders
- **Push Notifications**: Expo notifications for real-time mobile alerts

## Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL with WebSocket support
- **Drizzle ORM**: Type-safe database operations with migration support
- **Winston Logger**: Structured logging with file and console output

## Mobile Platform Services
- **Expo SDK**: Camera access for KYC document upload
- **Expo SecureStore**: Encrypted storage for sensitive mobile data
- **Expo Local Authentication**: Biometric authentication support
- **React Navigation**: Stack and tab navigation with proper screen hierarchy
- **EAS Build**: Expo Application Services for production builds and deployment
- **Cross-platform Support**: Native iOS and Android builds from single codebase

## Development and Monitoring
- **Node Cron**: Scheduled tasks for payment reminders and cycle management
- **Socket.io**: Real-time bidirectional communication
- **Zod**: Runtime type validation for API requests and responses
- **Express Rate Limit**: API rate limiting and DDoS protection