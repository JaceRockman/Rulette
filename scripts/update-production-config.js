#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the production server URL from command line arguments
const productionUrl = process.argv[2];

if (!productionUrl) {
    console.error('Usage: node scripts/update-production-config.js <production-server-url>');
    console.error('Example: node scripts/update-production-config.js https://avisindustries.net');
    console.error('Example: node scripts/update-production-config.js https://your-app.herokuapp.com');
    process.exit(1);
}

const configPath = path.join(__dirname, '../src/config/server.ts');

// Parse the URL to get host and port
const url = new URL(productionUrl);
const host = url.hostname;
const port = url.port || (url.protocol === 'https:' ? 443 : 80);

// Update the configuration for production
const updatedConfig = `// Server configuration for production
export const SERVER_CONFIG = {
    HOST: '${host}',
    PORT: ${port},
    getUrl: () => '${productionUrl}'
};
`;

// Write the updated configuration
fs.writeFileSync(configPath, updatedConfig);

console.log(`✅ Updated app configuration to use production server: ${productionUrl}`);
console.log(`📁 Updated file: ${configPath}`);
console.log('');
console.log('🔧 Next steps:');
console.log('1. Build your app for production');
console.log('2. Test the connection to your production server');
console.log('3. Distribute your app');
console.log('');
console.log('📱 Build Commands:');
console.log('   # For web:');
console.log('   npm run web');
console.log('');
console.log('   # For mobile (using EAS):');
console.log('   npm install -g @expo/eas-cli');
console.log('   eas login');
console.log('   eas build:configure');
console.log('   eas build --platform all'); 