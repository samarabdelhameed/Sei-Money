// Generated types for Alias contract
export interface AliasQueryClient {
  getAlias: (address: string) => Promise<any>;
  getAddress: (alias: string) => Promise<any>;
  getAllAliases: () => Promise<any>;
}

export interface AliasExecuteMsg {
  register_alias: {
    alias: string;
  };
  update_alias: {
    new_alias: string;
  };
  remove_alias: {};
}

export interface AliasQueryMsg {
  get_alias: {
    address: string;
  };
  get_address: {
    alias: string;
  };
  get_all_aliases: {
    limit?: number;
    start_after?: string;
  };
}

export interface AliasRecord {
  address: string;
  alias: string;
  created_at: number;
  updated_at: number;
}