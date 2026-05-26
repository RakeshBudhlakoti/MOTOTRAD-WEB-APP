const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Manually parse the .env file to populate process.env without relying on external dependencies
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      // Ignore comments and empty lines
      if (line.trim().startsWith('#') || !line.includes('=')) return;
      const [key, ...valueParts] = line.split('=');
      const k = key.trim();
      let v = valueParts.join('=').trim();
      // Strip outer quotes if any
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) {
        process.env[k] = v;
      }
    });
  }
}

loadEnv();

const hostname = os.hostname().toLowerCase();
const isAWS = process.env.NODE_ENV === 'production' || hostname.includes('ec2') || hostname.includes('amazon') || !!process.env.AWS_EXECUTION_ENV;

if (isAWS && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
  console.log('🌐 AWS Environment detected. Routing Prisma connection to RDS database...');
} else {
  console.log('💻 Local Environment detected. Routing Prisma connection to local database...');
}

// Retrieve arguments passed to the script and construct the command
const args = process.argv.slice(2).join(' ');
const command = `npx prisma ${args}`;

try {
  execSync(command, { stdio: 'inherit', env: process.env });
} catch (error) {
  process.exit(1);
}
