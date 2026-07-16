export type UserRole = 'Employee' | 'Contractor' | 'Vendor' | 'Admin' | 'Auditor' | 'Super Admin';

export interface User {
  username: string;
  email: string;
  department: string;
  role: UserRole;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  last_login?: string;
  account_status?: 'Active' | 'Locked' | 'Suspended';
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface PrivilegedActionPayload {
  action: 'READ_RECORD' | 'EXPORT_DATA' | 'GRANT_ROLE' | 'DELETE_RECORD' | 'DISABLE_LOGGING' | 'MODIFIY_PERMISSIONS';
  resource: string;
}

export interface PrivilegedActionResponse {
  success: boolean;
  action: string;
  resource: string;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  triggered_rules: string[];
  step_up_required?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  resource: string;
  ip_address: string;
  success: boolean;
  risk_score: number;
  risk_level: string;
}

export interface SecurityAlert {
  id: string;
  rule_triggered: string;
  description: string;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
}

export interface LockedAccount {
  user_id: string;
  username: string;
  role: UserRole;
  reason: string;
  locked_at: string;
}

export interface IntegrityCheckResponse {
  chain_intact: boolean;
  total_blocks: number;
  last_checked_at: string;
  hash_mismatch_count: number;
}
