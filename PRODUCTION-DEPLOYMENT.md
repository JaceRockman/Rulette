# Production Deployment Guide for Spin-That-Wheel

This guide will help you deploy your React Native app to production and connect it to your deployed server.

## 🎯 **Quick Start**

### **1. Update App Configuration**
```bash
# Update to use your production server
node scripts/update-production-config.js https://avisindustries.net
```

### **2. Build for Production**
```bash
# For web (easiest to start)
npm run web

# For mobile apps
npm install -g @expo/eas-cli
eas login
eas build:configure
eas build --platform all
```

## 📱 **Deployment Options**

### **Option A: Web App (Easiest)**
```bash
# Build for web
npm run web

# Deploy to Vercel
npm install -g vercel
vercel

# Or deploy to Netlify
# Upload the 'web-build' folder to Netlify
```

### **Option B: Mobile Apps (App Stores)**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### **Option C: Direct Distribution**
```bash
# Build APK for Android
eas build --platform android --profile preview

# Build IPA for iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

## 🔧 **Configuration Steps**

### **1. Update Server Configuration**
```bash
# For your custom domain
node scripts/update-production-config.js https://avisindustries.net

# Or for Heroku app
node scripts/update-production-config.js https://your-app.herokuapp.com
```

### **2. Configure EAS Build**
```bash
eas build:configure
```

This creates an `eas.json` file. Update it for your needs:

```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### **3. Environment Variables**
Create an `app.config.js` for environment-specific settings:

```javascript
export default {
  expo: {
    name: "Spin That Wheel",
    slug: "spin-that-wheel",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.spinthatwheel"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.yourcompany.spinthatwheel"
    },
    web: {
      favicon: "./assets/favicon.png"
    }
  }
};
```

## 🚀 **Deployment Workflow**

### **Step 1: Prepare Your App**
```bash
# Update to production server
node scripts/update-production-config.js https://avisindustries.net

# Test locally first
npm start
# Scan QR code with Expo Go app
```

### **Step 2: Build for Production**
```bash
# For web
npm run web

# For mobile
eas build --platform all
```

### **Step 3: Distribute**
```bash
# Web: Deploy web-build folder to Vercel/Netlify
# Mobile: Download from EAS and distribute
# App Stores: Submit via EAS
eas submit --platform all
```

## 📊 **Testing Production**

### **1. Test Server Connection**
```bash
# Test your server endpoints
curl https://avisindustries.net/health
curl https://avisindustries.net/games
```

### **2. Test App Connection**
- Build and install your app
- Try creating a lobby
- Test multiplayer functionality
- Verify socket connections work

### **3. Monitor Performance**
```bash
# Check Heroku logs
heroku logs --tail

# Monitor app performance
expo analytics
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **App can't connect to server**
   - Check server URL in `src/config/server.ts`
   - Verify server is running
   - Check CORS settings

2. **Build fails**
   - Check Expo SDK version compatibility
   - Verify all dependencies are installed
   - Check TypeScript errors

3. **Socket connection issues**
   - Ensure using HTTPS for production
   - Check WebSocket support
   - Verify server URL is correct

### **Debug Commands:**
```bash
# Check app configuration
cat src/config/server.ts

# Test server connection
curl https://avisindustries.net/health

# View build logs
eas build:list

# Check app status
expo diagnostics
```

## 📈 **Production Checklist**

- [ ] Server deployed and running
- [ ] App configured for production server
- [ ] App builds successfully
- [ ] Multiplayer features work
- [ ] Socket connections stable
- [ ] Performance optimized
- [ ] Error handling implemented
- [ ] Analytics configured
- [ ] App distributed to users

## 🎉 **Next Steps**

1. **Monitor usage** - Track how many people use your app
2. **Gather feedback** - Get user feedback and improve
3. **Scale server** - Upgrade Heroku plan if needed
4. **Add features** - Continue developing new features
5. **Marketing** - Promote your app to get more users

## 💡 **Tips for Success**

- **Start with web** - Web deployment is easiest to test
- **Test thoroughly** - Make sure multiplayer works perfectly
- **Monitor performance** - Keep an eye on server load
- **Get user feedback** - Listen to what users want
- **Iterate quickly** - Make improvements based on feedback

Your app is now ready for production! 🚀 