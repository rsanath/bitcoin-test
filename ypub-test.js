const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");
const { changeVersionBytes } = require("./xpubConvert");
const bip32 = BIP32Factory(ecc);

function createWallet(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);
  return root.derivePath("m/49'/0'/0'");
}

const mnemonic = "endorse muffin husband refuse shoe extra come flame farm alert age maze"


const wallet = createWallet(mnemonic);

const ypub = changeVersionBytes(wallet.neutered().toBase58(), 'ypub');

console.log("Ypub1:", ypub1);
console.log("Ypub2:", ypub2, '\n');

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

for (let i = 0; i < 5; i++) {
  const keypair1 = deriveAddressKeypair(wallet1, i);
  const keypair2 = deriveAddressKeypair(wallet2, i);
  console.log(`Address ${i + 1}:`, keypair1.address);
  console.log(`Public Key 1:`, keypair1.publicKey.toString("hex"));
  console.log(`Public Key 2:`, keypair2.publicKey.toString("hex"));
  console.log("---");
}
