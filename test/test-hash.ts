import { encryptIPData, decryptIPData, hashIPData } from '../packages/crypto/index';

const testIPs = [
  "192.168.1.1",
  "10.0.0.1",
  "203.0.113.45",
  "127.0.0.1"
];

console.log("=== HASHING (One-way) ===\n");
for (const ip of testIPs) {
  const hashed = hashIPData(ip);
  console.log(`IP: ${ip}`);
  console.log(`Hash: ${hashed}`);
  console.log(`Can reverse? ❌ NO\n`);
}

console.log("\n=== ENCRYPTION (Reversible) ===\n");
for (const ip of testIPs) {
  const encrypted = encryptIPData(ip);
  const decrypted = decryptIPData(encrypted);
  
  console.log(`Original IP: ${ip}`);
  console.log(`Encrypted: ${encrypted}`);
  console.log(`Decrypted: ${decrypted}`);
  console.log(`Match? ${ip === decrypted ? '✅ YES' : '❌ NO'}\n`);
}

console.log("\n=== SECURITY WARNING ===");
console.log("Encrypted IPs can be decrypted if someone has your SALT.");
console.log("Hashed IPs cannot be reversed even with the SALT.");