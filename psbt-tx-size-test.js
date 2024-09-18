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

const unsignedPsbt = `70736274ff0100520200000001ef2a970dbd1c46068fc9e53a3176f2992baa742d96ee082a62c689f59ee758e00100000000ffffffff011027000000000000160014aacc0466b21750191bff0e1760eabbb7b9155bac00000000000100b702000000000101085eef782c246fc8777758972d785ab0815063871046baf509cd4e07b42574a30100000000fdffffff0282f3b2100000000017a9148f2bb00f870fc10cd2bd58a2ffce5ccfcfc10a7e874f3100000000000017a91408fcf18065e1a413f32936d288e49a631bc190b387014078a8f455b0d8257c05e6293d1433daf94781d46c1f0085bcc932f716c0c8ed02b3f89cf2bfa8d71ce086728a1aa05dd1b97adb98888d126c020969d3da6b2e57c0d92b00010469522102d165d62e1abdf5707199042d74ba65797ed399b74a9d0338df9ac7a8480953ca2102899264eb97e256ce4e379831e7639d4234b8fbd47b91dbd9a74387d013c8c753210371642b2c758555d9666b4317f66859ab7f25e00c8a0e59531bb8656d5850689353ae0000`;

let psbt = bitcoin.Psbt.fromHex(unsignedPsbt, { network });

// console.log('psbt', psbt.txOutputs)

const size = estimateTransactionSize(psbt, 3, 2);
console.log("Estimated size", size);

// const estimatedSize = estimateSize(psbt)
// console.log('estimatedSize', estimatedSize)

for (const mnemonic of mnemonics) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const master = bip32.fromSeed(seed, network);
  const root = master.derivePath("m/49'/1'/0'/0/0");
  psbt.signInput(0, root);
}
psbt.finalizeAllInputs();

const transaction = psbt.extractTransaction();
console.log("Actual Size:", transaction.byteLength());

function varIntSize(number) {
  if (number < 0xfd) {
    return 1;
  } else if (number <= 0xffff) {
    return 3;
  } else if (number <= 0xffffffff) {
    return 5;
  } else {
    return 9;
  }
}

function varIntSize(number) {
  if (number < 0xfd) {
    return 1;
  } else if (number <= 0xffff) {
    return 3;
  } else if (number <= 0xffffffff) {
    return 5;
  } else {
    return 9;
  }
}

function estimateMultisigInputSize(M, N, isSegWit) {
  const signatureSize = 72; // average DER-encoded signature size
  const pubKeySize = 33; // compressed public key size
  const opCodeSize = 1; // OP_M, OP_N, OP_CHECKMULTISIG size

  // Redeem script size: OP_M + N * pubKeySize + OP_N + OP_CHECKMULTISIG
  const redeemScriptSize =
    opCodeSize + N * pubKeySize + opCodeSize + opCodeSize;

  if (isSegWit) {
    // For SegWit (P2WSH): 1 byte witness count, M * signatures, redeem script
    return (
      1 + M * signatureSize + varIntSize(redeemScriptSize) + redeemScriptSize
    );
  } else {
    // For P2SH: 1 byte script length, M * signatures, redeem script
    return (
      1 + M * signatureSize + varIntSize(redeemScriptSize) + redeemScriptSize
    );
  }
}

function estimateTransactionSize(psbt, M, N) {
  let size = 0;

  // Version (4 bytes)
  size += 4;

  const inputCount = psbt.data.inputs.length;
  const outputCount = psbt.txOutputs.length;

  // SegWit Marker and Flag (2 bytes) if there are any witness UTXOs
  const hasWitness = psbt.data.inputs.some((input) => input.witnessUtxo);
  if (hasWitness) {
    size += 2;
  }

  // Input count (varInt) and output count (varInt)
  size += varIntSize(inputCount);
  size += varIntSize(outputCount);

  // Estimate inputs
  for (const input of psbt.data.inputs) {
    size += 32 + 4 + 4; // Outpoint (32 bytes) + Index (4 bytes) + Sequence (4 bytes)

    if (input.witnessUtxo) {
      // P2WSH Multisig
      size += estimateMultisigInputSize(M, N, true);
    } else if (input.nonWitnessUtxo) {
      // P2SH Multisig
      size += estimateMultisigInputSize(M, N, false);
    }
  }

  // Estimate outputs
  for (const output of psbt.txOutputs) {
    if (!output.script || output.script.length === 0) {
      console.warn(
        "Encountered an output with an empty script. Skipping this output."
      );
      continue; // Skip empty outputs
    }

    size += 8; // Value (8 bytes)
    size += varIntSize(output.script.length); // ScriptPubKey length
    size += output.script.length; // ScriptPubKey size
  }

  // Include the witness data size if applicable
  if (hasWitness) {
    for (const input of psbt.data.inputs) {
      if (input.witnessUtxo) {
        size += estimateMultisigInputSize(M, N, true);
      }
    }
  }

  // Locktime (4 bytes)
  size += 4;

  return size;
}
