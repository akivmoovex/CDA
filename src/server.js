import createApp from './app.js';

const PORT = process.env.PORT || 3000;

console.log('Starting CDA Platform...');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`PORT: ${PORT}`);
console.log('Request logging enabled');

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CDA Platform listening on port ${PORT}`);
});
