import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  X, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Plus, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.avi', '.mkv', '.pdf', '.mp3', '.wav', '.m4a', '.aac'];

export default function UploadZone({ onFilesSelected, isUploading, maxFileSizeMb = 100 }) {
  const [dragActive, setDragActive] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndAddFiles = (filesList) => {
    setErrorMsg('');
    const newFiles = [];
    const maxBytes = maxFileSizeMb * 1024 * 1024;

    for (const file of filesList) {
      const ext = `.${file.name.split('.').pop().toLowerCase()}`;
      if (!ALLOWED_EXTS.includes(ext)) {
        setErrorMsg(`Format "${ext}" is not supported. Please select JPG, PNG, WebP, MP4, MKV, PDF, MP3, or WAV.`);
        return;
      }
      if (file.size > maxBytes) {
        setErrorMsg(`"${file.name}" exceeds maximum allowed size of ${maxFileSizeMb} MB.`);
        return;
      }
      if (file.size === 0) {
        setErrorMsg(`"${file.name}" is empty (0 bytes).`);
        return;
      }
      newFiles.push(file);
    }

    if (newFiles.length > 0) {
      setQueuedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return <ImageIcon className="w-4 h-4 text-primary-400" />;
    if (['mp4', 'mov', 'mkv', 'avi'].includes(ext)) return <Video className="w-4 h-4 text-accent-cyan" />;
    if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) return <Music className="w-4 h-4 text-accent-emerald" />;
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-accent-amber" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const totalQueuedBytes = queuedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleStartAnalysis = () => {
    if (queuedFiles.length === 0) return;
    onFilesSelected(queuedFiles);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Drop Zone Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all duration-200 cursor-pointer bg-dark-900/60 backdrop-blur ${
          dragActive
            ? 'border-primary-500 bg-primary-500/10 ring-4 ring-primary-500/15'
            : 'border-dark-700/80 hover:border-primary-500/50 hover:bg-dark-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          accept={ALLOWED_EXTS.join(',')}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-dark-800 border border-dark-700 text-primary-400 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-105 group-hover:border-primary-500/40 transition-all duration-200">
          <UploadCloud className="w-7 h-7 text-primary-400 group-hover:text-primary-300 transition-colors" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 tracking-tight">
          Choose files or drag and drop
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
          Images, Videos, Audio, and PDF documents up to {maxFileSizeMb} MB.
        </p>

        {/* Supported format badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="px-2.5 py-1 rounded-md bg-dark-800/80 border border-dark-700 text-slate-300 font-medium">Images (JPG, PNG, WebP)</span>
          <span className="px-2.5 py-1 rounded-md bg-dark-800/80 border border-dark-700 text-slate-300 font-medium">Video (MP4, MKV, MOV)</span>
          <span className="px-2.5 py-1 rounded-md bg-dark-800/80 border border-dark-700 text-slate-300 font-medium">Audio (MP3, WAV, AAC)</span>
          <span className="px-2.5 py-1 rounded-md bg-dark-800/80 border border-dark-700 text-slate-300 font-medium">PDF Documents</span>
        </div>
      </div>

      {/* Trust & Privacy Guarantee */}
      <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 py-0.5">
        <ShieldCheck className="w-4 h-4 text-accent-emerald shrink-0" />
        <span>Private by design · Files are temporarily processed and automatically cleaned up.</span>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-accent-rose" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Queue Card */}
      {queuedFiles.length > 0 && (
        <div className="bg-dark-900/90 border border-dark-750 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-dark-800">
            <div className="flex items-center space-x-2.5">
              <span className="text-sm font-bold text-white tracking-tight">Upload Queue</span>
              <span className="px-2.5 py-0.5 rounded-full bg-dark-800 text-slate-300 text-xs font-mono border border-dark-700">
                {queuedFiles.length} {queuedFiles.length === 1 ? 'file' : 'files'} · {formatSize(totalQueuedBytes)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center space-x-1.5 font-medium transition-colors py-1 px-2 rounded-md hover:bg-dark-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add more files</span>
            </button>
          </div>

          <div className="divide-y divide-dark-800 max-h-64 overflow-y-auto">
            {queuedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between py-3 px-2 hover:bg-dark-850/60 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="p-2 rounded-xl bg-dark-800 border border-dark-700 shrink-0">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-200 truncate">{file.name}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{formatSize(file.size)}</span>
                      <span className="text-dark-600">·</span>
                      <span className="text-accent-emerald flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 inline" />
                        <span>Ready for analysis</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  disabled={isUploading}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-dark-800 rounded-lg transition-colors ml-2"
                  title="Remove from queue"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              MINIFY will inspect metadata, entropy, and optimal codec profiles.
            </span>
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={isUploading}
              className="h-10 px-5 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 shrink-0"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing content...</span>
                </>
              ) : (
                <>
                  <span>Analyze Selected Files</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
