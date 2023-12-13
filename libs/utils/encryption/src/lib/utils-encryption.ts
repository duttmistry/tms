import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

const _secretKey: string = 'jwtsecret';

//Encryption
export const _doEncrypt = (plainString: string): string => {
  let encrypted: any;
  if (plainString) {
    let _key = CryptoJS.SHA256(_secretKey);
    let _iv = CryptoJS.enc.Base64.parse('');

    encrypted = CryptoJS.AES.encrypt(plainString, _key, {
      keySize: 32,
      iv: _iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
  }

  return encrypted.toString();
};

//Decryption
export const _doDecrypt = (encryptedString: string): string => {
  let decryptedString: any;
  if (encryptedString) {
    let _key = CryptoJS.SHA256(_secretKey);
    let _iv = CryptoJS.enc.Base64.parse('');
    decryptedString = CryptoJS.AES.decrypt(encryptedString, _key, {
      keySize: 32,
      iv: _iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
  }

  return decryptedString;
};
