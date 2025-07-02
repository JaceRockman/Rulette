# Deployment Guide

This guide will help you deploy both the mobile app and backend server for Spin That Wheel.

## Backend Server Deployment

### Option 1: Local Development

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

4. **Verify server is running**
   - Visit `http://localhost:3001/health`
   - You should see: `{"status":"ok","games":0,"players":0}`

### Option 2: Deploy to Cloud (Heroku)

1. **Create Heroku account and install CLI**

2. **Create new Heroku app**
   ```bash
   heroku create your-app-name
   ```

3. **Set up environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   ```

4. **Deploy to Heroku**
   ```bash
   git add .
   git commit -m "Deploy backend server"
   git push heroku main
   ```

5. **Update mobile app server URL**
   - In `src/services/socketService.ts`, change `SERVER_URL` to your Heroku app URL

### Option 3: Deploy to VPS (DigitalOcean, AWS, etc.)

1. **Set up your VPS with Node.js**

2. **Clone and install**
   ```bash
   git clone <your-repo>
   cd server
   npm install
   ```

3. **Set up PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "spin-wheel-server"
   pm2 startup
   pm2 save
   ```

4. **Set up Nginx reverse proxy (optional)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Mobile App Deployment

### Option 1: Development Testing

1. **Install Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Test on device**
   - Install Expo Go app on your phone
   - Scan QR code from terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

### Option 2: Build for Production

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure build**
   ```bash
   eas build:configure
   ```

4. **Build for platforms**
   ```bash
   # For iOS
   eas build --platform ios
   
   # For Android
   eas build --platform android
   
   # For both
   eas build --platform all
   ```

5. **Submit to app stores**
   ```bash
   # iOS App Store
   eas submit --platform ios
   
   # Google Play Store
   eas submit --platform android
   ```

### Option 3: Web Deployment

1. **Build for web**
   ```bash
   npm run web
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Deploy to Netlify**
   - Build the web version
   - Upload `web-build` folder to Netlify

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
```

### Mobile App Configuration

Update `src/services/socketService.ts`:

```typescript
// For local development
const SERVER_URL = 'http://localhost:3001';

// For production (replace with your server URL)
const SERVER_URL = 'https://your-server-domain.com';
```

## SSL/HTTPS Setup

For production, ensure your server uses HTTPS:

1. **Get SSL certificate** (Let's Encrypt is free)
2. **Configure your server** to use HTTPS
3. **Update mobile app** to use `wss://` for WebSocket connections

## Monitoring and Logs

### Backend Monitoring

1. **Health check endpoint**: `GET /health`
2. **Active games**: `GET /games`
3. **Logs**: Check server console or PM2 logs

### Mobile App Monitoring

1. **Expo Analytics**: Built-in with Expo
2. **Crash reporting**: Configure in `app.json`
3. **Performance monitoring**: Use Expo Performance

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if server is running
   - Verify port is not blocked
   - Check firewall settings

2. **CORS errors**
   - Update CORS configuration in server
   - Check origin settings

3. **Socket connection issues**
   - Verify WebSocket support
   - Check network connectivity
   - Update server URL in mobile app

4. **Build failures**
   - Check Expo SDK version compatibility
   - Verify all dependencies are installed
   - Check TypeScript errors

### Debug Commands

```bash
# Check server status
curl http://localhost:3001/health

# View server logs
pm2 logs spin-wheel-server

# Check mobile app logs
expo logs

# Test WebSocket connection
wscat -c ws://localhost:3001
```

## Security Considerations

1. **Input validation**: Validate all user inputs
2. **Rate limiting**: Implement rate limiting for API endpoints
3. **Authentication**: Consider adding user authentication
4. **Data sanitization**: Sanitize all data before processing
5. **HTTPS**: Always use HTTPS in production

## Performance Optimization

1. **Database**: Consider using Redis for session storage
2. **Caching**: Implement caching for frequently accessed data
3. **Load balancing**: Use multiple server instances
4. **CDN**: Use CDN for static assets
5. **Compression**: Enable gzip compression

## Backup and Recovery

1. **Regular backups**: Backup game data regularly
2. **Database backups**: If using a database, set up automated backups
3. **Configuration backups**: Backup server configuration files
4. **Disaster recovery**: Have a recovery plan in place 