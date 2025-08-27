// Generated types for Pots contract
export interface PotsQueryClient {
  getPot: (potId: string) => Promise<any>;
  getUserPots: (address: string) => Promise<any>;
  getPotHistory: (potId: string) => Promise<any>;
}

export interface PotsExecuteMsg {
  open_pot: {
    name: string;
    target_amount: string;
    denom: string;
    deadline?: number;
    auto_deposit?: {
      amount: string;
      frequency: number;
    };
  };
  deposit: {
    pot_id: string;
    amount: string;
  };
  withdraw: {
    pot_id: string;
    amount: string;
  };
  close_pot: {
    pot_id: string;
  };
}

export interface PotsQueryMsg {
  get_pot: {
    pot_id: string;
  };
  get_user_pots: {
    address: string;
    limit?: number;
    start_after?: string;
  };
  get_pot_history: {
    pot_id: string;
    limit?: number;
    start_after?: string;
  };
}

export interface Pot {
  id: string;
  name: string;
  owner: string;
  target_amount: string;
  current_amount: string;
  denom: string;
  status: string;
  created_at: number;
  deadline?: number;
  auto_deposit?: {
    amount: string;
    frequency: number;
    last_deposit: number;
  };
}