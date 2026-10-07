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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-dark-900/90 border border-dark-750 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header Receipt Card */}
        <div className="text-center pb-5 border-b border-dark-800">
          <div className="w-14 h-14 rounded-2xl bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30 flex items-center justify-center mx-auto mb-3.5 shadow-lg">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Optimization Complete
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Successfully optimized {results.length} {results.length === 1 ? 'file' : 'files'} while preserving perceptual fidelity.
          </p>

          {/* Aggregate callout */}
          <div className="inline-flex items-center space-x-3 bg-dark-850/90 border border-dark-750 rounded-xl px-5 py-2.5 mt-4 text-xs sm:text-sm font-mono shadow-sm">
            <span className="text-slate-400">Total Saved: <strong className="text-accent-emerald font-bold">{formatSize(totalSaved)}</strong></span>
            <span className="text-dark-600">·</span>
            <span className="text-slate-400">Net Reduction: <strong className="text-accent-emerald font-bold">{totalPercent}%</strong></span>
          </div>
        </div>

        {/* Global Download Action if batch */}
        {isBatch && batchZipUrl && (
          <div className="p-4 sm:p-5 rounded-xl bg-dark-850/80 border border-primary-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-dark-800 border border-dark-700">
                <Archive className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Download All as ZIP Archive</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Contains all {results.length} optimized files ({formatSize(totalComp)})
                </p>
              </div>
            </div>

            <a
              href={getApiUrl(batchZipUrl)}
              download
              className="h-10 px-5 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold text-xs sm:text-sm transition-all inline-flex items-center space-x-2 shadow-sm shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download ZIP Archive</span>
            </a>
          </div>
        )}

        {/* Result Items List */}
        <div className="divide-y divide-dark-800/80">
          {results.map((res) => {
            const downloadLink = getApiUrl(res.download_url);

            return (
              <div
                key={res.file_id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-dark-850/40 rounded-xl px-2 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-sm">
                      {res.compressed_filename}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 font-mono">
                      -{res.quality.reduction_percentage}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <span className="line-through text-slate-500">{res.quality.original_formatted}</span> → <strong className="text-white">{res.quality.compressed_formatted}</strong>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span>Fidelity: <strong className="text-cyan-300">{res.quality.quality_score}%</strong></span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 truncate max-w-[220px]">{res.compression_method}</span>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-auto">
                  <a
                    href={downloadLink}
                    download={res.compressed_filename}
                    className="h-9 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold text-xs transition-all inline-flex items-center space-x-1.5 shadow-sm"
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
        <div className="p-3.5 rounded-xl bg-dark-850/80 border border-dark-800 flex items-center space-x-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-accent-emerald shrink-0" />
          <span>Files are stored temporarily on ephemeral storage and automatically pruned. Please download your files now.</span>
        </div>

        {/* Bottom Actions: Prominent "Compress another file" */}
        <div className="pt-4 border-t border-dark-800 flex justify-center">
          <button
            type="button"
            onClick={onReset}
            className="h-11 px-7 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold text-xs sm:text-sm transition-all inline-flex items-center space-x-2.5 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Compress another file →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
