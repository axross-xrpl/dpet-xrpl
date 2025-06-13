/**
 * Type definitions for NFTokenModify transaction.
 */
export interface NFTokenModify {
  Account: string;
  AccountTxnID?: string;
  Fee?: string;
  Flags?: number;
  LastLedgerSequence?: number;
  Memos?: Memo[];
  NetworkID?: number;
  NFTokenID: string;
  Owner?: string;
  Sequence?: number;
  Signers?: Signer[];
  SigningPubKey?: string;
  SourceTag?: number;
  TicketSequence?: number;
  TransactionType: "NFTokenModify";
  TxnSignature?: string;
  URI?: null | string;
}

export interface Memo {
  MemoType?: string;
  MemoData?: string;
  MemoFormat?: string;
}

export interface Signer {
  Account: string;
  SigningPubKey: string;
  TxnSignature: string;
}

/**
 * Creates a sample payload for the NFTokenModify XRPL transaction.
 * @param params Partial NFTokenModify fields (must include Account and NFTokenID).
 * @returns The payload object for NFTokenModify.
 */
export function createNFTokenModifyPayload(
  params: Pick<NFTokenModify, "Account" | "NFTokenID"> & Partial<NFTokenModify>
): NFTokenModify {
  return {
    TransactionType: "NFTokenModify",
    ...params,
  };
}

// Example usage:
// const payload = createNFTokenModifyPayload({ Account: "r...", NFTokenID: "00080000...", Flags: 0, URI: "..." });