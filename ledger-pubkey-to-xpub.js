const { map, compose, dropLast, last } = require('ramda');
const { payments, crypto: BitcoinCrypto } = require('bitcoinjs-lib');
const BIP32 = require('bip32');
const BIP39 = require('bip39');
const TransportWebUSB = require('@ledgerhq/hw-transport-webusb').default;
// const TransportNodeHid  = require("@ledgerhq/hw-transport-node-hid").default
const AppBtc = require('@ledgerhq/hw-app-btc').default;
const bippath = require('bip32-path');

const mnemonic = 'deer scout bonus forward rubber rate embrace street tragic know wife tongue photo stool rival century cruise inspire cinnamon before sudden include strong flip';

// Compress public key to 33 bytes
const compressPublicKey = (publicKey) => {
  const prefix = (publicKey[64] & 1) !== 0 ? 0x03 : 0x02;
  const prefixBuffer = Buffer.alloc(1);
  prefixBuffer[0] = prefix;
  return Buffer.concat([prefixBuffer, publicKey.slice(1, 33)]); // Correct slicing based on the public key size
};

// Get public key hash and create fingerprint
const fingerprint = (publicKey) => {
  const pkh = BitcoinCrypto.ripemd160(BitcoinCrypto.sha256(publicKey)); // First SHA256, then RIPEMD160
  return ((pkh[0] << 24) | (pkh[1] << 16) | (pkh[2] << 8) | pkh[3]) >>> 0; // Create the fingerprint
};

// Get parent path for derivation
const getParentPath = compose(
  (array) => bippath.fromPathArray(array).toString(),
  dropLast(1),
  (path) => bippath.fromString(path).toPathArray()
);

// Create an XPUB from child and parent keys
const createXPUB = (path, child, parent) => {
  const pathArray = bippath.fromString(path).toPathArray();
  const pkChild = compressPublicKey(Buffer.from(child.publicKey, 'hex'));
  const pkParent = compressPublicKey(Buffer.from(parent.publicKey, 'hex'));
  
  const hdNode = BIP32.fromPublicKey(pkChild, Buffer.from(child.chainCode, 'hex'));
  hdNode.parentFingerprint = fingerprint(pkParent);
  hdNode.depth = pathArray.length;
  hdNode.index = last(pathArray);
  
  return hdNode.toBase58();
};

// Fetch XPUB from the Ledger device
const getXPUB = async (ledger, path) => {
  const parentPath = getParentPath(path);
  const child = await ledger.getWalletPublicKey(path);
  const parent = await ledger.getWalletPublicKey(parentPath);
  return createXPUB(path, child, parent);
};

// Test XPUB derivation
const testXPUB = async (mnemonic, accountIndex) => {
  const seed = await BIP39.mnemonicToSeed(mnemonic); // Returns a promise, so await it
  const masterNode = BIP32.fromSeed(seed); // fromSeed now replaces fromSeedBuffer
  return masterNode.deriveHardened(44) // BIP44: purpose
                   .deriveHardened(0)  // Coin type (Bitcoin)
                   .deriveHardened(accountIndex) // Account index
                   .neutered() // Removes private key
                   .toBase58();
};

// Establish connection to Ledger using WebUSB
const connect = async () => {
  const transport = await TransportNodeHid.create(); // Use WebUSB transport
  const btc = new AppBtc(transport);
  return btc;
};

// Main function to run the XPUB generation and comparison
const main = async () => {
  try {
    const ledger = await connect();
    const xpub = await getXPUB(ledger, "44'/0'/0'");

    console.log('Expected XPUB: ', await testXPUB(mnemonic, 0));
    console.log('Created XPUB: ', xpub);
  } catch (error) {
    console.error('Error:', error);
  }
};

main();