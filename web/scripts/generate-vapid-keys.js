#!/usr/bin/env node

/**
 * Generate VAPID key pairs for Web Push notifications
 * Run with: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('Generating VAPID key pair...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated:');
console.log('====================');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('');
console.log('Add these to your .env.local file along with:');
console.log('VAPID_EMAIL=your-email@example.com');
console.log('');
console.log('Note: Keep the private key secure and never commit it to version control!');