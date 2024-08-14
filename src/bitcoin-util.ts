import { ITransaction } from "./models/ITransaction"
import IUtxo from "./models/IUtxo"

export function selectUtxos(utxos: IUtxo[], targetValue: number) {
    const sufficientUtxos = utxos.filter(utxo => utxo.value >= targetValue)

    let selectedUtxos = []
    let totalValue = 0

    // Select UTXOs from largest to smallest until the target value is reached
    for (const utxo of sufficientUtxos) {
        selectedUtxos.push(utxo)
        totalValue += utxo.value
        if (totalValue >= targetValue) break
    }

    return selectedUtxos
}

export function isSegWit(tx: ITransaction) {
    if (!tx.vin || !tx.vout) {
        throw new Error("Invalid transaction data");
    }
    for (const input of tx.vin) {
        if (input.witness) {
            return true; // SegWit transaction
        }
    }
    return false;
}