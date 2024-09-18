import Safe, { EthSafeSignature } from "@safe-global/protocol-kit";
import { SafeTransaction } from "@safe-global/safe-core-sdk-types";
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types";

const RPC_URL = "https://eth-sepolia.public.blastapi.io";

const signers = [
  {
    address: "0x9A56C86e69d48bB24e351E04617AfFfCd42737F4",
    privateKey:
      "0x3222f46cc5c6996ed81df409d66f69203e45582905516e2a7a3f6472c384618c",
  },
  {
    address: "0xE844974518CeD9Adc7826265110B33BF8Be9e50C",
    privateKey:
      "0xf10bf2aa8bfd537f5ab21e6948af572d99ed3103c39a976bba4ea841b3a959d8",
  },
];

async function getSafe(safeAddress: string, ownerPrivateKey: string) {
  const protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: ownerPrivateKey,
    safeAddress,
  });

  return protocolKit;
}

async function buildTransaction(params: {
  safeAddress: string;
  ownerPrivateKey: string;
  to: string;
  amount: string;
}) {
  const { safeAddress, ownerPrivateKey, to, amount } = params;

  const protocolKit = await getSafe(safeAddress, ownerPrivateKey);

  const safeTransactionData: SafeTransactionDataPartial = {
    to,
    value: amount,
    data: "0x",
  };
  const safeTransaction = await protocolKit.createTransaction({
    transactions: [safeTransactionData],
  });

  return safeTransaction;
}

async function getSignatures(
  safe: Safe,
  tx: SafeTransaction,
  signers: string[]
) {
  const signatures: string[] = [];
  for (const privateKey of signers) {
    const signerProtocolKit = await safe.connect({
      provider: RPC_URL,
      signer: privateKey,
    });
    const signedTx = await signerProtocolKit.signTransaction(tx);
    const signature: EthSafeSignature = Array.from(
      signedTx.signatures.values()
    )[0];
    signatures.push(signature.data);
  }
  return signatures;
}

async function main() {
  const safeAddress = "0x222e076c403e7ADf5DA4BF057A4513C84391ceaA";
  const ownerPrivateKey =
    "0xa3f1b989147ed1e14a5a3a3901d554997998c2f2b93b1f4b4b7b831149fb2775";

  const safe = await getSafe(safeAddress, ownerPrivateKey);

  const unsignedTransaction = await buildTransaction({
    safeAddress,
    ownerPrivateKey,
    to: "0x6D6BA995d4121b41Acdd40FC08546d62783F464A",
    amount: "000001",
  });

  const signatures = await getSignatures(
    safe,
    unsignedTransaction,
    signers.map((x) => x.privateKey)
  );

  console.log(signatures)

  let signedTx = unsignedTransaction;
  for (let i = 0; i < signatures.length; i++) {
    const signature = signatures[i];
    const signer = signers[i];
    const ethSignature = new EthSafeSignature(signer.address, signature, false);
    signedTx.addSignature(ethSignature);
  }

  const safeTransactionHash = await safe.getTransactionHash(signedTx)
  console.log('safeTransactionHash', safeTransactionHash)
}

main();

// - sign the transaction without owner private key
// - get the signature 