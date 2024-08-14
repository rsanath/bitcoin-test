// blockstream api
export interface ITransaction {
    txid:     string;
    version:  number;
    locktime: number;
    vin:      ITxVin[];
    vout:     ITxVout[];
    size:     number;
    weight:   number;
    fee:      number;
    status:   ITxStatus;
}

export interface ITxStatus {
    confirmed:    boolean;
    block_height: number;
    block_hash:   string;
    block_time:   number;
}

export interface ITxVin {
    txid:          string;
    vout:          number;
    prevout:       ITxVout;
    scriptsig:     string;
    scriptsig_asm: string;
    witness:       string[];
    is_coinbase:   boolean;
    sequence:      number;
}

export interface ITxVout {
    scriptpubkey:         string;
    scriptpubkey_asm:     string;
    scriptpubkey_type:    string;
    scriptpubkey_address: string;
    value:                number;
}
