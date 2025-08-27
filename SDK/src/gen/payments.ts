// Generated types for Payments contract
export interface PaymentsQueryClient {
  getTransfer: (transferId: string) => Promise<any>;
  getUserTransfers: (address: string) => Promise<any>;
  getTransfersByStatus: (status: string) => Promise<any>;
}

export type PaymentsExecuteMsg = 
  | {
      create_transfer: {
        recipient: string;
        amount: string;
        denom: string;
        expiry?: number;
        remark?: string;
      };
    }
  | {
      claim_transfer: {
        transfer_id: string;
      };
    }
  | {
      refund_transfer: {
        transfer_id: string;
      };
    };

export interface PaymentsQueryMsg {
  get_transfer: {
    transfer_id: string;
  };
  get_user_transfers: {
    address: string;
    limit?: number;
    start_after?: string;
  };
  get_transfers_by_status: {
    status: string;
    limit?: number;
    start_after?: string;
  };
}

export interface Transfer {
  id: string;
  sender: string;
  recipient: string;
  amount: string;
  denom: string;
  status: string;
  created_at: number;
  expiry?: number;
  remark?: string;
}