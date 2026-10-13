export interface ProjectMetadata {
  college?: string;
  department?: string;
  class_name?: string;
  student_name?: string;
  roll_number?: string;
  teacher_name?: string;
  instructions?: string;
  formatting_template?: 'academic_standard' | 'lab_report' | 'technical_ieee' | 'modern_clean';
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  metadata: ProjectMetadata;
  status: 'draft' | 'uploaded' | 'organized' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  user_id: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  extracted_text?: string;
  processing_status: 'pending' | 'completed' | 'completed_with_warning' | 'failed';
  metadata: Record<string, any>;
  created_at: string;
}

export interface SectionContent {
  html?: string;
  text?: string;
  confidence_note?: string;
  [key: string]: any;
}

export interface Section {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  section_type: string;
  content: SectionContent;
  sort_order: number;
  source_asset_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ProcessingJob {
  id: string;
  project_id: string;
  user_id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportRecord {
  id: string;
  project_id: string;
  user_id: string;
  format: 'pdf' | 'docx';
  storage_path: string;
  status: string;
  created_at: string;
  download_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
}
