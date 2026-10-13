import React, { useState, useRef } from 'react';
import { UploadCloud, File, FileText, Image as ImageIcon, FileCode, CheckCircle2, AlertTriangle, XCircle, Trash2, RotateCw, Eye, X } from 'lucide-react';
import { Asset } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

interface UploadWorkspaceProps {
  projectId: string;
  assets: Asset[];
  onAssetsUpdated: (assets: Asset[]) => void;
  onProceedToAI: () => void;
}

export const UploadWorkspace: React.FC<UploadWorkspaceProps> = ({
  projectId,
  assets,
  onAssetsUpdated,
  onProceedToAI,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    setUploading(true);
    setUploadProgress(`Uploading and analyzing ${fileList.length} file(s)...`);

    try {
      const newAssets = await api.uploadAssets(projectId, fileList);
      onAssetsUpdated([...assets, ...newAssets]);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (assetId: string) => {
    if (window.confirm('Delete this uploaded asset?')) {
      try {
        await api.deleteAsset(assetId);
        onAssetsUpdated(assets.filter((a) => a.id !== assetId));
      } catch (err) {
        alert('Failed to delete asset');
      }
    }
  };

  const handleRetry = async (assetId: string) => {
    try {
      const updated = await api.retryAsset(assetId);
      onAssetsUpdated(assets.map((a) => (a.id === assetId ? updated : a)));
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-purple-600" />;
    if (mimeType === 'application/pdf') return <FileText className="h-6 w-6 text-rose-600" />;
    if (['py', 'java', 'c', 'cpp', 'js', 'ts', 'html', 'css', 'json', 'sql'].includes(ext || '')) {
      return <FileCode className="h-6 w-6 text-blue-600" />;
    }
    return <File className="h-6 w-6 text-slate-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-600 bg-blue-50/50'
            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          Drop your assignment source files here, or <span className="text-blue-600">browse</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
          Upload screenshots of code/output, handwritten or printed notes, lecture PDFs, Word files (.docx), or source code.
        </p>

        {uploading && (
          <div className="mt-5 max-w-xs mx-auto">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-xs font-medium text-blue-600 mt-2">{uploadProgress}</p>
          </div>
        )}
      </div>

      {/* Uploaded Files Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Uploaded Raw Materials
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {assets.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These files remain securely preserved and provide ground-truth facts for the AI organizer.
            </p>
          </div>

          {assets.length > 0 && (
            <button
              onClick={onProceedToAI}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              Proceed to AI Organization
            </button>
          )}
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No materials uploaded yet. Add files above to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {assets.map((asset) => {
              const charCount = asset.extracted_text?.length || 0;
              const wordCount = asset.metadata?.word_count || (asset.extracted_text ? asset.extracted_text.split(/\s+/).length : 0);

              return (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                      {getFileIcon(asset.mime_type, asset.original_filename)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate" title={asset.original_filename}>
                        {asset.original_filename}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatFileSize(asset.file_size)} • {asset.mime_type.split('/')[1] || 'file'}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        {asset.processing_status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Extracted {wordCount} words
                          </span>
                        )}
                        {asset.processing_status === 'completed_with_warning' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            {asset.metadata?.error_message || 'Minimal text detected'}
                          </span>
                        )}
                        {asset.processing_status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="h-3 w-3" />
                            Extraction Failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {asset.extracted_text && (
                      <button
                        onClick={() => setPreviewAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                        title="View extracted text"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {(asset.processing_status === 'failed' || asset.processing_status === 'completed_with_warning') && (
                      <button
                        onClick={() => handleRetry(asset.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                        title="Retry OCR/Extraction"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                      title="Delete asset"
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

      {/* Extracted Text Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Extracted Text: {previewAsset.original_filename}
              </h3>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap bg-slate-50/30">
              {previewAsset.extracted_text || 'No text extracted.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
