const crypto = require('crypto');

const secretKeyEnvName = 'PASSWORD_SECRET_KEY';
const fallbackSecret = 'mysecret';
const secret = process.env[secretKeyEnvName] || process.env.SECRET_KEY || fallbackSecret;

const password = process.argv[2];
if (!password) {
  console.error('Usage: node ./scripts/encrypt-password.js <password>');
  process.exit(1);
}

const key = crypto.createHash('sha256').update(secret, 'utf8').digest();
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
const authTag = cipher.getAuthTag();

console.log(`${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`);