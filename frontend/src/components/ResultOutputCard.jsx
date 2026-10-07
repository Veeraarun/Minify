import { 
  Download, 
  Archive, 
  RotateCcw, 
  Check, 
  ShieldCheck
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
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 sm:p-7 shadow-xl">
        {/* Header Receipt Card */}
        <div className="text-center pb-5 border-b border-dark-800">
          <div className="w-12 h-12 rounded-2xl bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Optimization Complete
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Successfully optimized {results.length} {results.length === 1 ? 'file' : 'files'} while preserving fidelity.
          </p>

          {/* Aggregate callout */}
          <div className="inline-flex items-center space-x-3 bg-dark-850 border border-dark-750 rounded-lg px-4 py-2 mt-4 text-xs font-mono">
            <span className="text-slate-400">Total Saved: <strong className="text-accent-emerald font-bold">{formatSize(totalSaved)}</strong></span>
            <span className="text-dark-600">|</span>
            <span className="text-slate-400">Net Reduction: <strong className="text-accent-emerald font-bold">{totalPercent}%</strong></span>
          </div>
        </div>

        {/* Global Download Action if batch */}
        {isBatch && batchZipUrl && (
          <div className="my-5 p-4 rounded-xl bg-dark-850 border border-primary-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-dark-800 border border-dark-700">
                <Archive className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Download All as ZIP Archive</h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Contains all {results.length} optimized files ({formatSize(totalComp)})
                </p>
              </div>
            </div>

            <a
              href={getApiUrl(batchZipUrl)}
              download
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP Archive</span>
            </a>
          </div>
        )}

        {/* Result Items List */}
        <div className="divide-y divide-dark-800 my-4">
          {results.map((res) => {
            const downloadLink = getApiUrl(res.download_url);

            return (
              <div
                key={res.file_id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-white truncate max-w-sm">
                      {res.compressed_filename}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40 font-mono">
                      -{res.quality.reduction_percentage}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span>
                      <span className="line-through text-slate-500">{res.quality.original_formatted}</span> → <strong className="text-slate-200">{res.quality.compressed_formatted}</strong>
                    </span>
                    <span className="text-dark-600">•</span>
                    <span>Fidelity: <strong className="text-white">{res.quality.quality_score}%</strong></span>
                    <span className="text-dark-600">•</span>
                    <span className="text-slate-400 truncate max-w-[200px]">{res.compression_method}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <a
                    href={downloadLink}
                    download={res.compressed_filename}
                    className="inline-flex items-center space-x-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ephemeral Privacy Notice */}
        <div className="my-4 p-3 rounded-lg bg-dark-850 border border-dark-800 flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-accent-emerald shrink-0" />
          <span>Files are stored temporarily on ephemeral storage and automatically pruned. Please download your files now.</span>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-dark-800 flex justify-center">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center space-x-2 border border-dark-700 hover:border-dark-600 bg-dark-800 hover:bg-dark-750 text-slate-200 text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Optimize another file</span>
          </button>
        </div>
      </div>
    </div>
  );
}
