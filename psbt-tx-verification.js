const ecpair = require("ecpair");
const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const { BIP32Factory } = require("bip32");
const _ = require("lodash")

const { ECPairInterface, ECPairFactory } = ecpair;
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

const network = bitcoin.networks.testnet;

const unsignedPsbtHex = `70736274ff0100a60200000002785683b726ece1d6818fefd07b9f37bae51573a41416d8e71a3ac9299729d7650100000000ffffffff0df6aa77fe8592f4c445b806a515cf67ca0647a25faf4be2733b53e0f32154430100000000ffffffff027f44000000000000160014aacc0466b21750191bff0e1760eabbb7b9155bac9001000000000000220020d01fe27cd71286c050c6b43c7a4ce020e65d6e6c19fb5f3fd209b5309ef5db35000000000001012bf401000000000000220020d01fe27cd71286c050c6b43c7a4ce020e65d6e6c19fb5f3fd209b5309ef5db35010569522103dfbe0c27872498a125001bce0dee6988d2f8f9c8784fcb5c69010c8f4446fbb721033b7963e78f73c4c9a47ad3afd199989eec13e60544db5aa800d5bc38fac756c82103a3d1d44e6ca364199f612b00d4104433b0b1fc60f45b5268b809c57075ad769553ae0001012b7f44000000000000220020d01fe27cd71286c050c6b43c7a4ce020e65d6e6c19fb5f3fd209b5309ef5db35010569522103dfbe0c27872498a125001bce0dee6988d2f8f9c8784fcb5c69010c8f4446fbb721033b7963e78f73c4c9a47ad3afd199989eec13e60544db5aa800d5bc38fac756c82103a3d1d44e6ca364199f612b00d4104433b0b1fc60f45b5268b809c57075ad769553ae000000`;
const signedPsbtHex = `70736274ff0100a60200000002785683b726ece1d6818fefd07b9f37bae51573a41416d8e71a3ac9299729d7650100000000ffffffff0df6aa77fe8592f4c445b806a515cf67ca0647a25faf4be2733b53e0f32154430100000000ffffffff027f44000000000000160014aacc0466b21750191bff0e1760eabbb7b9155bac9001000000000000220020d01fe27cd71286c050c6b43c7a4ce020e65d6e6c19fb5f3fd209b5309ef5db35000000000001012bf401000000000000220020d01fe27cd71286c050c6b43c7a4ce020e65d6e6c19fb5f3fd209b5309ef5db350108fdfe000400483045022100e2a08cbd286b903361e44eec13971e5c4abf889e485b8489151812be153a7dfd022022ee001a7888b946424a4ea1bafc4c797a2e54c5edc531c377b7d88bbedfd83c01483045022100f4c5c35163f3c11270ee63129d4080233c0ce2f67cf271e182c6048c4f1776ec0220031ebd66b2214051c38545256f355e4f07530e8d0ac3b39a441eda49c0c43a600169522103dfbe0c27872498a125001bce0dee6988d2f8f9c8784fcb5c69010c8f4446fbb721033b7963e78f73c4c9a47ad3afd199989eec13e60544db5aa800d5bc38fac756c82103a3d1d44e6ca364199f612b00d4104433b0b1fc60f45b5268b809c57075ad769553ae0001012b7f44000000000000220020d01fe27cd71286c050c6b43c7a4ce020e65d6e6c19fb5f3fd209b5309ef5db350108fdfd0004004730440220325f9db62f91b5f1d04ce38fd7ca275d737273eef6b51acd422f5ffc7492947f0220426bf1caf207423d840cab8f3e855b1fca24e6e8e10781a45711f547613178e50148304502210086d7014735c79a82dd2b8b7319372c86e2fd6a208d3046308dd7e4290072da8d0220767b510adcb943c7dca7b93abb7d5e4cb4f4e29cc38139162b40b42dd8cb23bb0169522103dfbe0c27872498a125001bce0dee6988d2f8f9c8784fcb5c69010c8f4446fbb721033b7963e78f73c4c9a47ad3afd199989eec13e60544db5aa800d5bc38fac756c82103a3d1d44e6ca364199f612b00d4104433b0b1fc60f45b5268b809c57075ad769553ae000000`;

const unsignedPsbt = bitcoin.Psbt.fromHex(unsignedPsbtHex, { network });
const signedPsbt = bitcoin.Psbt.fromHex(signedPsbtHex, { network });

if (unsignedPsbt.txInputs.length !== signedPsbt.txInputs.length) {
  throw new Error('The inputs in the signed transaction do not match the inputs in original transaction')
}

if (unsignedPsbt.txOutputs.length !== signedPsbt.txOutputs.length) {
  throw new Error('The outputs in the signed transaction do not match the outputs in original transaction')
}

for (let i = 0; i < unsignedPsbt.data.outputs.length; i++) {
  const unsignedOutput = unsignedPsbt.data.outputs[i]
  const signedOutput = signedPsbt.data.outputs[i]
  if (!_.isEqual(unsignedOutput, signedOutput)) {
    throw new Error(`Output ${i} does not match with original transaction`)
  }
}

for (let i = 0; i < unsignedPsbt.data.inputs.length; i++) {
  const unsignedInput = unsignedPsbt.data.inputs[i]
  const signedInput = signedPsbt.data.inputs[i]

  const unsignedTxInput = unsignedPsbt.txInputs[i];
  const signedTxInput = signedPsbt.txInputs[i];

  if (!_.isEqual(unsignedTxInput, signedTxInput)) {
    throw new Error(`Input ${i} hash or index does not match.`);
  }

  if (unsignedInput.witnessUtxo || signedInput.witnessUtxo) {
    if (!_.isEqual(unsignedInput.witnessUtxo, signedInput.witnessUtxo)) {
      throw new Error(`Input ${i} witnessUtxo does not match.`);
    }
  } else if (unsignedInput.nonWitnessUtxo || signedInput.nonWitnessUtxo) {
    if (!_.isEqual(unsignedInput.nonWitnessUtxo, signedInput.nonWitnessUtxo)) {
      throw new Error(`Input ${i} nonWitnessUtxo does not match.`);
    }
  }

  if (unsignedInput.redeemScript && signedInput.redeemScript) {
    if (!_.isEqual(unsignedInput.redeemScript, signedInput.redeemScript)) {
      throw new Error(`Input ${i} redeemScript does not match.`);
    }
  }

  if (unsignedInput.witnessScript && signedInput.witnessScript) {
    if (!_.isEqual(unsignedInput.witnessScript, signedInput.witnessScript)) {
      throw new Error(`Input ${i} witnessScript does not match.`);
    }
  }

  const witnessStack = bitcoin.script.decompile(signedInput.finalScriptWitness);
  console.log(witnessStack)
}

console.log('hello')