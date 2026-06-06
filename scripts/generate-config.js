const fs = require('fs');
const path = require('path');

const backendOrigin = (process.env.ECHOCHAT_BACKEND_URL || 'https://echochat-hrnl.onrender.com').trim();
const outputPath = path.join(__dirname, '..', 'frontend', 'config.js');

const contents = `// Generated at deploy time. Override with ECHOCHAT_BACKEND_URL in Vercel.
window.ECHOCHAT_CONFIG = {
  backendOrigin: ${JSON.stringify(backendOrigin)}
};
`;

fs.writeFileSync(outputPath, contents, 'utf8');
console.log(`Wrote ${outputPath} with backend ${backendOrigin || '(same origin)'}`);
