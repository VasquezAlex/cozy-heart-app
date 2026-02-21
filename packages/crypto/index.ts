import crypto from 'crypto';

const salt = process.env.SALT || 'default_salt_value';

// Derive 32-byte key from salt (required for AES-256)
const ENCRYPTION_KEY = crypto.createHash('sha256').update(salt).digest();

export function encryptIPData(ip: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(ip, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export function decryptIPData(encrypted: string): string {
    const [ivHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

// Hashing functions (unchanged)
export function hashIPData(ip: string): string {
    const clean = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    return crypto.createHmac('sha256', salt).update(clean).digest('hex');
}

export function hashDeviceData(deviceData: string): string {
    return crypto.createHmac('sha256', salt).update(deviceData).digest('hex');
}

export function verifyIPData(ip: string, hashed: string): boolean {
    return hashIPData(ip) === hashed;
}

export function verifyDeviceData(deviceData: string, hashed: string): boolean {
    return hashDeviceData(deviceData) === hashed;
}