const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = (await res.json()) as ApiResponse<{ token: string; refreshToken: string }>;
      if (!res.ok || !json.success) return null;

      localStorage.setItem('token', json.data.token);
      localStorage.setItem('refreshToken', json.data.refreshToken);
      return json.data.token;
    } catch {
      return null;
    }
  }

  private async request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const rawBody = await res.text();

    let json: (ApiResponse<T> & { statusCode?: number }) | null = null;
    if (rawBody.trim().length > 0) {
      try {
        json = JSON.parse(rawBody) as ApiResponse<T> & { statusCode?: number };
      } catch {
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        throw new Error('Invalid JSON response from server');
      }
    }

    if (res.status === 401 && retry && path !== '/auth/login' && path !== '/auth/refresh-token') {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        return this.request<T>(path, options, false);
      }
      clearSession();
      redirectToLogin();
      throw new Error(json?.message || 'Session expired. Please log in again.');
    }

    if (!res.ok) {
      if (res.status === 502 || res.status === 503) {
        throw new Error(
          'Backend unavailable (502). Ensure the API server is running: cd hackthon-alpha/backend && npm run dev'
        );
      }
    }

    if (!res.ok || json?.success === false) {
      const message = json?.message || `Request failed (${res.status})`;
      throw new Error(message);
    }

    if (!json) {
      throw new Error('Empty response from server');
    }

    return json.data;
  }

  login(email: string, password: string) {
    return this.request<{ user: User; token: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  getDashboard() {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  getAlerts(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Alert[]>(`/alerts${qs}`);
  }

  getAlert(id: number) {
    return this.request<AlertDetail>(`/alerts/${id}`);
  }

  startInvestigation(alertId: number) {
    return this.request<Investigation>(`/investigations/start/${alertId}`, { method: 'POST' });
  }

  getInvestigations(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Investigation[]>(`/investigations${qs}`);
  }

  getInvestigation(id: number) {
    return this.request<Investigation>(`/investigations/${id}`);
  }

  getInvestigationReport(id: number) {
    return this.request<InvestigationReport>(`/investigations/${id}/report`);
  }

  getCases(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Case[]>(`/cases${qs}`);
  }

  getCase(id: number) {
    return this.request<CaseDetail>(`/cases/${id}`);
  }

  assignCase(id: number, userId?: number) {
    return this.request(`/cases/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    });
  }

  closeCase(id: number) {
    return this.request(`/cases/${id}/close`, { method: 'PUT' });
  }

  resolveCase(id: number, decision: 'CLEAR' | 'SAR', notes?: string) {
    return this.request<CaseDetail>(`/cases/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ decision, notes }),
    });
  }

  getCustomers(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Customer[]>(`/customers${qs}`);
  }

  getCustomer(id: number) {
    return this.request<CustomerDetail>(`/customers/${id}`);
  }

  getSystemMode() {
    return this.request<{
      llmEnabled: boolean;
      model: string;
      workflow: string;
      screeningMode: 'live' | 'mock';
      dataSources: Record<string, string>;
    }>('/system/mode');
  }
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalAlerts: number;
  openAlerts: number;
  escalatedAlerts: number;
  highRisk: number;
  inProgressInvestigations: number;
  totalInvestigations: number;
  activeCases: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentOpenAlerts: Alert[];
}

export interface Alert {
  id: number;
  alert_code?: string;
  alert_type: string;
  reason?: string;
  risk_score: number;
  severity: string;
  status: string;
  created_at: string;
  customer?: { id: number; name: string; customer_number: string };
}

export interface AlertDetail {
  summary: Alert;
  triggeredRule: string;
  customer: Customer;
  relatedTransaction?: Transaction;
}

export interface Customer {
  id: number;
  customer_number: string;
  name: string;
  occupation?: string;
  country?: string;
  risk_score: number;
  risk_category: string;
  is_pep?: boolean;
}

export interface CustomerDetail {
  profile: Customer;
  accounts: Account[];
  riskInformation: { risk_score: number; risk_category: string };
  alertCount: { total: number; open: number };
  recentTransactions: Transaction[];
}

export interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
}

export interface Transaction {
  id: number;
  amount: number;
  transaction_type: string;
  country?: string;
  transaction_date: string;
}

export interface Investigation {
  id: number;
  alert_id: number;
  status: string;
  ai_decision?: string;
  confidence?: number;
  report_summary?: string;
  alert?: Alert & { customer?: Customer };
  agentResults?: AgentResult[];
}

export interface AgentResult {
  id: number;
  agent_type: string;
  result: Record<string, unknown>;
}

export interface InvestigationReport {
  alertId: string | number;
  investigationStatus: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  stages: Array<{
    name: 'Internal Data Analysis' | 'External Screening' | 'Investigation & Decision';
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    summary: string;
  }>;
  finalDecision: 'CLEAR' | 'ESCALATE' | 'FILE_SAR';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;
  complianceNarrative: string;
  investigationId: number;
  status: string;
  decision: string;
  confidence: number;
  report: string;
  agentResults: Array<{ agent: string; result: Record<string, unknown>; timestamp: string }>;
}

export interface Case {
  id: number;
  case_number: string;
  status: string;
  priority: string;
  summary?: string;
  created_at: string;
  alert_id?: number;
  investigation_id?: number;
  customer?: Customer;
  alert?: Alert;
  investigation?: Pick<Investigation, 'id' | 'ai_decision' | 'confidence' | 'status'>;
}

export interface CaseDetail extends Case {
  investigation?: Investigation;
  sarReports?: Array<{ id: number; report_number: string; narrative: string; status: string }>;
}

export const api = new ApiClient();
