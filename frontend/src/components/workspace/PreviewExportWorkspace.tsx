import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  FileCheck,
  Clock,
  Printer,
  Edit3,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Project, Section, ExportRecord } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

interface PreviewExportWorkspaceProps {
  project: Project;
  sections: Section[];
  onReturnToEditor: () => void;
}

export const PreviewExportWorkspace: React.FC<PreviewExportWorkspaceProps> = ({
  project,
  sections,
  onReturnToEditor,
}) => {
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [template, setTemplate] = useState(project.metadata?.formatting_template || 'academic_standard');
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loadingExports, setLoadingExports] = useState(false);

  const fetchExports = async () => {
    try {
      setLoadingExports(true);
      const data = await api.getExports(project.id);
      setExports(data);
    } catch (e) {
      console.error('Failed to load exports:', e);
    } finally {
      setLoadingExports(false);
    }
  };

  useEffect(() => {
    fetchExports();
  }, [project.id]);

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExporting(format);
    try {
      const record = await api.createExport(project.id, {
        format,
        include_cover_page: includeCoverPage,
        template,
      });

      // Automatically trigger download
      const downloadUrl = api.getDownloadUrl(record.id);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${project.title.replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      fetchExports();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const metadata = project.metadata || {};

  return (
    <div className="space-y-8">
      {/* Export Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export Submission-Ready Document
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Both PDF and DOCX exports are built from the exact same validated canonical model.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={includeCoverPage}
              onChange={(e) => setIncludeCoverPage(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            Include University Cover Page
          </label>

          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all shadow-blue-500/20 disabled:opacity-50"
          >
            {exporting === 'pdf' ? <Clock className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Download PDF (A4)
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors disabled:opacity-50"
          >
            {exporting === 'docx' ? <Clock className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4 text-blue-600" />}
            Download DOCX (Word)
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Print Document"
          >
            <Printer className="h-4 w-4" />
          </button>

          <button
            onClick={onReturnToEditor}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors ml-2"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Back to Editor
          </button>
        </div>
      </div>

      {/* A4 Realistic Page Preview */}
      <div className="flex flex-col items-center gap-8 py-4">
        {/* Page 1: Academic Cover Sheet (if toggled) */}
        {includeCoverPage && (
          <div className="w-full max-w-[794px] min-h-[1123px] bg-white border border-slate-200 shadow-lg rounded-sm p-[60px] sm:p-[80px] flex flex-col justify-between relative text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
            {/* Top: Institution */}
            <div className="text-center">
              {metadata.college ? (
                <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
                  {metadata.college}
                </h1>
              ) : (
                <div className="h-8" />
              )}
              {metadata.department && (
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Department of {metadata.department}
                </p>
              )}
            </div>

            {/* Center: Title & Subject */}
            <div className="text-center my-12">
              <div className="inline-block h-1 w-16 bg-blue-600 mb-6" />
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-600 leading-tight">
                {project.title}
              </h2>
              <p className="text-lg font-bold text-slate-700 mt-4">
                Course: {project.subject}
              </p>
            </div>

            {/* Bottom: Submission Info Boxes */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8 text-xs">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold uppercase tracking-wider text-blue-600 mb-2">SUBMITTED BY:</p>
                <p className="text-slate-800 font-semibold">{metadata.student_name || 'Student Name'}</p>
                <p className="text-slate-600 mt-1">Roll / ID: {metadata.roll_number || 'N/A'}</p>
                {metadata.class_name && <p className="text-slate-600 mt-0.5">Class: {metadata.class_name}</p>}
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold uppercase tracking-wider text-blue-600 mb-2">SUBMITTED TO:</p>
                <p className="text-slate-800 font-semibold">{metadata.teacher_name || 'Course Instructor'}</p>
                <p className="text-slate-600 mt-1">Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Cover page footer */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-400">
              Page 1 (Cover Sheet)
            </div>
          </div>
        )}

        {/* Subsequent Pages: Document Body Sections */}
        <div className="w-full max-w-[794px] min-h-[1123px] bg-white border border-slate-200 shadow-lg rounded-sm p-[60px] sm:p-[80px] flex flex-col justify-between relative text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
          <div>
            {/* Header Rule */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-wider mb-8">
              <span>{project.title}</span>
              <span>{project.subject}</span>
            </div>

            {/* Render sections in order */}
            <div className="space-y-8">
              {sections.map((sec, idx) => (
                <div key={sec.id} className="section-block">
                  <h3 className="text-lg font-bold text-blue-600 pb-1 border-b border-slate-100 mb-3 flex items-center gap-2">
                    <span>{sec.title}</span>
                  </h3>
                  <div
                    className="prose prose-sm prose-slate max-w-none text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sec.content?.html || '<p>No content.</p>' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Body Page Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 mt-12">
            <span>Assignment Studio Verified</span>
            <span>Page 2 of {includeCoverPage ? '2+' : '1+'}</span>
          </div>
        </div>
      </div>

      {/* Export History */}
      {exports.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs print:hidden">
          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Previous Exports History
          </h4>

          <div className="divide-y divide-slate-100">
            {exports.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`uppercase font-bold px-2 py-0.5 rounded text-[10px] ${exp.format === 'pdf' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    {exp.format}
                  </span>
                  <span className="text-slate-700 font-medium truncate max-w-sm">
                    {exp.storage_path.split('/').pop()}
                  </span>
                  <span className="text-slate-400">
                    {new Date(exp.created_at).toLocaleString()}
                  </span>
                </div>

                <a
                  href={api.getDownloadUrl(exp.id)}
                  download
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
