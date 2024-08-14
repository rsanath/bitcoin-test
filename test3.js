const ecpair = require("ecpair");
const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const { changeVersionBytes } = require("./xpubConvert");
const { BIP32Factory } = require("bip32");
const { ECPairFactory } = ecpair;
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

function deriveAddress(extendedPublicKey, index) {
  const xpub = changeVersionBytes(extendedPublicKey, "xpub");
  const network = xpub.startsWith("xpub")
    ? bitcoin.networks.bitcoin
    : bitcoin.networks.testnet;
  const node = bip32.fromBase58(xpub);
  const child = node.derive(0).derive(index);
  const { address } = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: network,
    }),
    network: network,
  });
  return address;
}p

const mnemonic = "endorse muffin husband refuse shoe extra come flame farm alert age maze";
// const mnemonic = bip39.generateMnemonic();
const seed = bip39.mnemonicToSeedSync(mnemonic);
const master = bip32.fromSeed(seed);

const path = "m/49'/0'/0'"; // electrum - m/49h/0h/0h
const root = master.derivePath(path);
const xpub = root.neutered().toBase58();
const ypub = changeVersionBytes(xpub, "ypub");

console.log("BIP39 Mnemonic:", mnemonic);
console.log("xpub", xpub);
console.log("ypub", ypub);

for (let i = 0; i < 1; i++) {
  const child = root.derive(0).derive(i); // receive
  // const child = root.derive(1).derive(i); // change
  const { address } = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
    }),
  });
  console.log(i + 1, address);
}

console.log('1', deriveAddress(ypub, 0))

// signer1 = ypub6WYgZXxNzykLAifZVGrEbnWPFidzeFmChQy1ASD29K91wkqsM9PCmo8uDM6m2w8tokqihsfNsA5tKiK4TJGSZLp6ZMnhW79HQ53Cn5dmwFc
// signer2 = ypub6XgUdidyMqoMLnU2VnZKCD69h6Hjd2kiqaSU4nTyLHfT2yxjMtvyZ9MZWQ7wfoQSj9bF4rGyCvc5W1sQSnX28kzmCmDahH8TdQ9pKNirdrP