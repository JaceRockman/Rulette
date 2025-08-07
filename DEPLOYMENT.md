# Deployment Guide for Spin-That-Wheel

This guide will help you deploy your Spin-That-Wheel app to Heroku with your custom domain `avisindustries.net`.

## Prerequisites

1. Install the Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Create a Heroku account: https://signup.heroku.com/
3. Make sure you have Git installed
4. Own the domain `avisindustries.net` (✅ You already have this!)

## Step 1: Prepare Your App

1. **Update Server Configuration**
   - The server is already configured to use Heroku's PORT environment variable
   - The Procfile tells Heroku to run the server from the `server/` directory

2. **Update Client Configuration**
   - After deployment, you'll need to update `src/config/server.ts` with your custom domain

## Step 2: Deploy to Heroku

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   heroku create spin-wheel-game
   ```
   (You can choose any name, but `spin-wheel-game` is descriptive)

3. **Deploy to Heroku**
   ```bash
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku main
   ```

4. **Add your custom domain**
   ```bash
   heroku domains:add avisindustries.net
   heroku domains:add www.avisindustries.net
   ```

5. **Get the DNS target**
   ```bash
   heroku domains
   ```
   This will show you the DNS target (something like `avisindustries.net.herokudns.com`)

## Step 3: Configure DNS

You'll need to update your domain's DNS settings with your domain registrar:

1. **Add a CNAME record:**
   - Name: `avisindustries.net`
   - Value: `[your-heroku-dns-target]` (from the `heroku domains` command)

2. **Add a CNAME record for www:**
   - Name: `www.avisindustries.net`
   - Value: `[your-heroku-dns-target]`

3. **Wait for DNS propagation** (can take up to 24 hours, usually much faster)

## Step 4: Update Client Configuration

After DNS is configured, update your app configuration:

```bash
node scripts/update-custom-domain.js avisindustries.net
```

Or manually update `src/config/server.ts`:

```typescript
export const SERVER_CONFIG = {
    HOST: 'avisindustries.net',
    PORT: 443,
    getUrl: () => 'https://avisindustries.net'
};
```

## Step 5: Test Your Deployment

1. Visit `https://avisindustries.net/health` to see the health check endpoint
2. Test the socket connection from your React Native app
3. Make sure all multiplayer features work correctly

## Troubleshooting

### Common Issues:

1. **Build fails**: Make sure all dependencies are in `server/package.json`
2. **App crashes**: Check Heroku logs with `heroku logs --tail`
3. **Socket connection fails**: Ensure you're using HTTPS
4. **Domain not working**: Check DNS propagation with `nslookup avisindustries.net`
5. **npm dependency conflicts**: The server has its own `.npmrc` file to handle peer dependency issues

### Useful Commands:

- View logs: `heroku logs --tail`
- Restart app: `heroku restart`
- Check app status: `heroku ps`
- Check domains: `heroku domains`
- Open app: `heroku open`

## Environment Variables (Optional)

If you need to set environment variables:

```bash
heroku config:set NODE_ENV=production
```

## Scaling (Optional)

For production use, consider scaling your app:

```bash
heroku ps:scale web=1
```

## Monitoring

Monitor your app's performance:

```bash
heroku addons:create papertrail:choklad
```

This will give you detailed logging and monitoring capabilities.

## Benefits of Using Your Custom Domain

✅ **Professional appearance** - `avisindustries.net` looks much better than `random-app.herokuapp.com`  
✅ **Brand recognition** - Users will remember your domain  
✅ **SSL certificate** - Automatic HTTPS with your domain  
✅ **Easy sharing** - Simple URL to share with friends  
✅ **Future flexibility** - Easy to move to other hosting if needed  

## Next Steps

1. Set up subdomains if needed (e.g., `game.avisindustries.net`)
2. Configure SSL certificates (automatic with Heroku)
3. Set up monitoring and alerts
4. Consider using Heroku's add-ons for databases if needed

## Local Development

For local development, you can still use your local server by updating `src/config/server.ts` to point to your local IP address. 