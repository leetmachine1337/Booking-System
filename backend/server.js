const app = require('./src/app');

const port = process.env.PORT || 5000;
const host = process.env.HOST || '127.0.0.1';

const server = app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

server.on('error', (error) => {
  console.error(`Failed to start server on http://${host}:${port}`);
  console.error(error.message);
  process.exit(1);
});
