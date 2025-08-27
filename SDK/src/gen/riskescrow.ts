// Generated types for Risk Escrow contract
export interface RiskEscrowQueryClient {
  getCase: (caseId: string) => Promise<any>;
  getUserCases: (address: string) => Promise<any>;
  getCasesByStatus: (status: string) => Promise<any>;
}

export interface RiskEscrowExecuteMsg {
  open_case: {
    counterparty: string;
    amount: string;
    denom: string;
    terms: string;
    deadline?: number;
  };
  accept_case: {
    case_id: string;
  };
  dispute_case: {
    case_id: string;
    reason: string;
  };
  resolve_case: {
    case_id: string;
    resolution: string;
  };
  release_funds: {
    case_id: string;
  };
}

export interface RiskEscrowQueryMsg {
  get_case: {
    case_id: string;
  };
  get_user_cases: {
    address: string;
    limit?: number;
    start_after?: string;
  };
  get_cases_by_status: {
    status: string;
    limit?: number;
    start_after?: string;
  };
}

export interface EscrowCase {
  id: string;
  initiator: string;
  counterparty: string;
  amount: string;
  denom: string;
  terms: string;
  status: string;
  created_at: number;
  deadline?: number;
  resolution?: string;
}