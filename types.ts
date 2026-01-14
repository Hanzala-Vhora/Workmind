
export type Department = 'Sales' | 'Marketing' | 'Finance' | 'Operations' | 'HR' | 'IT' | 'Social Media' | 'Procurement';

export interface ExpertConfig {
  department: Department;
  priority: 'High' | 'Medium' | 'Low';
  outcomes_90d: string;
  core_tasks: string;
  approval_boundaries: string; // "decisions this department must NOT make"
  inputs_outputs: string;
  data_access: string;
}

export interface IntakeData {
  // A. Business Snapshot
  business_name: string;
  website?: string;
  industry: string;
  sub_sector?: string;
  business_model: string;
  stage: string;
  countries_served: string[];
  hq_location: string;
  founders_roles: string;
  primary_contact: string;

  // B. Offer, Customer, and Promise
  main_offer: string;
  icp: string;
  buyer_roles: string;
  main_pain: string;
  promise: string; // "Your promise in one sentence"
  competitors: string[];
  key_objections: string;
  usp: string;

  // C. Revenue and Unit Economics
  revenue_streams: string;
  pricing_model: string;
  price_points: string;
  avg_order_value?: string;
  sales_cycle: string;
  revenue_target_90d: string;
  revenue_target_12m: string;

  // D. Sales and Lead Gen Reality
  lead_sources: string[];
  working_channels: string;
  failing_channels: string;
  sales_mechanism: string;
  crm_tool: string;
  monthly_leads?: string;
  close_rate: string;
  activity_targets?: string;

  // E. Operations and Delivery
  delivery_process: string;
  tool_stack: string[];
  broken_workflows: string;
  time_wasters: string;
  has_sops: 'Yes' | 'No';
  sop_links?: string;
  team_structure: string;
  decision_approver: string;

  // F. Compliance and Risk
  is_regulated: 'Yes' | 'No';
  regulatory_details?: string;
  sensitive_data: string;
  restricted_policies?: string;

  // G. Departments and Agent Scope
  selected_departments: Department[];
  department_configs: Partial<Record<Department, ExpertConfig>>;
  excluded_departments?: string;

  // H. Tone, Brand, and Communication
  brand_tone: string;
  brand_keywords: string;
  writing_samples: string;
  interaction_style: string;
  
  // I. Deliverables and Output Format
  deliverables: string[];
  output_format: string;
  client_facing_needed: 'Yes' | 'No';
  deadline: string;

  // J. References and Constraints
  reference_brands: string;
  hard_constraints: string;
  must_avoid: string;

  // Conditional Fields
  startup_selling_first?: string;
  startup_first_10_plan?: string;
  b2b_account_types?: string;
  b2b_buying_committee?: string;
  b2b_procurement_steps?: string;
  saas_activation_metric?: string;
  saas_churn_risk?: string;
  saas_onboarding?: string;
}

export interface StoredDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  uploadedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: StoredDocument[];
  escalation?: {
    required: boolean;
    reason?: string;
    approver?: string;
  };
}

export interface HubMessage {
  id: string;
  sender: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Conversation {
  id: string;
  department: Department;
  messages: Message[];
  lastUpdated: number;
}
