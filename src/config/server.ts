// Server configuration
export const SERVER_CONFIG = {
    // Always use the actual IP address since the phone needs to connect over the network
    // You can find your IP address by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
    HOST: '192.168.1.201', // Replace with your current IP address
    PORT: 3001,
    getUrl: () => `http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`
};