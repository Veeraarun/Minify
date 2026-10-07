import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WorkflowStepper from './components/WorkflowStepper';
import UploadZone from './components/UploadZone';
import ContentAnalysisCard from './components/ContentAnalysisCard';
import CompressionEngineCard from './components/CompressionEngineCard';
import QualityCheckCard from './components/QualityCheckCard';
import ResultOutputCard from './components/ResultOutputCard';
import AIAssistantDrawer from './components/AIAssistantDrawer';

import { checkHealth, analyzeFile, compressFile, batchCompress } from './services/api';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  // System state
  const [health, setHealth] = useState(null);

  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [analyzedFiles, setAnalyzedFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const [compressionResults, setCompressionResults] = useState([]);
  const [batchZipUrl, setBatchZipUrl] = useState('');

  // Loading & UI states
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Load backend health on launch
  useEffect(() => {
    checkHealth()
      .then((data) => setHealth(data))
      .catch((err) => {
        console.warn('Backend connection issue:', err);
        setToast({
          type: 'error',
          message: 'Could not connect to backend service. Please verify server is running on port 8000.'
        });
      });
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Step 1 -> Step 2: Upload & Analyze files
  const handleFilesSelected = async (filesList) => {
    setIsUploading(true);
    setToast(null);

    const analyzed = [];
    let hasError = false;

    for (const file of filesList) {
      try {
        const result = await analyzeFile(file);
        analyzed.push(result);
      } catch (err) {
        hasError = true;
        showToast('error', `Failed to analyze "${file.name}": ${err.message}`);
      }
    }

    setIsUploading(false);

    if (analyzed.length > 0) {
      setAnalyzedFiles(analyzed);
      setSelectedFileIndex(0);
      setCurrentStep(2);
      showToast('success', `Analyzed ${analyzed.length} ${analyzed.length === 1 ? 'file' : 'files'}.`);
    } else if (!hasError) {
      showToast('error', 'No valid files could be processed.');
    }
  };

  // Step 2 -> Step 3: Proceed from Content Analysis to Compression Engine
  const handleProceedToEngine = () => {
    setCurrentStep(3);
  };

  // Step 3 -> Step 4: Run Compression
  const handleStartCompression = async (options) => {
    setIsCompressing(true);
    setToast(null);

    try {
      if (analyzedFiles.length === 1) {
        // Single file compression
        const targetId = analyzedFiles[0].file.id;
        const res = await compressFile({
          file_id: targetId,
          ...options
        });
        setCompressionResults([res]);
        setBatchZipUrl('');
        setCurrentStep(4);
        showToast('success', 'Compression and quality verification completed.');
      } else {
        // Batch compression
        const fileIds = analyzedFiles.map((f) => f.file.id);
        const batchRes = await batchCompress(fileIds, options);
        setCompressionResults(batchRes.results);
        setBatchZipUrl(batchRes.download_all_zip_url);
        setCurrentStep(4);
        showToast('success', `Batch compressed ${batchRes.results.length} files successfully.`);
      }
    } catch (err) {
      showToast('error', `Compression error: ${err.message}`);
    } finally {
      setIsCompressing(false);
    }
  };

  // Step 4 -> Step 5: Proceed to Download Output
  const handleProceedToOutput = () => {
    setCurrentStep(5);
  };

  // Reset workflow
  const handleResetWorkflow = () => {
    setCurrentStep(1);
    setAnalyzedFiles([]);
    setSelectedFileIndex(0);
    setCompressionResults([]);
    setBatchZipUrl('');
  };

  // Context for AI assistant based on currently active file
  const activeFileContext = analyzedFiles[selectedFileIndex]
    ? {
        filename: analyzedFiles[selectedFileIndex].file.filename,
        category: analyzedFiles[selectedFileIndex].file.category,
        size_bytes: analyzedFiles[selectedFileIndex].file.original_size,
        content_specs: analyzedFiles[selectedFileIndex].content,
        recommendation: analyzedFiles[selectedFileIndex].recommendation
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div
            className={`p-3 rounded-md border shadow-lg flex items-start space-x-2.5 bg-white ${
              toast.type === 'error'
                ? 'border-red-200 border-l-4 border-l-red-600 text-slate-800'
                : 'border-emerald-200 border-l-4 border-l-emerald-600 text-slate-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.message}
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        health={health}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* 5-Step Workflow Stepper */}
      <WorkflowStepper
        currentStep={currentStep}
        onStepClick={(stepId) => setCurrentStep(stepId)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4">
        {/* Step 1: Upload */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center max-w-md mx-auto mb-6 pt-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Smart File Compression
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Reduce image, video, audio, and PDF file sizes while preserving visual and acoustic fidelity.
              </p>
            </div>
            <UploadZone
              onFilesSelected={handleFilesSelected}
              isUploading={isUploading}
              maxFileSizeMb={health?.max_file_size_mb || 100}
            />
          </div>
        )}

        {/* Step 2: Content Analysis */}
        {currentStep === 2 && (
          <ContentAnalysisCard
            analyzedFiles={analyzedFiles}
            selectedIndex={selectedFileIndex}
            onSelectIndex={setSelectedFileIndex}
            onProceedToEngine={handleProceedToEngine}
          />
        )}

        {/* Step 3: Compression Engine */}
        {currentStep === 3 && (
          <CompressionEngineCard
            analyzedFiles={analyzedFiles}
            selectedIndex={selectedFileIndex}
            onStartCompression={handleStartCompression}
            isCompressing={isCompressing}
          />
        )}

        {/* Step 4: Quality Check */}
        {currentStep === 4 && (
          <QualityCheckCard
            results={compressionResults}
            selectedIndex={selectedFileIndex}
            onSelectIndex={setSelectedFileIndex}
            onProceedToOutput={handleProceedToOutput}
          />
        )}

        {/* Step 5: Output */}
        {currentStep === 5 && (
          <ResultOutputCard
            results={compressionResults}
            batchZipUrl={batchZipUrl}
            onReset={handleResetWorkflow}
          />
        )}
      </main>

      {/* AI Assistant Slide-over Drawer */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        currentContext={activeFileContext}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            AI Compressor • Multi-format optimization & quality verification
          </p>
          <p className="font-mono text-slate-400 text-[11px]">
            FastAPI • Pillow • PyMuPDF • FFmpeg • React
          </p>
        </div>
      </footer>
    </div>
  );
}
