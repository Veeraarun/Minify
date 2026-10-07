import React, { useState, useRef } from 'react';
import { UploadCloud, File, FileText, Image, Video, Music, X, AlertCircle, ArrowRight, Loader2, Plus } from 'lucide-react';

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
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return <Image className="w-4 h-4 text-blue-600" />;
    if (['mp4', 'mov', 'mkv', 'avi'].includes(ext)) return <Video className="w-4 h-4 text-slate-700" />;
    if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) return <Music className="w-4 h-4 text-emerald-600" />;
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-amber-600" />;
    return <File className="w-4 h-4 text-slate-500" />;
  };

  const handleStartAnalysis = () => {
    if (queuedFiles.length === 0) return;
    onFilesSelected(queuedFiles);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 sm:p-10 text-center transition-colors cursor-pointer bg-white ${
          dragActive
            ? 'border-blue-600 bg-blue-50/40'
            : 'border-slate-300 hover:border-slate-400'
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

        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-5 h-5 text-slate-600" />
        </div>

        <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
          Choose files or drag and drop
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Images (JPG, PNG, WebP), Videos (MP4, MKV), Audio (MP3, WAV), and PDF files up to {maxFileSizeMb} MB.
        </p>

        {/* Supported format badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">Images</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">Video</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">Audio</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">PDF</span>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="flex items-center space-x-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Queue Card */}
      {queuedFiles.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-900">Queue</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono">
                {queuedFiles.length} {queuedFiles.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add more</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {queuedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between py-2 px-1 hover:bg-slate-50 rounded"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-1 rounded bg-slate-100 shrink-0">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{formatSize(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  disabled={isUploading}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors ml-2"
                  title="Remove from queue"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Action button */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={isUploading}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-md shadow-sm transition-colors disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing files...</span>
                </>
              ) : (
                <>
                  <span>Analyze Selected Files</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
