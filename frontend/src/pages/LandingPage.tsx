import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import {
  FileText,
  Sparkles,
  UploadCloud,
  FileCode,
  Download,
  CheckCircle,
  Eye,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BookOpen
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI Academic Productivity
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            From Raw Material to <span className="text-blue-600">Submission-Ready</span> Assignments
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Turn code screenshots, handwritten notes, lecture PDFs, and raw output logs into structured, professionally formatted college assignments ready for grading.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth?tab=signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors"
            >
              Explore Live Demo
            </Link>
          </div>

          {/* Supported Inputs Chips */}
          <div className="mt-14 pt-10 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-500 uppercase tracking-wider mr-2">Accepts:</span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium shadow-2xs">Terminal Outputs</span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium shadow-2xs">Handwritten Notes</span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium shadow-2xs">Source Code (.py, .cpp, .java)</span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium shadow-2xs">Lecture PDFs</span>
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-medium shadow-2xs">Word Documents</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How Assignment Studio Works</h2>
            <p className="mt-4 text-slate-600">
              A streamlined 4-step pipeline designed for rigorous engineering, science, and academic submissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Raw Files</h3>
              <p className="text-sm text-slate-600">
                Drag and drop your code snippets, terminal outputs, screenshots, or professor’s assignment instructions.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Extraction & Layout</h3>
              <p className="text-sm text-slate-600">
                OCR extracts text and Qwen3-32B structures the assignment into Aim, Theory, Code, Outputs, Results, and Viva.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Tiptap Rich-Text Edit</h3>
              <p className="text-sm text-slate-600">
                Refine, add images, format code blocks, and preview in real-time A4 pagination with autosave protection.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                04
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">PDF & DOCX Export</h3>
              <p className="text-sm text-slate-600">
                Download a clean, university-formatted PDF with cover sheet or an editable Word .docx file anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Engineered for Academic Integrity</h2>
            <p className="mt-4 text-slate-600">
              Unlike generic chatbot text dumps, Assignment Studio maintains factual fidelity and strictly adheres to assignment criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <FileCode className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Fabricated Outputs</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Code variable names, test values, and execution outputs are preserved faithfully. The engine explicitly flags missing test logs instead of hallucinating results.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">A4 Page Precision</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Live multi-page A4 preview with exact margins, institutional cover sheets, running headers, and page counters.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Native Word & Vector PDF</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Export clean, un-clipped native Word (.docx) files or crisp vector PDFs generated from a shared document model.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Assignment Studio</span>
            <span>— College Academic Workflow</span>
          </div>
          <div>
            Built with React, TypeScript, FastAPI, Supabase, and Qwen
          </div>
        </div>
      </footer>
    </div>
  );
};
