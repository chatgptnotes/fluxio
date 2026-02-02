export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Company Settings for email reports
export interface CompanySettings {
  dailyReportEnabled?: boolean
  reportRecipients?: 'operators' | 'admins' | 'all'
}

// Email Report Log Status
export type EmailReportStatus = 'pending' | 'sent' | 'failed'

// Email Report Log Row
export interface EmailReportLog {
  id: string
  company_id: string
  report_date: string
  recipients: string[]
  status: EmailReportStatus
  error_message: string | null
  file_path: string | null
  sent_at: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          device_id: string
          device_name: string
          device_type: string
          location: string | null
          description: string | null
          status: 'active' | 'inactive' | 'maintenance' | 'error'
          created_at: string
          updated_at: string
          last_seen: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          device_id: string
          device_name: string
          device_type?: string
          location?: string | null
          description?: string | null
          status?: 'active' | 'inactive' | 'maintenance' | 'error'
          created_at?: string
          updated_at?: string
          last_seen?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          device_id?: string
          device_name?: string
          device_type?: string
          location?: string | null
          description?: string | null
          status?: 'active' | 'inactive' | 'maintenance' | 'error'
          created_at?: string
          updated_at?: string
          last_seen?: string | null
          metadata?: Json
        }
      }
      flow_data: {
        Row: {
          id: number
          device_id: string
          flow_rate: number | null
          totalizer: number | null
          temperature: number | null
          pressure: number | null
          battery_level: number | null
          signal_strength: number | null
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: number
          device_id: string
          flow_rate?: number | null
          totalizer?: number | null
          temperature?: number | null
          pressure?: number | null
          battery_level?: number | null
          signal_strength?: number | null
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: number
          device_id?: string
          flow_rate?: number | null
          totalizer?: number | null
          temperature?: number | null
          pressure?: number | null
          battery_level?: number | null
          signal_strength?: number | null
          created_at?: string
          metadata?: Json
        }
      }
      alerts: {
        Row: {
          id: string
          device_id: string
          alert_type:
            | 'high_flow'
            | 'low_flow'
            | 'no_data'
            | 'device_offline'
            | 'battery_low'
            | 'custom'
          severity: 'info' | 'warning' | 'critical'
          message: string
          threshold_value: number | null
          actual_value: number | null
          is_resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          device_id: string
          alert_type:
            | 'high_flow'
            | 'low_flow'
            | 'no_data'
            | 'device_offline'
            | 'battery_low'
            | 'custom'
          severity?: 'info' | 'warning' | 'critical'
          message: string
          threshold_value?: number | null
          actual_value?: number | null
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          device_id?: string
          alert_type?:
            | 'high_flow'
            | 'low_flow'
            | 'no_data'
            | 'device_offline'
            | 'battery_low'
            | 'custom'
          severity?: 'info' | 'warning' | 'critical'
          message?: string
          threshold_value?: number | null
          actual_value?: number | null
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          metadata?: Json
        }
      }
      alert_rules: {
        Row: {
          id: string
          device_id: string
          rule_name: string
          rule_type:
            | 'high_flow'
            | 'low_flow'
            | 'no_data'
            | 'device_offline'
            | 'battery_low'
          threshold_value: number | null
          duration_minutes: number
          severity: 'info' | 'warning' | 'critical'
          is_enabled: boolean
          notification_channels: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_id: string
          rule_name: string
          rule_type:
            | 'high_flow'
            | 'low_flow'
            | 'no_data'
            | 'device_offline'
            | 'battery_low'
          threshold_value?: number | null
          duration_minutes?: number
          severity?: 'info' | 'warning' | 'critical'
          is_enabled?: boolean
          notification_channels?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          rule_name?: string
          rule_type?:
            | 'high_flow'
            | 'low_flow'
            | 'no_data'
            | 'device_offline'
            | 'battery_low'
          threshold_value?: number | null
          duration_minutes?: number
          severity?: 'info' | 'warning' | 'critical'
          is_enabled?: boolean
          notification_channels?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'operator' | 'viewer'
          is_active: boolean
          created_at: string
          updated_at: string
          username: string | null
          password_hash: string | null
          is_superadmin: boolean
          company_id: string | null
          permissions: Json
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'operator' | 'viewer'
          is_active?: boolean
          created_at?: string
          updated_at?: string
          username?: string | null
          password_hash?: string | null
          is_superadmin?: boolean
          company_id?: string | null
          permissions?: Json
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'operator' | 'viewer'
          is_active?: boolean
          created_at?: string
          updated_at?: string
          username?: string | null
          password_hash?: string | null
          is_superadmin?: boolean
          company_id?: string | null
          permissions?: Json
          last_login?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          settings: CompanySettings
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          settings?: CompanySettings
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          settings?: CompanySettings
        }
      }
      email_report_logs: {
        Row: EmailReportLog
        Insert: {
          id?: string
          company_id: string
          report_date: string
          recipients: string[]
          status?: EmailReportStatus
          error_message?: string | null
          file_path?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          report_date?: string
          recipients?: string[]
          status?: EmailReportStatus
          error_message?: string | null
          file_path?: string | null
          sent_at?: string | null
          created_at?: string
        }
      }
      user_pipeline_access: {
        Row: {
          id: string
          user_id: string
          pipeline_id: string
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pipeline_id: string
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pipeline_id?: string
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      permission_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          expires_at: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          expires_at: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          expires_at?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      dashboard_summary: {
        Row: {
          total_devices: number | null
          active_devices: number | null
          online_devices: number | null
          active_alerts: number | null
          critical_alerts: number | null
        }
      }
    }
    Functions: {
      get_latest_flow_data: {
        Args: Record<string, never>
        Returns: {
          device_id: string
          flow_rate: number | null
          totalizer: number | null
          temperature: number | null
          pressure: number | null
          created_at: string
        }[]
      }
      get_flow_statistics: {
        Args: {
          p_device_id: string
          p_start_time: string
          p_end_time: string
        }
        Returns: {
          avg_flow_rate: number | null
          min_flow_rate: number | null
          max_flow_rate: number | null
          total_volume: number | null
          data_points: number | null
        }[]
      }
    }
  }
}
