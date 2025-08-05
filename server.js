const express = require('express');
const cors = require('cors');
const path = require('path');
const { createEurekaClient } = require('./src/services/eurekaClient');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoints for Eureka
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'frontend' });
});

app.get('/actuator/health', (req, res) => {
    res.json({ status: 'UP' });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Frontend Service is running' });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server and register with Eureka
async function startServer() {
    try {
        // Start the Express server
        app.listen(PORT, () => {
            console.log(`Frontend service running on port ${PORT}`);
        });

        // Register with Eureka
        const eurekaClient = createEurekaClient();
        const registered = await eurekaClient.registerWithEureka();
        
        if (registered) {
            eurekaClient.startHeartbeat();
        }

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            eurekaClient.stopHeartbeat();
            process.exit(0);
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            eurekaClient.stopHeartbeat();
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 