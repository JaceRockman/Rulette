#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the domain from command line arguments
const domain = process.argv[2];

if (!domain) {
    console.error('Usage: node scripts/update-custom-domain.js <your-domain>');
    console.error('Example: node scripts/update-custom-domain.js avisindustries.net');
    process.exit(1);
}

const configPath = path.join(__dirname, '../src/config/server.ts');
const httpsUrl = `https://${domain}`;

// Update the configuration for custom domain
const updatedConfig = `// Server configuration for custom domain deployment
export const SERVER_CONFIG = {
    HOST: '${domain}',
    PORT: 443,
    getUrl: () => '${httpsUrl}'
};
`;

// Write the updated configuration
fs.writeFileSync(configPath, updatedConfig);

console.log(`✅ Updated server configuration to use custom domain: ${httpsUrl}`);
console.log(`📁 Updated file: ${configPath}`);
console.log('');
console.log('🔧 Next steps:');
console.log('1. Make sure your DNS is configured correctly');
console.log('2. Test your app with the new domain URL');
console.log('3. Make sure all multiplayer features work correctly');
console.log('4. Commit and push your changes to Git');
console.log('');
console.log('🌐 DNS Configuration:');
console.log(`   - Add CNAME record for ${domain} pointing to your Heroku DNS target`);
console.log(`   - Add CNAME record for www.${domain} pointing to your Heroku DNS target`);
console.log('   - Run "heroku domains" to get your DNS target'); 