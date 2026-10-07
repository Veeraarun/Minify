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
import { 
  AlertCircle, 
  CheckCircle2, 
  X, 
  BookOpen, 
  ShieldCheck, 
  History, 
  Trash2, 
  Zap
} from 'lucide-react';

const HISTORY_STORAGE_KEY = 'minify_recent_history';

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
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState(null);

  // Load backend health on launch
  useEffect(() => {
    checkHealth()
      .then((data) => setHealth(data))
      .catch((err) => {
        console.warn('Backend connection issue:', err);
        setToast({
          type: 'error',
          message: 'Could not connect to MINIFY backend on port 8000. Please ensure the server is active.'
        });
      });
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Add items to local history
  const recordOptimizationHistory = (resultsList) => {
    try {
      const newEntries = resultsList.map((r) => ({
        id: r.file_id,
        filename: r.compressed_filename,
        original_size: r.quality.original_formatted,
        compressed_size: r.quality.compressed_formatted,
        reduction: r.quality.reduction_percentage,
        score: r.quality.quality_score,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }));

      const updated = [...newEntries, ...historyItems].slice(0, 15);
      setHistoryItems(updated);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save history entry', err);
    }
  };

  const clearHistory = () => {
    setHistoryItems([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    showToast('success', 'Local optimization history cleared.');
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
        recordOptimizationHistory([res]);
        setCurrentStep(4);
        showToast('success', 'Compression and quality verification completed.');
      } else {
        // Batch compression
        const fileIds = analyzedFiles.map((f) => f.file.id);
        const batchRes = await batchCompress(fileIds, options);
        setCompressionResults(batchRes.results);
        setBatchZipUrl(batchRes.download_all_zip_url);
        recordOptimizationHistory(batchRes.results);
        setCurrentStep(4);
        showToast('success', `Batch optimized ${batchRes.results.length} files successfully.`);
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
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-primary-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-fade-in">
          <div
            className={`p-3.5 rounded-xl border shadow-2xl flex items-start space-x-3 bg-dark-900 ${
              toast.type === 'error'
                ? 'border-rose-500/30 text-rose-200'
                : 'border-accent-emerald/30 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-accent-rose mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-accent-emerald mt-0.5" />
            )}
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.message}
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        health={health}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyItems.length}
      />

      {/* 5-Step Workflow Stepper */}
      <WorkflowStepper
        currentStep={currentStep}
        onStepClick={(stepId) => setCurrentStep(stepId)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Step 1: Upload */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto pt-2 pb-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-3">
                <Zap className="w-3.5 h-3.5" />
                <span>Next-generation file optimization engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                MINIFY
              </h1>
              <p className="text-sm sm:text-base font-medium text-slate-300 mt-1">
                Intelligent file optimization
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Compress files intelligently while preserving the quality that matters. Powered by modern codecs and perceptual SSIM verification.
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

      {/* How It Works Modal */}
      {isHowItWorksOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-primary-600/20 text-primary-400 border border-primary-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">How MINIFY Works</h3>
                  <p className="text-xs text-slate-400">5-stage intelligent compression pipeline</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHowItWorksOpen(false)}
                aria-label="Close How It Works dialog"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-dark-850 border border-dark-750 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">1</span>
                <div>
                  <h4 className="font-semibold text-white">Content Diagnostics & Magic Bytes</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    MINIFY inspects the file header signatures and analyzes color entropy, resolution, embedded assets, and container codecs.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-dark-850 border border-dark-750 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">2</span>
                <div>
                  <h4 className="font-semibold text-white">Strategic Profile Selection</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    AI/local analyzers calculate optimal quantization boundaries to prevent visual banding or high-frequency acoustic loss.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-dark-850 border border-dark-750 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">3</span>
                <div>
                  <h4 className="font-semibold text-white">Modern Codec Execution</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Executes WebP/AVIF transforms via Pillow, Deflate object stream pruning with PyMuPDF, and CRF rate-controlled encoding via FFmpeg.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-dark-850 border border-dark-750 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">4</span>
                <div>
                  <h4 className="font-semibold text-white">Structural Quality Verification (SSIM)</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Calculates mathematical structural similarity against the original reference master to guarantee high perceptual fidelity.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-dark-850 border border-dark-750 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">5</span>
                <div>
                  <h4 className="font-semibold text-white">Ephemeral Delivery & Auto-Pruning</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Files are packaged for instant download and automatically purged from the server to guarantee privacy.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHowItWorksOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Privacy Guarantee</h3>
                  <p className="text-xs text-slate-400">Private by design</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                aria-label="Close Privacy dialog"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>No Permanent Storage:</strong> Uploaded and compressed files are stored temporarily on ephemeral disk storage solely to perform the optimization transformation.
              </p>
              <p>
                <strong>Automatic Cleanup:</strong> An automated background cleanup worker systematically purges temporary files.
              </p>
              <p>
                <strong>Metadata Sanitization:</strong> You can choose to strip EXIF location coordinates, camera models, and author names before downloading.
              </p>
              <p>
                <strong>Zero Telemetry:</strong> MINIFY never logs, indexes, or shares the contents of your files.
              </p>
            </div>

            <div className="pt-3 border-t border-dark-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer / Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            onClick={() => setIsHistoryOpen(false)}
            className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-md bg-dark-900 border-l border-dark-700 shadow-2xl h-full flex flex-col z-10">
            <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-850">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-primary-400" />
                <h3 className="font-bold text-white text-sm">Recent Optimizations</h3>
                <span className="px-1.5 py-0.5 rounded bg-dark-800 text-slate-400 text-[10px] font-mono border border-dark-700">
                  {historyItems.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                aria-label="Close History dialog"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <p>No optimization history yet.</p>
                  <p className="mt-1 text-[11px] text-slate-600">Optimized files will be summarized here locally.</p>
                </div>
              ) : (
                historyItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-dark-850 border border-dark-750 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate max-w-[220px]" title={item.filename}>
                        {item.filename}
                      </span>
                      <span className="font-mono text-accent-emerald font-bold">
                        -{item.reduction}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{item.original_size} → {item.compressed_size}</span>
                      <span>Fidelity: {item.score}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      {item.date}
                    </div>
                  </div>
                ))
              )}
            </div>

            {historyItems.length > 0 && (
              <div className="p-3 bg-dark-850 border-t border-dark-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Stored in your browser only</span>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="inline-flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear history</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-dark-800 bg-dark-900/90 py-5 text-xs text-slate-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white tracking-tight">MINIFY</span>
            <span>•</span>
            <span className="text-slate-400">Intelligent file optimization</span>
          </div>
          <div className="text-slate-400 flex items-center space-x-1.5 text-xs">
            <span>Built by Veera Arun V</span>
            <span className="text-slate-600">·</span>
            <a
              href="https://github.com/Veeraarun"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors underline-offset-4 hover:underline"
            >
              GitHub
            </a>
            <span className="text-slate-600">·</span>
            <a
              href="https://linkedin.com/in/veeraarun"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors underline-offset-4 hover:underline"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
