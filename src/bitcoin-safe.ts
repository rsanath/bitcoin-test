import dotenv from 'dotenv'
import ECPairFactory, { ECPairInterface } from 'ecpair';
import * as bitcoin from "bitcoinjs-lib"
import * as ecc from 'tiny-secp256k1';
import { isSegWit, selectUtxos } from './bitcoin-util';
import { broadcastTx, getRawTxHex, getTransactionInfo, getUTXO } from './blockchain-api';

dotenv.config()

const network = bitcoin.networks.testnet;

const ECPair = ECPairFactory(ecc);

function createP2PKHwallet() {
    const keypair = ECPair.makeRandom({ network })
    const { address } = bitcoin.payments.p2pkh({
        pubkey: keypair.publicKey,
        network: network
    });
    return { keypair, address }
}

function createMultiSigAddress(
    privateKeys: string[],
    threshold: number
) {
    const keyPairs = privateKeys.map(privKey => {
        return ECPair.fromPrivateKey(Buffer.from(privKey, 'hex'), { network })
    })
    const pubkeys = keyPairs.map(privKey => privKey.publicKey)
    const { address } = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2ms({ m: threshold, pubkeys, network: network }),
        network
    });
    return address
}

async function buildP2PKHTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    publicKey: Buffer
): Promise<bitcoin.Psbt> {
    const utxos = await getUTXO(fromAddress)
    const psbt = new bitcoin.Psbt({ network });
    const selectedUtxos = selectUtxos(utxos, amount)
    const totalAmount = selectedUtxos.map(x => x.value).reduce((a, c) => a + c)
    const fee = 6349 // satoshi
    console.log('selecting utxos')
    for (const utxo of selectedUtxos) {
        const transaction = await getTransactionInfo(utxo.txid)
        const rawTransaction = await getRawTxHex(utxo.txid)
        const vout = transaction.vout[utxo.vout]
        const isSegwit = isSegWit(transaction)
        

        console.log('\n\n')
        console.log(JSON.stringify(transaction))
        console.log('\n\n')
        
        console.log(vout)
        console.log(rawTransaction)
        console.log('isSegwit =', isSegwit)

        if (isSegwit && false) {
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                witnessUtxo: {
                    script: Buffer.from(vout.scriptpubkey),
                    value: vout.value
                },
                redeemScript: publicKey
            })
        } else {
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                nonWitnessUtxo: Buffer.from(rawTransaction, 'hex')
            })
        }
    }

    const changeAmount = totalAmount - (amount + fee)

    psbt.addOutput({
        address: toAddress,
        value: amount
    })

    // change address
    psbt.addOutput({
        address: fromAddress,
        value: changeAmount
    })
    return psbt
}

async function sendTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    keypair: ECPairInterface
) {
    const psbt = await buildP2PKHTransaction(fromAddress, toAddress, amount, keypair.publicKey)
    await psbt.signInputAsync(0, keypair)
    psbt.finalizeAllInputs()
    const transaction = psbt.extractTransaction()
    const signedTransaction = transaction.toHex()
    // todo submit transacion
    const response = await broadcastTx(signedTransaction)
    return response
}

async function main() {
    // const { keypair, address } = createP2PKHwallet()
    // console.log(keypair.toWIF())
    // console.log(address)


    // create miltisig
    // const privateKeys = [
    //     process.env.ACCOUNT_1_PRIVATE_KEY!,
    //     process.env.ACCOUNT_2_PRIVATE_KEY!,
    //     process.env.ACCOUNT_3_PRIVATE_KEY!
    // ]
    // const address = createMultiSigAddress(privateKeys, 2)
    // console.log(`multisig address created\naddress: ${address}`)
    
    const keypair = ECPair.fromWIF('cVYb3g3nsw8CFzSm9GUc3RcLbXjghkKJwHF7TWa1iYytEQY7B5Az', network)
    // address = mjh3iyDAPdVb9Hti9qAksDzwH9jSA8E6Wm
    const { address } = bitcoin.payments.p2pkh({ pubkey: keypair.publicKey, network }) // wallet 1
    console.log('address', address)
    const txid = await sendTransaction(
        address!,
        'mwxa8LePhnrn3RZjNtPFhH1oNYfGVgER4L', // wallet 2
        1000,
        keypair
    )
    console.log('txid', txid)
    // console.log(txhex)
}

main()