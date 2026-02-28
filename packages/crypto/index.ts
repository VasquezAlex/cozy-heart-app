import crypto from 'crypto';

function getSalt(): string {
    const value = process.env.SALT;
    if (!value) {
        throw new Error('Missing SALT environment variable');
    }
    return value;
}

const salt = getSalt();

const encryptionKey = crypto.createHash('sha256').update(salt).digest();

export function encryptIPData(ip: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(ip, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export function decryptIPData(encrypted: string): string {
    const [ivHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

export function hashIPData(ip: string): string {
    const clean = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    return crypto.createHmac('sha256', salt).update(clean).digest('hex');
}

// FIXED: Handle objects by stringifying them
export function hashDeviceData(deviceData: string | object): string {
    const dataString = typeof deviceData === 'object' 
        ? JSON.stringify(deviceData) 
        : deviceData;
    return crypto.createHmac('sha256', salt).update(dataString).digest('hex');
}

export function verifyIPData(ip: string, hashed: string): boolean {
    return hashIPData(ip) === hashed;
}

export function verifyDeviceData(deviceData: string | object, hashed: string): boolean {
    return hashDeviceData(deviceData) === hashed;
}