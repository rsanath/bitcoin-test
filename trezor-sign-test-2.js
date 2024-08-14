const bitcoin = require('bitcoinjs-lib');
const TrezorConnect = require('@trezor/connect').default;

const network = bitcoin.networks.testnet;

async function signTransactionWithTrezor(inputs, outputs, network = bitcoin.networks.bitcoin) {
  // Initialize Trezor Connect
  await TrezorConnect.init({
    lazyLoad: false,
    manifest: {
      email: 'developer@example.com',
      appUrl: 'https://example.com'
    }
  });

  // Prepare inputs for Trezor
  const trezorInputs = inputs.map(input => ({
    address_n: input.address_n,
    prev_index: input.prev_index,
    prev_hash: input.prev_hash,
    amount: input.amount,
    script_type: input.script_type,
    sequence: input.sequence || 4294967295 // Use default sequence if not provided
  }));

  // Prepare outputs for Trezor
  const trezorOutputs = outputs.map(output => ({
    address: output.address,
    amount: output.amount,
    script_type: output.script_type
  }));

  // Sign the transaction with Trezor
  const result = await TrezorConnect.signTransaction({
    inputs: trezorInputs,
    outputs: trezorOutputs,
    coin: network === bitcoin.networks.testnet ? 'test' : 'btc',
    push: false
  });

  if (result.success) {
    console.log('Signed transaction (hex):', result.payload.serializedTx);
    return result.payload.serializedTx;
  } else {
    throw new Error('Signing failed: ' + result.payload.error);
  }
}

// Example usage
async function main() {
  const inputs = [
    {
      address_n: [2147483732, 2147483649, 2147483648, 0, 1],
      prev_index: 1,
      prev_hash: "19266fc00bceac4e48e42e0669507199706c79ea96cfc894126f0832c2e99979",
      script_type: "SPENDWITNESS",
      amount: "14076",
      sequence: 4294967293,
    }
  ];

  const outputs = [
    {
      address: "tb1q4txqge4jzagpjxllpctkp64mk7u32kav9ldypl",
      amount: "3000",
      script_type: "PAYTOADDRESS",
    }
  ];

  try {
    const signedTxHex = await signTransactionWithTrezor(inputs, outputs, network);
    console.log('Transaction signed successfully');
    
    // If you want to create a Transaction object from the signed hex
    const signedTx = bitcoin.Transaction.fromHex(signedTxHex);
    console.log('Transaction details:', signedTx);
    
    // If you need it in JSON format
    console.log('Transaction in JSON format:', signedTx.toJSON());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();