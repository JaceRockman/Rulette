const os = require('os');
const fs = require('fs');
const path = require('path');

// Function to get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost'; // fallback
}

// Get current IP
const currentIP = getLocalIPAddress();
console.log(`Your current IP address is: ${currentIP}`);

// Update server config file
const configPath = path.join(__dirname, '..', 'src', 'config', 'server.ts');
const configContent = `// Server configuration
export const SERVER_CONFIG = {
    // Always use the actual IP address since the phone needs to connect over the network
    // You can find your IP address by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
    HOST: '${currentIP}', // Replace with your current IP address
    PORT: 3001,
    getUrl: () => \`http://\${SERVER_CONFIG.HOST}:\${SERVER_CONFIG.PORT}\`
};`;

fs.writeFileSync(configPath, configContent);
console.log(`Updated server configuration with IP: ${currentIP}`);

// Update server.js to use dynamic IP
const serverPath = path.join(__dirname, '..', 'server', 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Check if the dynamic IP function already exists
if (!serverContent.includes('getLocalIPAddress')) {
    console.log('Server.js already has dynamic IP detection. No changes needed.');
} else {
    console.log('Server.js has been updated with dynamic IP detection.');
}

console.log('\nTo start your server:');
console.log('1. In the server directory: npm start');
console.log('2. In the root directory: npm start (for the React Native app)');
console.log(`3. Your server will be available at: http://${currentIP}:3001`); 