const ecpair = require("ecpair");
const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");

const { ECPairInterface, ECPairFactory } = ecpair;

const ECPair = ECPairFactory(ecc);

// Generate 2 normal segwit keypairs
const segwitKeypairs = [];
for (let i = 0; i < 2; i++) {
  const keypair = ECPair.makeRandom();
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: keypair.publicKey,
  });
  console.log("Address", i + 1, address);
  segwitKeypairs.push(keypair);
}

// Initialize BIP32
const bip32 = BIP32Factory(ecc);

// Generate BIP39 seed
const mnemonic = "endorse muffin husband refuse shoe extra come flame farm alert age maze" // bip39.generateMnemonic();
console.log(mnemonic)

const seed = bip39.mnemonicToSeedSync(mnemonic);

// Derive master key
const master = bip32.fromSeed(seed);

// get xpub key
const path = "m/44'/0'/0'"; // BIP44 path for Bitcoin's first account
const account = master.derivePath(path);
const xpub = account.neutered().toBase58();

// Generate private key
const privateKey = master.privateKey.toString('hex')

// Print additional information
console.log('\nxpub', xpub)
console.log("BIP39 Mnemonic:", mnemonic);
console.log("Private Key:", privateKey);
console.log("Maste pub key", master.publicKey.toString("hex"));

// Generate 3 BIP32 public keys
const bip32PubKeys = [];
for (let i = 0; i < 3; i++) {
  const child = master.derivePath(`m/44'/0'/0'/0/${i}`);
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.publicKey,
  });
  console.log("HD address", i + 1, address);
  bip32PubKeys.push(child.publicKey);
}

// Generate 3 multisig wallets and print their addresses
const network = bitcoin.networks.bitcoin;

console.log();

for (let i = 0; i < 3; i++) {
  const pubkeys = [
    bip32PubKeys[i],
    segwitKeypairs[0].publicKey,
    segwitKeypairs[1].publicKey,
  ];

  const p2ms = bitcoin.payments.p2ms({ m: 2, pubkeys, network });
  const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });
  const address = p2wsh.address;

  console.log(`Multisig Wallet ${i + 1} Address: ${address}`);
}
