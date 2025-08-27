// Generated types for Groups contract
export interface GroupsQueryClient {
  getGroup: (groupId: string) => Promise<any>;
  getUserGroups: (address: string) => Promise<any>;
  getGroupMembers: (groupId: string) => Promise<any>;
}

export interface GroupsExecuteMsg {
  create_group: {
    name: string;
    description?: string;
    target_amount: string;
    denom: string;
    deadline?: number;
  };
  join_group: {
    group_id: string;
  };
  contribute: {
    group_id: string;
    amount: string;
  };
  leave_group: {
    group_id: string;
  };
}

export interface GroupsQueryMsg {
  get_group: {
    group_id: string;
  };
  get_user_groups: {
    address: string;
    limit?: number;
    start_after?: string;
  };
  get_group_members: {
    group_id: string;
    limit?: number;
    start_after?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  creator: string;
  target_amount: string;
  current_amount: string;
  denom: string;
  status: string;
  created_at: number;
  deadline?: number;
  members: string[];
}