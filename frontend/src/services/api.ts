import { Project, Asset, Section, ProcessingJob, ExportRecord } from '../types';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;
  private tokenProvider: (() => Promise<string | null>) | null = null;

  setAuthToken(token: string | null) {
    this.token = token;
  }

  setAuthTokenProvider(provider: (() => Promise<string | null>) | null) {
    this.tokenProvider = provider;
  }

  getAuthToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.tokenProvider ? await this.tokenProvider() : this.token;
    this.token = token;

    if (!token) {
      throw new Error('Your Supabase session is missing or expired. Please sign in again.');
    }
    headers['Authorization'] = `Bearer ${token}`;

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch (_) {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Health
  async getHealth() {
    const res = await fetch('/health');
    return res.json();
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: { title: string; subject: string; metadata?: any }): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Assets
  async uploadAssets(projectId: string, files: File[]): Promise<Asset[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return this.request<Asset[]>(`/projects/${projectId}/assets`, {
      method: 'POST',
      body: formData,
    });
  }

  async getAssets(projectId: string): Promise<Asset[]> {
    return this.request<Asset[]>(`/projects/${projectId}/assets`);
  }

  async deleteAsset(assetId: string): Promise<void> {
    return this.request<void>(`/assets/${assetId}`, {
      method: 'DELETE',
    });
  }

  async retryAsset(assetId: string): Promise<Asset> {
    return this.request<Asset>(`/assets/${assetId}/retry`, {
      method: 'POST',
    });
  }

  // AI Organize
  async organizeAssignment(projectId: string, payload: { custom_instructions?: string; target_template?: string; selected_asset_ids?: string[] }) {
    return this.request<{ job_id: string; proposal: any; sections: Section[]; status: string }>(
      `/projects/${projectId}/organize`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  // Jobs
  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    return this.request<ProcessingJob>(`/jobs/${jobId}`);
  }

  // Sections
  async getSections(projectId: string): Promise<Section[]> {
    return this.request<Section[]>(`/projects/${projectId}/sections`);
  }

  async saveSections(projectId: string, sections: Partial<Section>[]): Promise<Section[]> {
    return this.request<Section[]>(`/projects/${projectId}/sections`, {
      method: 'PUT',
      body: JSON.stringify({ sections }),
    });
  }

  async createSection(projectId: string, sectionData: Partial<Section>): Promise<Section> {
    return this.request<Section>(`/projects/${projectId}/sections`, {
      method: 'POST',
      body: JSON.stringify(sectionData),
    });
  }

  // Exports
  async createExport(projectId: string, payload: { format: 'pdf' | 'docx'; include_cover_page?: boolean; template?: string }): Promise<ExportRecord> {
    return this.request<ExportRecord>(`/projects/${projectId}/exports`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getExports(projectId: string): Promise<ExportRecord[]> {
    return this.request<ExportRecord[]>(`/projects/${projectId}/exports`);
  }

  getDownloadUrl(exportId: string): string {
    return `/api/exports/${exportId}/download`;
  }
}

export const api = new ApiService();
