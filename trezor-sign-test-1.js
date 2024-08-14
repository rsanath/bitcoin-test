const bitcoin = require("bitcoinjs-lib");
const TrezorConnect = require("@trezor/connect").default;
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");

const bip32 = BIP32Factory(ecc);

const network = bitcoin.networks.testnet;

// Data from trezor suite
// const input = [
//   {
//     address_n: [2147483732, 2147483649, 2147483648, 0, 1],
//     prev_index: 1,
//     prev_hash:
//       "19266fc00bceac4e48e42e0669507199706c79ea96cfc894126f0832c2e99979",
//     script_type: "SPENDWITNESS",
//     amount: "14076",
//     sequence: 4294967293,
//   },
// ];

// const output = [
//   {
//     address: "tb1q4txqge4jzagpjxllpctkp64mk7u32kav9ldypl",
//     amount: "3000",
//     script_type: "PAYTOADDRESS",
//   },
// ];

function derivePubKey(path) {
  // This is a placeholder. In a real scenario, you'd derive this from your seed.
  const root = bip32.fromSeed(Buffer.alloc(64, 1));
  return root.derivePath(`m/${path.join("/")}`).publicKey;
}

async function signPsbtWithTrezor(psbt, devicePath) {
  // Initialize Trezor Connect
  await TrezorConnect.init({
    lazyLoad: false,
    manifest: {
      email: "developer@example.com",
      appUrl: "https://example.com",
    },
  });

  // Convert PSBT to Trezor-compatible format
  const trezorTx = psbtToTrezorTx(psbt);

  // Sign the transaction with Trezor
  const result = await TrezorConnect.signTransaction({
    device: {
      path: devicePath,
    },
    inputs: trezorTx.inputs,
    outputs: trezorTx.outputs,
    coin: "test", // Use 'test' for testnet
    push: false,
  });

  if (result.success) {
    // Update the PSBT with signatures from Trezor
    updatePsbtWithTrezorSignatures(psbt, result.payload);
    return psbt;
  } else {
    throw new Error("Signing failed: " + result.payload.error);
  }
}

function psbtToTrezorTx(psbt) {
  const tx = psbt.data.globalMap.unsignedTx.tx;
  const inputs = tx.ins.map((input, index) => {
    const psbtInput = psbt.data.inputs[index];
    let addressN = [2147483732, 2147483649, 2147483648, 0, 0]; // Default path, replace with your default

    // Try to get the derivation path from bip32Derivation
    if (psbtInput.bip32Derivation && psbtInput.bip32Derivation[0]) {
      addressN = psbtInput.bip32Derivation[0].path;
    } else {
      console.warn(
        `Warning: No derivation path found for input ${index}. Using default.`
      );
    }

    // Check if we have witnessUtxo (for SegWit) or nonWitnessUtxo (for legacy)
    let amount, scriptType;
    if (psbtInput.witnessUtxo) {
      amount = psbtInput.witnessUtxo.value.toString();
      scriptType = "SPENDWITNESS";
    } else if (psbtInput.nonWitnessUtxo) {
      const prevTx = bitcoin.Transaction.fromBuffer(psbtInput.nonWitnessUtxo);
      amount = prevTx.outs[input.index].value.toString();
      scriptType = "SPENDADDRESS";
    } else {
      throw new Error(`Input ${index} is missing utxo information`);
    }

    return {
      address_n: addressN,
      prev_index: input.index,
      prev_hash: input.hash.reverse().toString("hex"),
      amount: amount,
      script_type: scriptType,
      sequence: input.sequence,
    };
  });

  const outputs = tx.outs.map((output) => {
    let address;
    try {
      address = bitcoin.address.fromOutputScript(
        output.script,
        psbt.opts.network,
        network
      );
    } catch (error) {
      console.warn(
        "Unable to derive address from output script. This might be a change output."
      );
      address = null;
    }

    return {
      address: address,
      amount: output.value.toString(),
      script_type: address ? "PAYTOADDRESS" : "PAYTOWITNESS",
    };
  });

  return { inputs, outputs };
}

function updatePsbtWithTrezorSignatures(psbt, trezorResult) {
  trezorResult.signatures.forEach((signature, index) => {
    const input = psbt.data.inputs[index];
    const pubkey = Buffer.from(trezorResult.serializedTx, "hex").slice(0, 33);
    psbt.updateInput(index, {
      partialSig: [
        {
          pubkey: pubkey,
          signature: Buffer.from(signature, "hex"),
        },
      ],
    });
  });
}

async function main() {
  const psbt = new bitcoin.Psbt({ network });

  psbt.addInput({
    hash: "19266fc00bceac4e48e42e0669507199706c79ea96cfc894126f0832c2e99979",
    index: 1,
    witnessUtxo: {
      script: bitcoin.payments.p2wpkh({
        pubkey: derivePubKey([2147483732, 2147483649, 2147483648, 0, 1]),
        network,
      }).output,
      value: 14076,
    },
    sequence: 4294967293,
  });

  psbt.addOutput({
    address: "tb1q4txqge4jzagpjxllpctkp64mk7u32kav9ldypl",
    value: 3000,
  });

  const signedPsbt = await signPsbtWithTrezor(psbt, null);
  console.log("Signed PSBT:", signedPsbt.toBase64());
}

main();
