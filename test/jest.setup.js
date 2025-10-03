// Setup crypto for Jest E2E tests
const { webcrypto } = require('crypto');

if (!global.crypto) {
  global.crypto = webcrypto;
}