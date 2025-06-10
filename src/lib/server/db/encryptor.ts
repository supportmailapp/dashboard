import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const algorithm = "aes-256-ccm";
const key = randomBytes(32);
const iv = randomBytes(16);

function encrypt(text: string): string {
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(encryptedText: string): string {
  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}

export default {
  encrypt,
  decrypt,
};
