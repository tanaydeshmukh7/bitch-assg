import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { UploadWorkspace } from '../components/workspace/UploadWorkspace';
import { AIWorkspace } from '../components/workspace/AIWorkspace';
import { EditorWorkspace } from '../components/workspace/EditorWorkspace';
import { PreviewExportWorkspace } from '../components/workspace/PreviewExportWorkspace';
import { api } from '../services/api';
import { Project, Asset, Section } from '../types';
import {
  UploadCloud,
  Sparkles,
  Edit3,
  Eye,
  ArrowLeft,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';

export const ProjectWorkspacePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'ai' | 'editor' | 'preview'>('upload');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const loadProjectData = async () => {
      try {
        setLoading(true);
        const [projData, assetsData, sectionsData] = await Promise.all([
          api.getProject(projectId),
          api.getAssets(projectId),
          api.getSections(projectId),
        ]);

        setProject(projData);
        setAssets(assetsData);
        setSections(sectionsData);

        // Smart initial tab selection
        if (sectionsData.length > 0) {
          setActiveTab('editor');
        } else if (assetsData.length > 0) {
          setActiveTab('ai');
        } else {
          setActiveTab('upload');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment project');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading Assignment Studio Workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md text-center shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Assignment Not Found</h2>
            <p className="text-xs text-slate-600 mb-6">{error || 'This project may have been deleted or access was restricted.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'upload', label: '1. Source Materials', icon: UploadCloud, count: assets.length },
    { id: 'ai', label: '2. AI Organization', icon: Sparkles, count: sections.length },
    { id: 'editor', label: '3. Document Editor', icon: Edit3 },
    { id: 'preview', label: '4. A4 Preview & Export', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeProjectTitle={project.title} />

      {/* Subheader & Stage Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="font-semibold text-slate-800 truncate max-w-sm">{project.title}</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px]">
                {project.subject}
              </span>
            </div>
          </div>

          {/* Workflow Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Stage View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <UploadWorkspace
            projectId={project.id}
            assets={assets}
            onAssetsUpdated={(newAssets) => setAssets(newAssets)}
            onProceedToAI={() => setActiveTab('ai')}
          />
        )}

        {activeTab === 'ai' && (
          <AIWorkspace
            project={project}
            assets={assets}
            sections={sections}
            onSectionsUpdated={(newSecs) => setSections(newSecs)}
            onProceedToEditor={() => setActiveTab('editor')}
          />
        )}

        {activeTab === 'editor' && (
          <EditorWorkspace
            project={project}
            sections={sections}
            assets={assets}
            onSectionsUpdated={(newSecs) => setSections(newSecs)}
            onProceedToPreview={() => setActiveTab('preview')}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewExportWorkspace
            project={project}
            sections={sections}
            onReturnToEditor={() => setActiveTab('editor')}
          />
        )}
      </main>
    </div>
  );
};
