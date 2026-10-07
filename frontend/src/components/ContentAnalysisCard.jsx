import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2,
  Info
} from 'lucide-react';

export default function ContentAnalysisCard({ 
  analyzedFiles, 
  selectedIndex, 
  onSelectIndex, 
  onProceedToEngine 
}) {
  if (!analyzedFiles || analyzedFiles.length === 0) return null;

  const current = analyzedFiles[selectedIndex] || analyzedFiles[0];
  const file = current.file;
  const content = current.content;
  const rec = current.recommendation;
  const source = current.analyzer_source;

  const isGemini = source.includes('Gemini');

  const getCompressibilityBadge = (c) => {
    switch (c?.toLowerCase()) {
      case 'very high': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'high': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'moderate': 
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'low': 
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default: 
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* File selector tabs if multiple files */}
      {analyzedFiles.length > 1 && (
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {analyzedFiles.map((item, idx) => (
            <button
              key={item.file.id}
              onClick={() => onSelectIndex(idx)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
                idx === selectedIndex
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="truncate max-w-[160px]">{item.file.filename}</span>
              <span className="text-[11px] text-slate-400 font-mono">({item.file.formatted_size})</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 truncate">
              {file.filename}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              File diagnostics & metadata analysis
            </p>
          </div>

          {/* Analyzer Source Badge */}
          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              {isGemini ? (
                <Sparkles className="w-3 h-3 text-blue-600" />
              ) : (
                <Cpu className="w-3 h-3 text-slate-600" />
              )}
              <span>{source}</span>
            </span>
          </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Original Size</span>
            <span className="text-sm font-semibold text-slate-900 font-mono mt-0.5 block">{file.formatted_size}</span>
            <span className="text-[11px] text-slate-400 capitalize">{file.category}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Dimensions / Length</span>
            <span className="text-sm font-semibold text-slate-900 font-mono mt-0.5 block truncate">
              {content.width && content.height
                ? `${content.width} × ${content.height}`
                : content.pages
                ? `${content.pages} ${content.pages > 1 ? 'Pages' : 'Page'}`
                : content.duration
                ? `${content.duration.toFixed(1)}s`
                : 'Standard Stream'}
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              {content.fps ? `${content.fps} FPS` : content.has_transparency ? 'Alpha channel' : 'Primary track'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Content Category</span>
            <span className="text-sm font-semibold text-slate-800 mt-0.5 block truncate" title={content.content_category}>
              {content.content_category}
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              {content.video_codec || content.audio_codec || file.extension.toUpperCase()}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Compressibility</span>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getCompressibilityBadge(content.compressibility)}`}>
                {content.compressibility}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendation Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold text-slate-800">
              Recommended Optimization
            </h4>
            <span className="text-xs font-mono text-emerald-700 font-medium">
              Est. reduction: ~{rec.expected_reduction_percent}%
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            {rec.compression_strategy}
          </p>

          <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500">Target format: </span>
              <span className="text-slate-800 font-semibold uppercase">{rec.recommended_output_format}</span>
            </div>
            <div>
              <span className="text-slate-500">Projected size: </span>
              <span className="text-emerald-700 font-semibold">{rec.expected_output_size_formatted}</span>
            </div>
            <div>
              <span className="text-slate-500">Quality retention: </span>
              <span className="text-slate-800 font-semibold">~{rec.expected_quality_retention}%</span>
            </div>
          </div>
        </div>

        {/* Warnings callout if any */}
        {rec.warnings && rec.warnings.length > 0 && (
          <div className="space-y-2 mb-4">
            {rec.warnings.map((warn, i) => (
              <div key={i} className="flex items-start space-x-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onProceedToEngine}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
          >
            <span>Configure Compression</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
