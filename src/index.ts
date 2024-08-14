import { Wallet, ethers, parseEther, parseUnits } from 'ethers'
import Safe, { EthersAdapter, SafeAccountConfig, SafeFactory } from '@safe-global/protocol-kit'
import dotenv from 'dotenv'
import SafeApiKit from '@safe-global/api-kit'
import { MetaTransactionData, SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types'

dotenv.config()

// https://chainlist.org/?search=sepolia&testnets=true
const RPC_URL = process.env.RPC_URL!
const provider = new ethers.JsonRpcProvider(RPC_URL)

// Initialize signers
const owner1Signer = new ethers.Wallet(process.env.ACCOUNT_1_PRIVATE_KEY!, provider)
const owner2Signer = new ethers.Wallet(process.env.ACCOUNT_2_PRIVATE_KEY!, provider)
const owner3Signer = new ethers.Wallet(process.env.ACCOUNT_3_PRIVATE_KEY!, provider)
const owner4Signer = new ethers.Wallet(process.env.ACCOUNT_4_PRIVATE_KEY!, provider)
const owner5Signer = new ethers.Wallet(process.env.ACCOUNT_5_PRIVATE_KEY!, provider)

const apiKit = new SafeApiKit({
    chainId: BigInt(11155111),
    txServiceUrl: process.env.TX_SERVICE_URL!
})

async function createSafe(
    owners: Wallet[],
    safeOwner: Wallet,
    threshold: number
) {
    const ethAdapterOwner = new EthersAdapter({
        ethers,
        signerOrProvider: safeOwner
    })
    const safeFactory = await SafeFactory.create({ ethAdapter: ethAdapterOwner })

    const safeAccountConfig: SafeAccountConfig = {
        owners: await Promise.all(owners.map(x => x.getAddress())),
        threshold,
    }

    const protocolKitOwner1 = await safeFactory.deploySafe({ safeAccountConfig })

    const safeAddress = await protocolKitOwner1.getAddress()
    return safeAddress
}

async function sendTransaction(
    safe: Safe,
    destination: string,
    amount: string
): Promise<SafeMultisigTransactionResponse[]> {
    const safeAddress = await safe.getAddress()
    const safeTransactionData: MetaTransactionData = {
        to: destination,
        data: '0x',
        value: amount
    }
    const safeTransaction = await safe.createTransaction({ transactions: [safeTransactionData] })
    const safeTxHash = await safe.getTransactionHash(safeTransaction)

    // Sign transaction to verify that the transaction is coming from owner 1
    const senderSignature = await safe.signHash(safeTxHash)

    await apiKit.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress: await owner1Signer.getAddress(),
        senderSignature: senderSignature.data,
    })
    const pendingTransactions = await apiKit.getPendingTransactions(safeAddress)
    return pendingTransactions.results
}

async function main() {
    try {
        // get all transactions in safe
        
        const data = await apiKit.getAllTransactions('0x6820636d372195e1fb5e71f46CBa266b04e62Dc5')
        console.log('pending transactins:', data.count)
        // console.log('blockNumber\texecutionDate\tto')
        for (const item of data.results) {
            console.log(`blocknum:${item.blockNumber}\nexecutionDate: ${item.executionDate}\nto: ${item.to}`)
        }

        // create safe
        
        // const safeAddress = await createSafe([
        //     owner1Signer,
        //     owner2Signer,
        //     owner3Signer,
        //     owner4Signer,
        //     owner5Signer,
        // ],
        //     owner1Signer,
        //     3
        // )
        // console.log('Your Safe has been deployed:')
        // console.log(`https://sepolia.etherscan.io/address/${safeAddress}`)
        // console.log(`https://app.safe.global/sep:${safeAddress}`)



        // send transaction

        // const safeAddress = '0x6820636d372195e1fb5e71f46CBa266b04e62Dc5'
        // const ethAdapterOwner = new EthersAdapter({
        //     ethers,
        //     signerOrProvider: owner1Signer
        // })
        // const safe = await Safe.create({ safeAddress, ethAdapter: ethAdapterOwner })
        // const txstatus = await sendTransaction(
        //     safe,
        //     '0xC098f317BA72b30e4cA38B2AB3e36a96F9720956', // owner2,
        //     parseUnits('0.01', 'ether').toString()
        // )
        // for (const tx of txstatus) {
        //     console.log(tx.isSuccessful)
        // }
    } catch (e) {
        console.error(e)
    }
}


main()