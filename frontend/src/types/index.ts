export type ExpiryStatus = 'healthy' | 'expiring_soon' | 'expired'

export interface Service {
  id:               number
  // required
  service_name:     string
  entity_name:      string
  expiry_date:      string
  // optional
  location:         string | null
  start_date:       string | null
  status:           string | null
  service_provider: string | null
  account_details:  string | null
  contact_details:  string | null
  nda_status:       string | null
  nda_expire_date:  string | null
  cost:             string | null
  // metadata
  created_at:       string
  updated_at:       string
  // computed
  expiry_status:    ExpiryStatus
  days_remaining:   number
}

export interface ServiceFormData {
  service_name:     string
  entity_name:      string
  expiry_date:      string
  location?:        string
  start_date?:      string
  status?:          string
  service_provider?: string
  account_details?: string
  contact_details?: string
  nda_status?:      string
  nda_expire_date?: string
  cost?:            string
}

export interface DashboardStats {
  total:            number
  healthy:          number
  expiring_soon:    number
  expired:          number
  expiring_next_60: Service[]
  recently_expired: Service[]
}

export interface CSVPreviewRow {
  row:              number
  service_name:     string
  entity_name:      string
  expiry_date:      string
  location?:        string | null
  start_date?:      string | null
  status?:          string | null
  service_provider?: string | null
  account_details?: string | null
  contact_details?: string | null
  nda_status?:      string | null
  nda_expire_date?: string | null
  cost?:            string | null
  is_duplicate:     boolean
  is_valid:         boolean
  error?:           string | null
}

export interface CSVImportResult {
  imported: number
  updated:  number
  skipped:  number
  invalid:  number
  errors:   string[]
}

export interface Settings {
  smtp_host:         string | null
  smtp_port:         number | null
  smtp_username:     string | null
  smtp_from:         string | null
  recipients:        string | null
  scheduler_enabled: boolean
}

export interface ActivityLogEntry {
  id:          number
  action:      string
  description: string | null
  created_at:  string
}

export interface EmailLogEntry {
  id:            number
  service_id:    number
  email_type:    string
  days_before:   number
  recipient:     string
  status:        string
  error_message: string | null
  sent_at:       string
  service_name:  string | null
  entity_name:   string | null
}
