const ecpair = require('ecpair')
const bitcoin = require('bitcoinjs-lib')
const bip39 = require('bip39')
const ecc = require('tiny-secp256k1')
const { changeVersionBytes } = require('./xpubConvert')
const { BIP32Factory } = require('bip32')
const { ECPairFactory } = ecpair
const ECPair = ECPairFactory(ecc)
const bip32 = BIP32Factory(ecc)
const fetch = require('isomorphic-fetch')

const network = bitcoin.networks.testnet

const basePath = "49'/1'/0'"

const ledgerMnemonic = 'TODO fill it with mnemonic'
const signer1Mnemonic = 'goddess trash permit guitar swing act promote second olympic hat network inject'


const ledger = 'tpubDDUv8ApaxtzWQUrCHzPFJi9hyfWuJSvwjhKSDEBeXTWci4E7gp8aVs4ZqGcqGwhZxCSKXPZbHS3ot6ACTqSgSCbTuhNi55w3XvUUZxt2VBy'
const signer1 = 'tpubDCZVYrt3oMcSQxZuhrLM9gLE3CYRSCjGtS8iFdER9vdpFhDC47pWqtoqm2hT2Sc5UD8RJ2s5pf5Hixhxuv5hND1gA1DaRL3LPCcAbQ6paEY'
const signer2 = 'tpubDCrkyu4ssMujUoCKMzGogCXuofUZ2jL5XLhcm9uaGzEi4673LJ43uM826w1EjzhdMkZCY2sQ9yYZ7mrv4moRaLsVx19H42qPqbSTpqEvPfU'

const utxos = [
  {
    address: '2N173mTxQ2ffWT9v8Q2hoNw2TtMNMXekiny',
    txid: '59082cc709f2c8f36c3cfb769296a75827f3253e7f4ff750ba2293483ba359b6',
    vout: 1,
    status: {
      confirmed: true,
      block_height: 2926117,
      block_hash: '00000000000006436c47f4d66bd0a85ce4f698e07930e3ad545655a22dc04c57',
      block_time: 1726501800
    },
    value: 15673
  },
  {
    address: '2Mu8rFmmADHPFkMHXYQDM7hKDPtezh4WLaf',
    txid: '78878c39ff598e2ce227271969b5cbc2fb695ef7bd926c9745a4d9af7cda59ae',
    vout: 0,
    status: {
      confirmed: true,
      block_height: 2926118,
      block_hash: '0000000000000ae85f8507cd306a666560ada43913f5d3cbfe7e4b65c897550d',
      block_time: 1726501800
    },
    value: 10000
  }
]

const signers = [ledger, signer1, signer2]

function generateAddress() {
  const payments = []
  for (let i = 0; i < 2; i++) {
    const pubkeys = signers.map((xpub) => {
      let node = bip32.fromBase58(xpub, network)
      node = node.derive(0).derive(i)
      return node.publicKey
    })
    const path = `${basePath}/0/${i}`
    const payment = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2ms({
        m: 2,
        pubkeys,
        network
      })
    })
    payments.push(payment)
  }
  return payments
}
// 49'/1'/0'/0/0 2N173mTxQ2ffWT9v8Q2hoNw2TtMNMXekiny
// 49'/1'/0'/0/1 2Mu8rFmmADHPFkMHXYQDM7hKDPtezh4WLaf

async function buildPsbt() {
  const addresses = generateAddress()
  const psbt = new bitcoin.Psbt({ network })

  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i]
    const rawTx = await getRawTx(utxo.txid)
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(rawTx, 'hex'),
      redeemScript: addresses[i].redeem?.output
    })
  }

  psbt.addOutput({
    address: 'tb1q4txqge4jzagpjxllpctkp64mk7u32kav9ldypl',
    value: 20000
  })

  return psbt
}

async function getRawTx(txid) {
  // const url = `https://blockstream.info/testnet/api/tx/${txid}/hex`
  const url = `https://blockstream.info/testnet/api/tx/${txid}/hex`
  const res = await fetch(url)
  const data = await res.text()
  return data
}

/**
 * 
 * @param {bitcoin.Psbt} psbt 
 * @param {string} mnemonic 
 */
function signWithMnemonic(psbt, mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const master = bip32.fromSeed(seed)
  const key1 = master.derivePath("49'/1'/0'/0/0")
  const key2 = master.derivePath("49'/1'/0'/0/1")

  psbt.signInput(0, key1)
  psbt.signInput(1, key2)
}

async function main() {
  // generateAddress()
  const psbt = await buildPsbt()
  signWithMnemonic(psbt, ledgerMnemonic)
  signWithMnemonic(psbt, signer1Mnemonic)
  psbt.finalizeAllInputs()
  const tx = psbt.extractTransaction()
  console.log(tx)
}

main()
