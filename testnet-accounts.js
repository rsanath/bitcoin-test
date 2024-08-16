const ecpair = require("ecpair");
const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const { changeVersionBytes } = require("./xpubConvert");
const { BIP32Factory } = require("bip32");
const { ECPairFactory } = ecpair;
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

const network = bitcoin.networks.testnet;

const pubkeys = [];
for (let i = 0; i < 3; i++) {
  const mnemonic = bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const master = bip32.fromSeed(seed, network);
  // root 
  // electrum - m/49h/0h/0h
  // mainnet - "m/49'/0'/0'"
  // testnet - "m/49'/1'/0'"
  const path = "m/49'/1'/0'"; 
  const root = master.derivePath(path);
  const tpub = root.neutered().toBase58();
  const upub = changeVersionBytes(tpub, "upub");
  const address0 = root.derive(0)

  pubkeys.push(address0.publicKey)

  console.log("BIP39 Mnemonic:", mnemonic);
  console.log("tpub", tpub);
  console.log("upub", upub);
  console.log();
}


function deriveAddressKeypair(wallet, index) {
  const child = wallet.derive(0).derive(index);
  const { address } = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wsh({
      redeem: bitcoin.payments.p2ms({
        m: 2,
        pubkeys: [
          wallet1.derive(0).derive(index).publicKey,
          wallet2.derive(0).derive(index).publicKey,
        ],
      }),
    }),
  });
  return { address, publicKey: child.publicKey };
}

const p2wsh = bitcoin.payments.p2sh({
  redeem: bitcoin.payments.p2ms({ m: 2, pubkeys, network }),
  network,
});

console.log(p2wsh.address)