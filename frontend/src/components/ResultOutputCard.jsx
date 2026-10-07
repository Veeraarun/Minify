import React from 'react';
import { 
  Download, 
  Archive, 
  RotateCcw, 
  CheckCircle2, 
  Check
} from 'lucide-react';
import { getApiUrl } from '../services/api';

export default function ResultOutputCard({
  results,
  batchZipUrl,
  onReset
}) {
  if (!results || results.length === 0) return null;

  const isBatch = results.length > 1;

  // Compute aggregate stats
  const totalOrig = results.reduce((acc, r) => acc + r.quality.original_size, 0);
  const totalComp = results.reduce((acc, r) => acc + r.quality.compressed_size, 0);
  const totalSaved = Math.max(0, totalOrig - totalComp);
  const totalPercent = Math.max(0, ((totalSaved / Math.max(1, totalOrig)) * 100).toFixed(1));

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-2">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            Compression Complete
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Successfully processed {results.length} {results.length === 1 ? 'file' : 'files'}
          </p>

          {/* Aggregate callout if batch */}
          {isBatch && (
            <div className="inline-flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded px-3 py-1 mt-3 text-xs font-mono">
              <span className="text-slate-600">Total Saved: <strong className="text-emerald-700">{formatSize(totalSaved)}</strong></span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">Net Reduction: <strong className="text-emerald-700">{totalPercent}%</strong></span>
            </div>
          )}
        </div>

        {/* Global Download Action if batch */}
        {isBatch && batchZipUrl && (
          <div className="my-4 p-3.5 rounded-md bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <Archive className="w-5 h-5 text-slate-600" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Download All Files (.zip)</h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  Archive of {results.length} files ({formatSize(totalComp)})
                </p>
              </div>
            </div>

            <a
              href={getApiUrl(batchZipUrl)}
              download
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-md shadow-sm transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </a>
          </div>
        )}

        {/* Result Items */}
        <div className="divide-y divide-slate-100 my-4">
          {results.map((res) => {
            const downloadLink = getApiUrl(res.download_url);

            return (
              <div
                key={res.file_id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {res.compressed_filename}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      -{res.quality.reduction_percentage}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{res.quality.original_formatted} → <strong className="text-slate-800">{res.quality.compressed_formatted}</strong></span>
                    <span>•</span>
                    <span>Fidelity: {res.quality.quality_score}%</span>
                    <span>•</span>
                    <span className="text-slate-400 truncate max-w-[200px]">{res.compression_method}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <a
                    href={downloadLink}
                    download={res.compressed_filename}
                    className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center space-x-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Compress another file</span>
          </button>
        </div>
      </div>
    </div>
  );
}
