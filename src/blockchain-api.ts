import axios from "axios"
import IUtxo from "./models/IUtxo"
import { ITransaction } from "./models/ITransaction"

const blockchainUrl = 'https://blockstream.info/testnet/api'
// const blockchainUrl = 'https://blockstream.info/api/'

export async function getUTXO(address: string): Promise<IUtxo[]> {
    const response = await axios.get(`${blockchainUrl}/address/${address}/utxo`)
    return response.data
}

export async function getTransactionInfo(txid: string): Promise<ITransaction> {
    const response = await axios.get(`${blockchainUrl}/tx/${txid}`)
    return response.data
}

export async function getRawTxHex(txid: string): Promise<string> {
    const response = await axios.get(`${blockchainUrl}/tx/${txid}/hex`)
    return response.data
}

export async function broadcastTx(txHex: string) {
    const response = await axios.post(`${blockchainUrl}/tx`, txHex, {
        headers: {
            'Content-Type': 'text/plain'
        }
    })
    return response.data
}
