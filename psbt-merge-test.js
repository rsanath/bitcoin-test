const ecpair = require("ecpair");
const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");

const { ECPairInterface, ECPairFactory } = ecpair;
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

const network = bitcoin.networks.testnet;

const privatekeys = [
  "cRK97VjhCs1mEVF3xuQN7AbHnQuJXmqbCV3W5mhk3Yqd2zkRziex",
  "cQxndLPvYCW3m4Pc7Gj5F9xZQqVLrSLf2PwKXYMoQBYTCgFMH2Fp",
  "cNv7xUQb35ye31uJb6rJfMBUth8BwwC81cBxFkUMiqAdJB5AyaCd",
];

const signers = [];
for (const key of privatekeys) {
  const signer = ECPair.fromWIF(key, network);
  signers.push(signer);
}

const wallet = bitcoin.payments.p2wsh({
  redeem: bitcoin.payments.p2ms({
    m: 2,
    pubkeys: signers.map((x) => x.publicKey),
    network,
  }),
  network,
});

const utxo = {
  txid: "65d7299729c93a1ae7d81614a47315e5ba379f7bd0ef8f81d6e1ec26b7835678",
  vout: 1,
  status: {
    confirmed: true,
    block_height: 2872905,
    block_hash:
      "0000000000002d83c3232d66f6805dbb5686d2ee09cec6d2ce91670e0d9564e5",
    block_time: 1723207507,
  },
  value: 500,
};

function getPsbtHex() {
  const recipient = "tb1q4txqge4jzagpjxllpctkp64mk7u32kav9ldypl";
  const amountToSend = 100;
  const fee = 200;

  const psbt = new bitcoin.Psbt({ network });
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    witnessUtxo: {
      script: wallet.output,
      value: utxo.value,
    },
    witnessScript: wallet.redeem?.output,
  });
  psbt.addOutput({
    address: recipient,
    value: amountToSend,
  });
  psbt.addOutput({
    address: wallet.address,
    value: utxo.value - amountToSend - fee,
  });
  return psbt.toHex();
}

const psbt1 = bitcoin.Psbt.fromHex(getPsbtHex());
signers.slice(0, 2).forEach((signer, index) => {
  psbt1.signAllInputs(signer);
});
psbt1.finalizeAllInputs();
const txHex1 = psbt1.extractTransaction().toHex();
console.log("psbt1 signature");
console.log(txHex1, "\n");

const individualSignatures = [];
signers.slice(0, 2).forEach((signer, index) => {
  const psbt = bitcoin.Psbt.fromHex(getPsbtHex());
  psbt.signAllInputs(signer);
  const psbtHex = psbt.toHex();
  individualSignatures.push(psbtHex);
  // console.log(`Signer ${index + 1} signature hex`);
  // console.log(psbtHex, '\n');
});

let psbt2 = bitcoin.Psbt.fromHex(getPsbtHex());
for (const hex of individualSignatures) {
  const psbt = bitcoin.Psbt.fromHex(hex);
  psbt2 = psbt2.combine(psbt);
}
psbt2.finalizeAllInputs()
const txHex2 = psbt2.extractTransaction().toHex()
console.log("psbt2 signature");
console.log(txHex2, "\n");