const crypto = require('crypto');
const bs58 = require('bs58').default;

const prefixDict = {
  "xprv": "0488ade4", // Mainnet - P2PKH or P2SH  - m/44'/0'
  "yprv": "049d7878", // Mainnet - P2WPKH in P2SH - m/49'/0'
  "zprv": "04b2430c", // Mainnet - P2WPKH 	     - m/84'/0'
  "Yprv": "0295b005", // Mainnet - Multi-signature P2WSH in P2SH
  "Zprv": "02aa7a99", // Mainnet - Multi-signature P2WSH
  "tprv": "04358394", // Testnet - P2PKH or P2SH  - m/44'/1'
  "uprv": "044a4e28", // Testnet - P2WPKH in P2SH - m/49'/1'
  "vprv": "045f18bc", // Testnet - P2WPKH         - m/84'/1'
  "Uprv": "024285b5", // Testnet - Multi-signature P2WSH in P2SH
  "Vprv": "02575048", // Testnet - Multi-signature P2WSH

  'xpub': '0488b21e', // Mainnet - P2PKH or P2SH  - m/44'/0'
  'ypub': '049d7cb2', // Mainnet - P2WPKH in P2SH - m/49'/0'
  'zpub': '04b24746', // Mainnet - P2WPKH 	     - m/84'/0'
  'Ypub': '0295b43f', // Mainnet - Multi-signature P2WSH in P2SH
  'Zpub': '02aa7ed3', // Mainnet - Multi-signature P2WSH
  'tpub': '043587cf', // Testnet - P2PKH or P2SH  - m/44'/1'
  'upub': '044a5262', // Testnet - P2WPKH in P2SH - m/49'/1'
  'vpub': '045f1cf6', // Testnet - P2WPKH         - m/84'/1'
  'Upub': '024289ef', // Testnet - Multi-signature P2WSH in P2SH
  'Vpub': '02575483'  // Testnet - Multi-signature P2WSH
};

function convertKey(key, targetPrefix) {
  const decodedKeyBytes = bs58.decode(key);
  const targetKeyBytes = Buffer.concat([
    Buffer.from(prefixDict[targetPrefix], 'hex'),
    decodedKeyBytes.slice(4)
  ]);
  
  const checksum = crypto.createHash('sha256').update(
    crypto.createHash('sha256').update(targetKeyBytes).digest()
  ).digest().slice(0, 4);

  return bs58.encode(Buffer.concat([targetKeyBytes, checksum]));
}

function main(key, targetPrefix) {
  if (!key || !targetPrefix) {
    return "Insufficient parameters.";
  }

  if (key.substr(1, 3) !== targetPrefix.substr(1, 3)) {
    return "The key and the target prefix must be both public or both private.";
  }

  if (!(key.substr(0, 4) in prefixDict)) {
    return "Invalid target version.";
  }

  if (!(targetPrefix in prefixDict)) {
    return "Invalid target version.";
  }

  return convertKey(key, targetPrefix);
}

// Command line arguments handling
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Insufficient parameters.");
} else {
  const key = args[0];
  const targetPrefix = args[1];
  const result = main(key, targetPrefix);
  console.log(result);
}

// For tests:
// node key_converter.js zpub6qwqZGWt6Gqm9i2bY2ErmJcTfRHHYX4LeUeszP33bSH3zgNdGiD7LEg57BQp2k5EQ4Qr5UAhgG1DMRSMZSA44UTNy1rLTqa3qaSnT9GmdsF ypub
// node key_converter.js ypub6X7aFbqxwbJHJQqUhfTEZDWxVT8qbu4qjN8fCz9ADRuAwaZQ243YiB1w5yTE2qRJzRJ3Kza9DbefU8pnqjk3GEmn6g9usvkZZrP94VcBVdz xpub
// node key_converter.js xpub6CHJwwB3nukoT7eMsJfcM8RTKUzPfH5LpFcSRbFGqRXHtUkAmPsz67Mo4mVe2vmPanBEaWyakwJ7arDE83L2U16BELTVJ1w5J8KVfyMqtzE zpub

// node key_converter.js yprvAJ8Dr6K57Djz5vm1bdvEC5aDwRJMCSLzN9D4QbjYf6NC4nEFUWjJANhTEghL3npior1TjTXW8vcuiaXoRGH8ZrEBn62qzPxbVKn6x5oY5vq xprv
// node key_converter.js xprv9yHxYRe9xYCWEdZtmH8byzUimT9uFpMVT2gqdCqfH5zK1gR2DrZjYK3KDUjk3tAoQCteyyvwgGGMqHvEhZs7mcYaukLRQV97DbiTZSJRaKC zprv
// node key_converter.js zprvAcxV9kyzFuHTwDx8RzhrQAfj7PSo94LVHFjHBzdS36k57t3UjAtrnSMbFtev3hUeDV8GUw84bayTbs9N8xh9N5uneRjGaJn5m3qkLdQwiaZ yprv