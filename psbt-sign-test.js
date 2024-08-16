const ecpair = require("ecpair");
const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");

const { ECPairInterface, ECPairFactory } = ecpair;
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

const network = bitcoin.networks.testnet;

const mnemonics = [
  "goddess trash permit guitar swing act promote second olympic hat network inject",
  "general enrich pause prosper brother razor result glance deer three royal clock",
];

const unsignedPsbt = `70736274ff0100520200000001ef2a970dbd1c46068fc9e53a3176f2992baa742d96ee082a62c689f59ee758e00100000000ffffffff011027000000000000160014aacc0466b21750191bff0e1760eabbb7b9155bac00000000000100b702000000000101085eef782c246fc8777758972d785ab0815063871046baf509cd4e07b42574a30100000000fdffffff0282f3b2100000000017a9148f2bb00f870fc10cd2bd58a2ffce5ccfcfc10a7e874f3100000000000017a91408fcf18065e1a413f32936d288e49a631bc190b387014078a8f455b0d8257c05e6293d1433daf94781d46c1f0085bcc932f716c0c8ed02b3f89cf2bfa8d71ce086728a1aa05dd1b97adb98888d126c020969d3da6b2e57c0d92b00010469522102d165d62e1abdf5707199042d74ba65797ed399b74a9d0338df9ac7a8480953ca2102899264eb97e256ce4e379831e7639d4234b8fbd47b91dbd9a74387d013c8c753210371642b2c758555d9666b4317f66859ab7f25e00c8a0e59531bb8656d5850689353ae0000`

for (const mnemonic of mnemonics) {
  let psbt = bitcoin.Psbt.fromHex(unsignedPsbt, { network })
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const master = bip32.fromSeed(seed, network);
  const root = master.derivePath("m/49'/1'/0'/0/0");
  psbt.signInput(0, root)
  console.log(psbt.toHex())
  console.log()
}

psbt.finalizeAllInputs()
const hex = psbt.extractTransaction().toHex()
console.log(hex)
