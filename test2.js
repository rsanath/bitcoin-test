const bip39 = require('bip39');
const ecpair = require("ecpair");
const bitcoin = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");

const { ECPairInterface, ECPairFactory } = ecpair;

const ECPair = ECPairFactory(ecc);

const bip32 = BIP32Factory(ecc);

// const mnemonic = bip39.generateMnemonic();
const mnemonic = "skill few hire rug poem fine normal couple boil tragic sea stairs"
// const mnemonic = "ignore school clip bless forest holiday boost join odor they decade suit"
console.log('Mnemonic:', mnemonic);

const seed = bip39.mnemonicToSeedSync(mnemonic);

const root = bip32.fromSeed(seed);

console.log('Master Private Key:', root.toBase58());
// console.log('Master Public Key:', root.neutered().toBase58());

console.log('Child Keys:');
for (let i = 0; i < 30; i++) {
  const child = root.derivePath(`m/84'/0'/1'/${i}`);
  // const child = root.derivePath(`m/45'/0'/0'/0/${i}`);
  // const child = root.derivePath(`m/0/${i}`);
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.publicKey,
  });
  console.log(i + 1, address)
}
