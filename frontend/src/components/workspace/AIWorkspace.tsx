import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  Edit2
} from 'lucide-react';
import { Asset, Section, Project } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

interface AIWorkspaceProps {
  project: Project;
  assets: Asset[];
  sections: Section[];
  onSectionsUpdated: (sections: Section[]) => void;
  onProceedToEditor: () => void;
}

export const AIWorkspace: React.FC<AIWorkspaceProps> = ({
  project,
  assets,
  sections,
  onSectionsUpdated,
  onProceedToEditor,
}) => {
  const [organizing, setOrganizing] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [missingFlags, setMissingFlags] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

  const handleRunAI = async () => {
    setOrganizing(true);
    setStatusMsg('Qwen AI is analyzing materials and structuring assignment sections...');
    try {
      const res = await api.organizeAssignment(project.id, {
        custom_instructions: customInstructions.trim() || undefined,
        target_template: project.metadata?.formatting_template || 'academic_standard',
      });

      onSectionsUpdated(res.sections);
      if (res.proposal?.missing_information_flags) {
        setMissingFlags(res.proposal.missing_information_flags);
      }
      setStatusMsg('AI organization complete! Review, reorder, or customize sections below.');
    } catch (err: any) {
      alert(`AI organization error: ${err.message}`);
      setStatusMsg(null);
    } finally {
      setOrganizing(false);
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Update sort order
    const updated = newSections.map((sec, idx) => ({ ...sec, sort_order: idx }));
    onSectionsUpdated(updated);
    try {
      await api.saveSections(project.id, updated);
    } catch (e) {
      console.error('Failed to save section reordering:', e);
    }
  };

  const deleteSection = async (id: string) => {
    const updated = sections.filter((s) => s.id !== id).map((s, idx) => ({ ...s, sort_order: idx }));
    onSectionsUpdated(updated);
    try {
      await api.saveSections(project.id, updated);
    } catch (e) {
      console.error('Failed to save sections after delete:', e);
    }
  };

  const handleAddCustomSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    const newSec: Partial<Section> = {
      project_id: project.id,
      title: newSectionTitle.trim(),
      section_type: 'custom',
      content: { html: '<p>Enter section content here...</p>' },
      sort_order: sections.length,
      source_asset_ids: [],
    };

    try {
      const created = await api.createSection(project.id, newSec);
      onSectionsUpdated([...sections, created]);
      setNewSectionTitle('');
      setShowAddSection(false);
    } catch (err: any) {
      alert(`Failed to add section: ${err.message}`);
    }
  };

  const saveEditedTitle = async (secId: string) => {
    if (!editedTitle.trim()) return;
    const updated = sections.map((s) => (s.id === secId ? { ...s, title: editedTitle.trim() } : s));
    onSectionsUpdated(updated);
    setEditingTitleId(null);
    try {
      await api.saveSections(project.id, updated);
    } catch (e) {
      console.error('Failed to save title update:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Trigger Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Assignment Synthesis & Organization
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Qwen analyzes all {assets.length} uploaded files and structures them into college-level sections.
            </p>
          </div>

          <button
            onClick={handleRunAI}
            disabled={organizing || assets.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all shadow-blue-500/20 disabled:opacity-50 whitespace-nowrap"
          >
            {organizing ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Organizing Materials...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {sections.length > 0 ? 'Re-synthesize with AI' : 'Generate Assignment Structure'}
              </>
            )}
          </button>
        </div>

        {/* Custom Instructions */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Optional Custom Rubric or Focus Instructions for AI:
          </label>
          <input
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g. Emphasize time complexity analysis, include 5 Viva questions, or focus on experimental error margins"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {statusMsg && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Missing info flags */}
        {missingFlags.length > 0 && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Information Gaps Detected by AI:
            </div>
            <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5">
              {missingFlags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Structured Sections Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Assignment Sections Outline
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {sections.length} sections
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and rearrange section sequence. Changes are saved automatically.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddSection(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Section
            </button>
            {sections.length > 0 && (
              <button
                onClick={onProceedToEditor}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                Open in Document Editor
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Add section input modal/inline */}
        {showAddSection && (
          <form onSubmit={handleAddCustomSection} className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="New Section Title (e.g. Future Work, Flowchart)"
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddSection(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
          </form>
        )}

        {sections.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No sections created yet. Click "Generate Assignment Structure" above to generate with AI or add sections manually.
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((sec, idx) => {
              const matchedAssets = assets.filter((a) => sec.source_asset_ids?.includes(a.id));

              return (
                <div
                  key={sec.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5 shrink-0">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>

                    <div className="min-w-0 flex-1">
                      {editingTitleId === sec.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="px-2 py-1 bg-white border border-blue-500 rounded text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => saveEditedTitle(sec.id)}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTitleId(null)}
                            className="text-xs text-slate-400 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {sec.title}
                          </h4>
                          <button
                            onClick={() => { setEditingTitleId(sec.id); setEditedTitle(sec.title); }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title="Rename section"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {sec.section_type}
                        </span>

                        {matchedAssets.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <span>Source:</span>
                            <span className="font-medium truncate max-w-xs">
                              {matchedAssets.map((a) => a.original_filename).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order & Delete actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      disabled={idx === sections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSection(sec.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                      title="Delete section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
