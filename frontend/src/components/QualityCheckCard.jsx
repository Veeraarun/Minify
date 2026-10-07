import React, { useState, useRef, useCallback } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Eye,
  SlidersHorizontal,
  Columns2,
  ToggleLeft
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
  
  const sliderContainerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Synchronized before/after slider drag handlers
  const updateSliderPosition = useCallback((clientX) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    updateSliderPosition(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    updateSliderPosition(e.clientX);
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + 5));
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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Batch selector tabs */}
      {results.length > 1 && (
        <div className="flex items-center space-x-2 bg-dark-900/90 p-2 rounded-xl border border-dark-750 overflow-x-auto">
          {results.map((res, idx) => (
            <button
              key={res.file_id}
              onClick={() => onSelectIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
                idx === selectedIndex
                  ? 'bg-dark-800 text-white shadow-sm border border-dark-600 ring-1 ring-primary-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="truncate max-w-[160px]">{res.original_filename}</span>
              <span className="text-accent-emerald font-mono text-xs font-semibold">(-{res.quality.reduction_percentage}%)</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Quality & Verification Card */}
      <div className="bg-dark-900/90 border border-dark-750 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-800 gap-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-semibold text-accent-emerald flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                <span>Verification Complete</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{current.processing_time_ms} ms</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-xl">
              {current.compressed_filename}
            </h2>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 flex items-center space-x-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
              <span>Optimized & Verified</span>
            </span>
          </div>
        </div>

        {/* 3-Column Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Size Reduction & Bytes Saved */}
          <div className="p-4 sm:p-5 rounded-xl bg-dark-850/80 border border-dark-750/70">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Reduction</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 font-medium">
                {formatBytes(bytesSaved)} saved
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-accent-emerald font-mono mt-1.5">
              -{q.reduction_percentage}%
            </div>
            <p className="text-xs text-slate-400 mt-1.5 font-mono">
              <span className="line-through text-slate-500">{q.original_formatted}</span> → <strong className="text-white">{q.compressed_formatted}</strong>
            </p>
          </div>

          {/* Quality Retention & SSIM */}
          <div className="p-4 sm:p-5 rounded-xl bg-dark-850/80 border border-dark-750/70">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Fidelity Score</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-dark-800 text-cyan-300 border border-dark-700 font-medium">
                {q.is_measured ? 'Measured SSIM' : 'Calculated'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1.5">
              {q.quality_score}%
            </div>
            <p className="text-xs text-slate-400 mt-1.5 truncate" title={q.metric_name}>
              {q.metric_name}
            </p>
          </div>

          {/* Target Size Check or Engine Profile */}
          <div className="p-4 sm:p-5 rounded-xl bg-dark-850/80 border border-dark-750/70">
            <span className="text-xs text-slate-400 font-medium block">Threshold Status</span>
            {q.target_size_bytes ? (
              <div className="mt-1.5">
                <span className={`text-base font-bold font-mono ${q.target_reached ? 'text-accent-emerald' : 'text-accent-amber'}`}>
                  {q.target_reached ? 'Target Ceiling Met ✓' : 'Visual Floor Protected'}
                </span>
                <p className="text-xs text-slate-400 mt-1.5 font-mono">
                  Target: {(q.target_size_bytes / (1024 * 1024)).toFixed(1)} MB | Actual: {q.compressed_formatted}
                </p>
              </div>
            ) : (
              <div className="mt-1.5">
                <span className="text-base font-semibold text-slate-200 font-mono">Profile Applied</span>
                <p className="text-xs text-slate-400 mt-1.5 truncate" title={current.compression_method}>
                  {current.compression_method}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tradeoff note if present */}
        {q.quality_tradeoff_note && (
          <div className="p-3.5 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-amber-200 text-xs">
            <span className="font-semibold">Notice: </span>
            <span>{q.quality_tradeoff_note}</span>
          </div>
        )}

        {/* Section: Visual Inspection & Previews */}
        <div className="pt-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-dark-800 gap-2">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Inspection Preview</span>
            </div>

            {/* Mode switcher for images */}
            {category === 'image' && (
              <div className="flex items-center space-x-1 bg-dark-850 border border-dark-700 p-1 rounded-lg text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPreviewMode('slider')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                    previewMode === 'slider'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Split Slider</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('side_by_side')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                    previewMode === 'side_by_side'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('toggle')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                    previewMode === 'toggle'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ToggleLeft className="w-3.5 h-3.5" />
                  <span>A/B Toggle</span>
                </button>
              </div>
            )}
          </div>

          {/* IMAGE PREVIEW MODES */}
          {category === 'image' && (
            <div>
              {/* 1. SYNCHRONIZED SPLIT SLIDER */}
              {previewMode === 'slider' && (
                <div className="space-y-2.5">
                  <div
                    ref={sliderContainerRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="Before and after image comparison slider"
                    aria-valuenow={Math.round(sliderPosition)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    onKeyDown={handleKeyDown}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="relative w-full h-80 sm:h-[460px] bg-dark-950 rounded-2xl border border-dark-750 overflow-hidden select-none touch-none cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {/* Base Layer: MINIFY Optimized Image */}
                    <img
                      src={compPreview}
                      alt="MINIFY Optimized"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    />

                    {/* Overlay Layer: Original Master Image clipped strictly to sliderPosition */}
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
                      style={{
                        clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`
                      }}
                    >
                      <img
                        src={origPreview}
                        alt="Original Master"
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                      />
                    </div>

                    {/* Draggable Divider Line & Knob */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none z-20"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-primary-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold pointer-events-auto cursor-ew-resize transition-transform active:scale-110">
                        <span className="select-none tracking-tight font-mono text-[11px]">◀▶</span>
                      </div>
                    </div>

                    {/* Informational badges */}
                    <div className="absolute top-3.5 left-3.5 z-30 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-md bg-dark-900/85 backdrop-blur text-slate-200 text-xs font-mono border border-dark-700 shadow-md">
                        Original ({q.original_formatted})
                      </span>
                    </div>
                    <div className="absolute top-3.5 right-3.5 z-30 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-md bg-dark-900/85 backdrop-blur text-accent-emerald text-xs font-mono border border-dark-700 shadow-md font-semibold">
                        MINIFY ({q.compressed_formatted})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-center text-slate-400">
                    Drag the divider across the canvas or use the Arrow keys to inspect pixel-by-pixel fidelity.
                  </p>
                </div>
              )}

              {/* 2. SIDE-BY-SIDE MODE */}
              {previewMode === 'side_by_side' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-dark-850/80 rounded-2xl border border-dark-750 p-4 text-center space-y-2">
                    <div className="flex items-center justify-between px-1 text-xs">
                      <span className="font-semibold text-slate-300">Original Master</span>
                      <span className="font-mono text-slate-400">{q.original_formatted}</span>
                    </div>
                    <div className="h-72 sm:h-80 flex items-center justify-center bg-dark-950 rounded-xl border border-dark-800 overflow-hidden p-2">
                      <img
                        src={origPreview}
                        alt="Original"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="bg-dark-850/80 rounded-2xl border border-primary-500/30 p-4 text-center space-y-2">
                    <div className="flex items-center justify-between px-1 text-xs">
                      <span className="font-semibold text-primary-300">MINIFY Output ({q.quality_score}% SSIM)</span>
                      <span className="font-mono text-accent-emerald font-bold">{q.compressed_formatted}</span>
                    </div>
                    <div className="h-72 sm:h-80 flex items-center justify-center bg-dark-950 rounded-xl border border-dark-800 overflow-hidden p-2">
                      <img
                        src={compPreview}
                        alt="Compressed"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. A/B TOGGLE MODE */}
              {previewMode === 'toggle' && (
                <div className="bg-dark-850/80 rounded-2xl border border-dark-750 p-5 text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setToggleActive('original')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        toggleActive === 'original'
                          ? 'bg-slate-200 text-slate-900 shadow-sm font-semibold'
                          : 'bg-dark-800 border border-dark-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Original ({q.original_formatted})
                    </button>
                    <button
                      type="button"
                      onClick={() => setToggleActive('compressed')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        toggleActive === 'compressed'
                          ? 'bg-primary-600 text-white shadow-sm font-semibold'
                          : 'bg-dark-800 border border-dark-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      MINIFY Output ({q.compressed_formatted})
                    </button>
                  </div>
                  <div className="h-80 sm:h-96 flex items-center justify-center bg-dark-950 rounded-xl border border-dark-800 overflow-hidden p-3">
                    <img
                      src={toggleActive === 'original' ? origPreview : compPreview}
                      alt="Toggle View"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF PREVIEW */}
          {category === 'pdf' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-dark-850/80 rounded-2xl border border-dark-750 p-4 text-center space-y-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-semibold text-slate-300">Original (Page 1)</span>
                  <span className="font-mono text-slate-400">{q.original_formatted}</span>
                </div>
                <div className="h-72 sm:h-80 flex items-center justify-center bg-dark-950 rounded-xl border border-dark-800 overflow-hidden p-2">
                  <img src={origPreview} alt="Original PDF Page 1" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              <div className="bg-dark-850/80 rounded-2xl border border-primary-500/30 p-4 text-center space-y-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-semibold text-primary-300">Optimized (Page 1)</span>
                  <span className="font-mono text-accent-emerald font-bold">{q.compressed_formatted}</span>
                </div>
                <div className="h-72 sm:h-80 flex items-center justify-center bg-dark-950 rounded-xl border border-dark-800 overflow-hidden p-2">
                  <img src={compPreview} alt="Compressed PDF Page 1" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            </div>
          )}

          {/* VIDEO PREVIEW */}
          {category === 'video' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-dark-850/80 rounded-2xl border border-dark-750 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Original Video</span>
                  <span className="font-mono text-slate-400">{q.original_formatted}</span>
                </div>
                <video controls src={origPreview} className="w-full rounded-xl bg-black aspect-video" />
              </div>

              <div className="bg-dark-850/80 rounded-2xl border border-primary-500/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary-300">MINIFY Video</span>
                  <span className="font-mono text-accent-emerald font-bold">{q.compressed_formatted}</span>
                </div>
                <video controls src={compPreview} className="w-full rounded-xl bg-black aspect-video" />
              </div>
            </div>
          )}

          {/* AUDIO PREVIEW */}
          {category === 'audio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-dark-850/80 rounded-2xl border border-dark-750 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Original Audio Track</span>
                  <span className="font-mono text-slate-400">{q.original_formatted}</span>
                </div>
                <audio controls src={origPreview} className="w-full mt-2" />
              </div>

              <div className="bg-dark-850/80 rounded-2xl border border-primary-500/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary-300">MINIFY Audio Track</span>
                  <span className="font-mono text-accent-emerald font-bold">{q.compressed_formatted}</span>
                </div>
                <audio controls src={compPreview} className="w-full mt-2" />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-dark-800 flex justify-end">
          <button
            type="button"
            onClick={onProceedToOutput}
            className="h-11 px-6 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold text-xs sm:text-sm transition-all inline-flex items-center space-x-2 shadow-sm"
          >
            <span>Proceed to Output & Download</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
