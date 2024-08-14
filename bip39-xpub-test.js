const bip39 = require('bip39');
const bitcoin = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");

const network = bitcoin.networks.bitcoin;

const bip32 = BIP32Factory(ecc);

const mnemonic1 = "legal thumb play interest flash will lucky jar outdoor guard vendor found crucial develop spring valley example supply fortune pole right acid alert page"
const mnemonic2 = "begin siege speak boat before mad solve dance lawsuit point machine cake tragic fiber waste equip loan syrup cloud credit shock choose chest finish"

const derivationPath = "m/45'/0/0"

const seed1 = bip39.mnemonicToSeedSync(mnemonic1);
const seed2 = bip39.mnemonicToSeedSync(mnemonic2);

const root1 = bip32.fromSeed(seed1);
const root2 = bip32.fromSeed(seed2);

const derived1 = root1.derivePath(derivationPath);
const derived2 = root2.derivePath(derivationPath);

const xpub1 = derived1.neutered().toBase58()
const xpub2 = derived2.neutered().toBase58()

console.log('xpub 1:', xpub1);
console.log('xpub 2:', xpub2);

const expectedXpub1 = "xpub6D89eXoCc7dSmwezMJnwyPT4y6d6P7U4YVXxqRs2g2uEF1AVVSVBRBHqwhkPFkuT4haknwqB8MvR6j9nZG4krn21ei5HehebzZT5STUvid4"
const expectedXpub2 = "xpub6DLizyrM5xZqFYd4W7AWGYuGpBwBJPbc1R4zm6q6txukJSdMyoZfRii3sevpfACFEuWu6wa8ZbTBetJr1KNVfk3WGD6TCe2KQTR2sbW9xcg"

console.log()
console.log('xpub 1', expectedXpub1 == xpub1)
console.log('xpub 2', expectedXpub2 == xpub2)

const wallet1Key1 = root1.derivePath(derivationPath + '/0')
const wallet2Key1 = root2.derivePath(derivationPath + '/0')
console.log()
console.log('wallet1Key1', wallet1Key1.publicKey.toString('hex'))
console.log('wallet2Key1', wallet2Key1.publicKey.toString('hex'))

const pubkeys = [wallet1Key1.publicKey, wallet2Key1.publicKey]

const p2ms = bitcoin.payments.p2ms({ m: 2, pubkeys, network });
const p2wsh = bitcoin.payments.p2sh({ redeem: p2ms, network });
console.log()
console.log('multisig address 1', p2wsh.address)