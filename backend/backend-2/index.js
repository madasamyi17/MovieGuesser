const app = require('./app');

const basePort = Number(process.env.PORT) || 3000;

function startServer(port) {
    app.listen(3000, '0.0.0.0', () => {
        console.log('Server is running on port 3000');
    })

    // server.on('error', (error) => {
    //     if (error.code === 'EADDRINUSE' && port < basePort + 5) {
    //         const nextPort = port + 1;
    //         console.warn(`Port ${port} is busy. Retrying on port ${nextPort}...`);
    //         startServer(nextPort);
    //         return;
    //     }

    //     console.error('Failed to start server:', error.message);
    //     process.exit(1);
    // });
}

startServer(basePort);

