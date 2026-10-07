import { 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  ArrowRight, 
  Info,
  Sliders
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
        return 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/40';
      case 'high': 
        return 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/40';
      case 'moderate': 
        return 'bg-primary-500/20 text-primary-300 border-primary-500/40';
      case 'low': 
        return 'bg-accent-amber/20 text-accent-amber border-accent-amber/40';
      default: 
        return 'bg-dark-800 text-slate-400 border-dark-700';
    }
  };

  // Human-friendly "Why MINIFY chose this" explanation
  const getWhyExplanation = () => {
    if (rec.why_explanation) return rec.why_explanation;
    if (file.category === 'image') {
      if (content.has_transparency) {
        return "Detected an alpha transparency channel. MINIFY maintains lossless alpha preservation while optimizing RGB color quantization with WebP.";
      }
      return "Photographic elements detected with continuous color tones. Discrete cosine & predictive transform encoding will yield maximum space savings without visible loss.";
    }
    if (file.category === 'pdf') {
      return `Document contains ${content.pages || 1} page(s). MINIFY applies PDF stream Deflate compression, font subset pruning, and re-compresses embedded raster objects.`;
    }
    if (file.category === 'video') {
      return "Video stream re-encoding with H.264 CRF rate control and AAC audio quantization removes unnecessary bitrate overhead while preserving temporal sharpness.";
    }
    if (file.category === 'audio') {
      return "Perceptual psychoacoustic model strips frequencies inaudible to the human ear while retaining full stereo image clarity.";
    }
    return "Optimized codec quantization will eliminate redundant bit streams while protecting perceptual fidelity.";
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* File selector tabs if multiple files */}
      {analyzedFiles.length > 1 && (
        <div className="flex items-center space-x-1.5 bg-dark-900 p-1.5 rounded-xl border border-dark-700 overflow-x-auto">
          {analyzedFiles.map((item, idx) => (
            <button
              key={item.file.id}
              onClick={() => onSelectIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
                idx === selectedIndex
                  ? 'bg-dark-800 text-white shadow-sm border border-dark-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="truncate max-w-[160px]">{item.file.filename}</span>
              <span className="text-[11px] text-slate-500 font-mono">({item.file.formatted_size})</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 sm:p-6 shadow-xl">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-800 gap-2">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">File Analysis</span>
              <span className="text-dark-600">•</span>
              <span className="text-xs text-slate-400 uppercase font-mono">{file.extension.replace('.', '')} format</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {file.filename}
            </h2>
          </div>

          {/* Analyzer Source Badge */}
          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-slate-300 text-xs font-medium shadow-inner">
              {isGemini ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                  <span className="text-primary-300 font-semibold">Gemini AI</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">Local analysis</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3.5 bg-dark-850 rounded-xl border border-dark-750">
            <span className="text-[11px] text-slate-400 block font-medium">Original Size</span>
            <span className="text-sm font-semibold text-white font-mono mt-1 block">{file.formatted_size}</span>
            <span className="text-[11px] text-slate-500 capitalize">{file.category}</span>
          </div>

          <div className="p-3.5 bg-dark-850 rounded-xl border border-dark-750">
            <span className="text-[11px] text-slate-400 block font-medium">Dimensions / Length</span>
            <span className="text-sm font-semibold text-white font-mono mt-1 block truncate">
              {content.width && content.height
                ? `${content.width} × ${content.height}`
                : content.pages
                ? `${content.pages} ${content.pages > 1 ? 'Pages' : 'Page'}`
                : content.duration
                ? `${content.duration.toFixed(1)}s`
                : 'Standard Stream'}
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              {content.fps ? `${content.fps} FPS` : content.has_transparency ? 'Alpha channel' : 'Primary track'}
            </span>
          </div>

          <div className="p-3.5 bg-dark-850 rounded-xl border border-dark-750">
            <span className="text-[11px] text-slate-400 block font-medium">Content Category</span>
            <span className="text-sm font-semibold text-slate-200 mt-1 block truncate" title={content.content_category}>
              {content.content_category}
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              {content.video_codec || content.audio_codec || file.extension.toUpperCase()}
            </span>
          </div>

          <div className="p-3.5 bg-dark-850 rounded-xl border border-dark-750">
            <span className="text-[11px] text-slate-400 block font-medium">Compressibility</span>
            <div className="mt-1.5">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCompressibilityBadge(content.compressibility)}`}>
                {content.compressibility}
              </span>
            </div>
          </div>
        </div>

        {/* Recommended Optimization Card */}
        <div className="bg-dark-850 border border-dark-700 rounded-xl p-4 sm:p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-primary-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Recommended Strategy
              </h4>
            </div>
            <span className="text-xs font-mono text-accent-emerald font-semibold px-2 py-0.5 rounded bg-accent-emerald/10 border border-accent-emerald/30">
              Est. savings ~{rec.expected_reduction_percent}%
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {rec.compression_strategy}
          </p>

          {/* "Why MINIFY chose this" rationale */}
          <div className="p-3 rounded-lg bg-dark-900 border border-dark-800 text-xs mb-4">
            <div className="flex items-center space-x-1.5 text-primary-400 font-semibold mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>Why MINIFY chose this</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {getWhyExplanation()}
            </p>
          </div>

          <div className="pt-3 border-t border-dark-800 flex flex-wrap items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500">Output container: </span>
              <span className="text-white font-semibold uppercase">{rec.recommended_output_format}</span>
            </div>
            <div>
              <span className="text-slate-500">Projected size: </span>
              <span className="text-accent-emerald font-semibold">{rec.expected_output_size_formatted}</span>
            </div>
            <div>
              <span className="text-slate-500">Fidelity retention: </span>
              <span className="text-slate-200 font-semibold">~{rec.expected_quality_retention}%</span>
            </div>
          </div>
        </div>

        {/* Warnings callout if any */}
        {rec.warnings && rec.warnings.length > 0 && (
          <div className="space-y-2 mb-4">
            {rec.warnings.map((warn, i) => (
              <div key={i} className="flex items-start space-x-2.5 p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-accent-amber mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-dark-800 flex justify-end">
          <button
            type="button"
            onClick={onProceedToEngine}
            className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <span>Proceed to Compression Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
