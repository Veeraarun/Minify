import React, { useState, useRef, useCallback } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Eye
} from 'lucide-react';
import { getApiUrl } from '../services/api';

export default function QualityCheckCard({
  results,
  selectedIndex,
  onSelectIndex,
  onProceedToOutput
}) {
  const [previewMode, setPreviewMode] = useState('slider'); // 'slider', 'side_by_side', or 'toggle'
  const [toggleActive, setToggleActive] = useState('compressed'); // 'original' or 'compressed'
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState(false);
  const sliderContainerRef = useRef(null);

  // Interactive slider drag handlers
  const handleMove = useCallback((clientX) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  if (!results || results.length === 0) return null;

  const current = results[selectedIndex] || results[0];
  const q = current.quality;
  const category = current.category;

  const origPreview = getApiUrl(current.original_preview_url);
  const compPreview = getApiUrl(current.compressed_preview_url);

  // Compute bytes saved
  const bytesSaved = Math.max(0, q.original_size - q.compressed_size);
  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Batch selector tabs */}
      {results.length > 1 && (
        <div className="flex items-center space-x-1.5 bg-dark-900 p-1.5 rounded-xl border border-dark-700 overflow-x-auto">
          {results.map((res, idx) => (
            <button
              key={res.file_id}
              onClick={() => onSelectIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
                idx === selectedIndex
                  ? 'bg-dark-800 text-white shadow-sm border border-dark-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="truncate max-w-[160px]">{res.original_filename}</span>
              <span className="text-accent-emerald font-mono text-[11px] font-semibold">(-{res.quality.reduction_percentage}%)</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Quality & Verification Card */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 sm:p-6 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-800 gap-2">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-accent-emerald">Quality Verification</span>
              <span className="text-dark-600">•</span>
              <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{current.processing_time_ms} ms</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {current.compressed_filename}
            </h2>
          </div>

          <div className="self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40 flex items-center space-x-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
              <span>Optimized & Verified</span>
            </span>
          </div>
        </div>

        {/* 3-Column Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          {/* Size Reduction & Bytes Saved */}
          <div className="p-4 rounded-xl bg-dark-850 border border-dark-750">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Reduction</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30">
                {formatBytes(bytesSaved)} saved
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-accent-emerald font-mono mt-1">
              -{q.reduction_percentage}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              <span className="line-through text-slate-500">{q.original_formatted}</span> → <strong className="text-white">{q.compressed_formatted}</strong>
            </p>
          </div>

          {/* Quality Retention & SSIM */}
          <div className="p-4 rounded-xl bg-dark-850 border border-dark-750">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Fidelity Score</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-primary-300 border border-dark-700">
                {q.is_measured ? 'Measured SSIM' : 'Calculated'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              {q.quality_score}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate" title={q.metric_name}>
              {q.metric_name}
            </p>
          </div>

          {/* Target Size Check or Engine Profile */}
          <div className="p-4 rounded-xl bg-dark-850 border border-dark-750">
            <span className="text-[11px] text-slate-400 font-medium block">Threshold Status</span>
            {q.target_size_bytes ? (
              <div className="mt-1">
                <span className={`text-sm font-bold font-mono ${q.target_reached ? 'text-accent-emerald' : 'text-accent-amber'}`}>
                  {q.target_reached ? 'Target Met ✓' : 'Visual Floor Protected'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Target: {(q.target_size_bytes / (1024 * 1024)).toFixed(1)} MB | Actual: {q.compressed_formatted}
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <span className="text-sm font-semibold text-slate-200 font-mono">Profile Applied</span>
                <p className="text-[11px] text-slate-400 mt-1 truncate" title={current.compression_method}>
                  {current.compression_method}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tradeoff note if present */}
        {q.quality_tradeoff_note && (
          <div className="p-3.5 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-amber-200 text-xs mb-4">
            <span className="font-semibold">Notice: </span>
            <span>{q.quality_tradeoff_note}</span>
          </div>
        )}

        {/* Section: Visual Inspection & Previews */}
        <div className="my-5 pt-4 border-t border-dark-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 gap-2">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Eye className="w-4 h-4 text-primary-400" />
              <span>Inspection Preview</span>
            </div>

            {/* Mode switcher for images */}
            {category === 'image' && (
              <div className="flex items-center space-x-1 bg-dark-850 border border-dark-700 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('slider')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    previewMode === 'slider'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Slider Compare
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('side_by_side')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    previewMode === 'side_by_side'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('toggle')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    previewMode === 'toggle'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A/B Toggle
                </button>
              </div>
            )}
          </div>

          {/* IMAGE PREVIEW MODES */}
          {category === 'image' && (
            <div>
              {/* 1. INTERACTIVE COMPARISON SLIDER */}
              {previewMode === 'slider' && (
                <div className="space-y-2">
                  <div
                    ref={sliderContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                    onClick={(e) => handleMove(e.clientX)}
                    className="relative w-full max-h-96 h-80 sm:h-96 bg-dark-950 rounded-xl border border-dark-750 overflow-hidden select-none cursor-ew-resize group"
                  >
                    {/* Background (Compressed / Minified) */}
                    <img
                      src={compPreview}
                      alt="Compressed"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* Foreground (Original) clipped by sliderPosition */}
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={origPreview}
                          alt="Original"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Draggable Divider Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary-600 border-2 border-white text-white flex items-center justify-center text-xs shadow-md">
                        ⇄
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <span className="px-2 py-1 rounded bg-dark-900/80 backdrop-blur text-slate-200 text-[11px] font-mono border border-dark-700">
                        Original ({q.original_formatted})
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 pointer-events-none">
                      <span className="px-2 py-1 rounded bg-dark-900/80 backdrop-blur text-accent-emerald text-[11px] font-mono border border-dark-700 font-semibold">
                        MINIFY ({q.compressed_formatted})
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-slate-500">
                    Drag the divider across the image to inspect pixel fidelity in real-time.
                  </p>
                </div>
              )}

              {/* 2. SIDE-BY-SIDE MODE */}
              {previewMode === 'side_by_side' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-dark-850 rounded-xl border border-dark-750 p-3 text-center">
                    <div className="flex items-center justify-between mb-2 px-1 text-xs">
                      <span className="font-semibold text-slate-300">Original Master</span>
                      <span className="font-mono text-slate-500">{q.original_formatted}</span>
                    </div>
                    <div className="max-h-64 h-60 flex items-center justify-center bg-dark-950 rounded-lg border border-dark-800 overflow-hidden">
                      <img
                        src={origPreview}
                        alt="Original"
                        className="max-h-60 w-auto object-contain"
                      />
                    </div>
                  </div>

                  <div className="bg-dark-850 rounded-xl border border-primary-500/30 p-3 text-center">
                    <div className="flex items-center justify-between mb-2 px-1 text-xs">
                      <span className="font-semibold text-primary-300">MINIFY Output ({q.quality_score}% SSIM)</span>
                      <span className="font-mono text-accent-emerald font-bold">{q.compressed_formatted}</span>
                    </div>
                    <div className="max-h-64 h-60 flex items-center justify-center bg-dark-950 rounded-lg border border-dark-800 overflow-hidden">
                      <img
                        src={compPreview}
                        alt="Compressed"
                        className="max-h-60 w-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. A/B TOGGLE MODE */}
              {previewMode === 'toggle' && (
                <div className="bg-dark-850 rounded-xl border border-dark-750 p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setToggleActive('original')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        toggleActive === 'original'
                          ? 'bg-slate-200 text-slate-900 shadow-sm'
                          : 'bg-dark-800 border border-dark-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Original ({q.original_formatted})
                    </button>
                    <button
                      type="button"
                      onClick={() => setToggleActive('compressed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        toggleActive === 'compressed'
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-dark-800 border border-dark-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      MINIFY Output ({q.compressed_formatted})
                    </button>
                  </div>
                  <div className="max-h-72 h-72 flex items-center justify-center bg-dark-950 rounded-lg border border-dark-800 overflow-hidden">
                    <img
                      src={toggleActive === 'original' ? origPreview : compPreview}
                      alt="Toggle View"
                      className="max-h-72 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF PREVIEW */}
          {category === 'pdf' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-dark-850 rounded-xl border border-dark-750 p-3 text-center">
                <div className="flex items-center justify-between mb-2 px-1 text-xs">
                  <span className="font-semibold text-slate-300">Original (Page 1)</span>
                  <span className="font-mono text-slate-500">{q.original_formatted}</span>
                </div>
                <div className="max-h-64 h-60 flex items-center justify-center bg-dark-950 rounded-lg border border-dark-800 overflow-hidden mx-auto p-1">
                  <img src={origPreview} alt="Original PDF Page 1" className="max-h-56 w-auto object-contain" />
                </div>
              </div>

              <div className="bg-dark-850 rounded-xl border border-primary-500/30 p-3 text-center">
                <div className="flex items-center justify-between mb-2 px-1 text-xs">
                  <span className="font-semibold text-primary-300">Optimized (Page 1)</span>
                  <span className="font-mono text-accent-emerald font-bold">{q.compressed_formatted}</span>
                </div>
                <div className="max-h-64 h-60 flex items-center justify-center bg-dark-950 rounded-lg border border-dark-800 overflow-hidden mx-auto p-1">
                  <img src={compPreview} alt="Compressed PDF Page 1" className="max-h-56 w-auto object-contain" />
                </div>
              </div>
            </div>
          )}

          {/* VIDEO PREVIEW */}
          {category === 'video' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-dark-850 rounded-xl border border-dark-750 p-3">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-semibold text-slate-300">Original Video</span>
                  <span className="font-mono text-slate-500">{q.original_formatted}</span>
                </div>
                <video controls src={origPreview} className="w-full rounded-lg bg-black aspect-video" />
              </div>

              <div className="bg-dark-850 rounded-xl border border-primary-500/30 p-3">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-semibold text-primary-300">MINIFY Video</span>
                  <span className="font-mono text-accent-emerald font-bold">{q.compressed_formatted}</span>
                </div>
                <video controls src={compPreview} className="w-full rounded-lg bg-black aspect-video" />
              </div>
            </div>
          )}

          {/* AUDIO PREVIEW */}
          {category === 'audio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-dark-850 rounded-xl border border-dark-750 p-3.5">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-semibold text-slate-300">Original Audio Track</span>
                  <span className="font-mono text-slate-500">{q.original_formatted}</span>
                </div>
                <audio controls src={origPreview} className="w-full" />
              </div>

              <div className="bg-dark-850 rounded-xl border border-primary-500/30 p-3.5">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-semibold text-primary-300">MINIFY Audio Track</span>
                  <span className="font-mono text-accent-emerald font-bold">{q.compressed_formatted}</span>
                </div>
                <audio controls src={compPreview} className="w-full" />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-dark-800 flex justify-end">
          <button
            type="button"
            onClick={onProceedToOutput}
            className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <span>Proceed to Output & Download</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
