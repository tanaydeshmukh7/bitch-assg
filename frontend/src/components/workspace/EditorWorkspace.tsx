import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Code,
  Undo,
  Redo,
  Save,
  CheckCircle2,
  Clock,
  ImageIcon,
  Plus,
  FileText
} from 'lucide-react';
import { Section, Project, Asset } from '../../types';
import { api } from '../../services/api';

interface EditorWorkspaceProps {
  project: Project;
  sections: Section[];
  assets: Asset[];
  onSectionsUpdated: (sections: Section[]) => void;
  onProceedToPreview: () => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  project,
  sections,
  assets,
  onSectionsUpdated,
  onProceedToPreview,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id || ''
  );
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];
  const autosaveTimerRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs my-3' } },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'border-collapse table-auto w-full border border-slate-300 my-4 text-xs' },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { class: 'border border-slate-300 bg-slate-100 p-2 font-bold text-left' },
      }),
      TableCell.configure({
        HTMLAttributes: { class: 'border border-slate-300 p-2' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-xl max-w-full my-4 border border-slate-200' },
      }),
    ],
    content: activeSection?.content?.html || '<p>Start typing section content...</p>',
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      // Trigger autosave after 1.5 seconds of inactivity
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        handleSave(editor.getHTML());
      }, 1500);
    },
  });

  // When switching section, load new content into editor
  useEffect(() => {
    if (editor && activeSection) {
      const currentHtml = activeSection.content?.html || '';
      if (editor.getHTML() !== currentHtml) {
        editor.commands.setContent(currentHtml);
        setSaveStatus('saved');
      }
    }
  }, [activeSectionId]);

  const handleSave = async (contentHtml?: string) => {
    if (!editor || !activeSection) return;
    const htmlToSave = contentHtml || editor.getHTML();

    setSaveStatus('saving');
    try {
      const updatedSections = sections.map((s) =>
        s.id === activeSection.id
          ? { ...s, content: { ...s.content, html: htmlToSave } }
          : s
      );

      await api.saveSections(project.id, updatedSections);
      onSectionsUpdated(updatedSections);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to save document:', err);
      setSaveStatus('unsaved');
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL (or paste hosted asset URL):');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  const insertPageBreak = () => {
    if (editor) {
      editor.chain().focus().insertContent('<hr style="border: 1px dashed #2563EB; margin: 24px 0;" /><p><em>[Page Break]</em></p>').run();
    }
  };

  if (!editor) return null;

  return (
    <div className="space-y-4">
      {/* Top Header / Save status bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Editing: {activeSection?.title || 'Assignment Document'}
            </h3>
            <p className="text-xs text-slate-500">
              Changes sync directly to the canonical PDF and DOCX export model.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Autosave status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {saveStatus === 'saving' && (
              <>
                <Clock className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                <span className="text-amber-600 font-medium">Autosaving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">
                  {lastSavedTime ? `Saved at ${lastSavedTime}` : 'All changes saved'}
                </span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-amber-600 font-medium">Unsaved changes</span>
            )}
          </div>

          <button
            onClick={() => handleSave()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            Save Now
          </button>

          <button
            onClick={onProceedToPreview}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            A4 Preview & Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Section Navigator Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 px-2">
            Document Sections
          </h4>
          <div className="space-y-1">
            {sections.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                  sec.id === activeSection?.id
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">
                  {idx + 1}. {sec.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Main Canvas */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          {/* Tiptap Formatting Toolbar */}
          <div className="p-2 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center gap-1 text-slate-700">
            {/* History */}
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Typography */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200'}`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200'}`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200'}`}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Headings */}
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200'}`}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200'}`}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200'}`}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Lists */}
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200'}`}
              title="Bulleted List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200'}`}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Alignment */}
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-1.5 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200'}`}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200'}`}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-1.5 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200'}`}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={`p-1.5 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200'}`}
              title="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            {/* Insert Elements */}
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded ${editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200'}`}
              title="Insert Code Block"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={insertTable}
              className="p-1.5 rounded hover:bg-slate-200"
              title="Insert 3x3 Table"
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              onClick={insertImage}
              className="p-1.5 rounded hover:bg-slate-200"
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              onClick={insertPageBreak}
              className="px-2 py-1 text-xs rounded hover:bg-slate-200 font-semibold"
              title="Insert Page Break"
            >
              Page Break
            </button>
          </div>

          {/* Tiptap content canvas */}
          <div className="p-8 sm:p-12 min-h-[500px] prose prose-slate max-w-none focus:outline-none">
            <EditorContent editor={editor} className="outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
