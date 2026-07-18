import crypto from 'crypto';

// Method Description: Provides utility functions for encrypting and decrypting passwords using AES-256-GCM encryption.
// Variable Description: secretKeyEnvName - The name of the environment variable that holds the secret key for encryption/decryption. 
// fallbackSecret - A fallback secret key used if the environment variable is not set.

const secretKeyEnvName = 'PASSWORD_SECRET_KEY';
const fallbackSecret = 'mysecret';

export class EncryptionUtil {
  private static getKey(): Buffer {
    const secret = process.env[secretKeyEnvName] || process.env.SECRET_KEY || fallbackSecret;
    if (!secret) {
      throw new Error(
        `${secretKeyEnvName} is required to encrypt or decrypt passwords. ` +
          `Set it before running tests or the encrypt-password script.`
      );
    }
    return crypto.createHash('sha256').update(secret, 'utf8').digest();
  }

  static encryptPassword(password: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', EncryptionUtil.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
  }

  static decryptPassword(encryptedPassword: string): string {
    const parts = encryptedPassword.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted password format. Expected iv:ciphertext:tag.');
    }

    const [ivBase64, encryptedBase64, tagBase64] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const authTag = Buffer.from(tagBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', EncryptionUtil.getKey(), iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

// Example usage:

// Step 1: Set the PASSWORD_SECRET_KEY environment variable before running the script.
// macOS/Linux:
// export PASSWORD_SECRET_KEY="your_secret_key"
// Windows PowerShell (current session):
// $env:PASSWORD_SECRET_KEY="your_secret_key"
// Display key
// echo $env:PASSWORD_SECRET_KEY

// Step 2: Run the encrypt-password script from the project root.
// Windows PowerShell:
// node .\scripts\encrypt-password.js "your_plaintext_password"
// Ex: node .\scripts\encrypt-password.js "secret_sauce"
// To save the generated value to a .env file in PowerShell:
// node .\scripts\encrypt-password.js "your_plaintext_password" | Out-File -FilePath .env -Encoding utf8 -NoNewline

// Step 3: Use the decryptPassword method in your tests to retrieve the original password from the encrypted value in the .env file.
// const encryptedPassword = process.env.ENCRYPTED_LOGIN_PASSWORD;
// if(!encryptedPassword) {
//   throw new Error('ENCRYPTED_LOGIN_PASSWORD is not set in the .env file.');
// }
// const originalPassword = EncryptionUtil.decryptPassword(encryptedPassword);