"use strict";

import {BinaryLike, Cipher} from 'crypto';

const crypto = require('crypto');

const ENCRYPTION_KEY: string = "xfW!+Bn3E@Luu#^vj3$7wZRqRgACQeCu"; // Must be 256 bytes (32 characters)
const IV_LENGTH: number = 16; // For AES, this is always 16

function encrypt(str: BinaryLike): string {
    const iv: Buffer = crypto.randomBytes(IV_LENGTH);
    const cipher: Cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

    let encrypted: Buffer = cipher.update(str);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(str: string) {
    const split: string[] = str.split(':');
    const head: string = <string> split.shift();
    const tail: string = split.join(':')

    const iv = Buffer.from(head, 'hex');
    const encrypted = Buffer.from(tail, 'hex');

    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}

export { encrypt, decrypt }