#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the Heroku app name from command line arguments
const herokuAppName = process.argv[2];

if (!herokuAppName) {
    console.error('Usage: node scripts/update-heroku-url.js Rulette');
    console.error('Example: node scripts/update-heroku-url.js Rulette');
    process.exit(1);
}

const configPath = path.join(__dirname, '../src/config/server.ts');
const herokuUrl = `https://${herokuAppName}.herokuapp.com`;

// Read the current config file
let configContent = fs.readFileSync(configPath, 'utf8');

// Update the configuration for Heroku
const updatedConfig = `// Server configuration for Heroku deployment
export const SERVER_CONFIG = {
    HOST: '${herokuAppName}.herokuapp.com',
    PORT: 443,
    getUrl: () => '${herokuUrl}'
};
`;

// Write the updated configuration
fs.writeFileSync(configPath, updatedConfig);

console.log(`✅ Updated server configuration to use Heroku URL: ${herokuUrl}`);
console.log(`📁 Updated file: ${configPath}`);
console.log('');
console.log('🔧 Next steps:');
console.log('1. Test your app with the new server URL');
console.log('2. Make sure all multiplayer features work correctly');
console.log('3. Commit and push your changes to Git'); 