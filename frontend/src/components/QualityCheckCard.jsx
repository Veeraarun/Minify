import React, { useState } from 'react';
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
  if (!results || results.length === 0) return null;

  const current = results[selectedIndex] || results[0];
  const q = current.quality;
  const category = current.category;

  const [previewTab, setPreviewTab] = useState('side_by_side'); // side_by_side or toggle
  const [toggleActive, setToggleActive] = useState('compressed'); // original or compressed

  const origPreview = getApiUrl(current.original_preview_url);
  const compPreview = getApiUrl(current.compressed_preview_url);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Batch selector tabs */}
      {results.length > 1 && (
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {results.map((res, idx) => (
            <button
              key={res.file_id}
              onClick={() => onSelectIndex(idx)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
                idx === selectedIndex
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="truncate max-w-[160px]">{res.original_filename}</span>
              <span className="text-emerald-700 font-mono text-[11px]">(-{res.quality.reduction_percentage}%)</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Quality & Verification Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 truncate">
              {current.compressed_filename}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span>Quality verification complete</span>
              <span>•</span>
              <span className="flex items-center space-x-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{current.processing_time_ms} ms</span>
              </span>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Complete</span>
            </span>
          </div>
        </div>

        {/* 3-Column Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {/* Size Reduction */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Size Reduction</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-0.5">
              -{q.reduction_percentage}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              <span className="line-through">{q.original_formatted}</span> → <strong className="text-slate-800">{q.compressed_formatted}</strong>
            </p>
          </div>

          {/* Quality Retention */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 block">Quality Metric</span>
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 text-slate-700">
                {q.is_measured ? 'Measured SSIM' : 'Estimated'}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
              {q.quality_score}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate" title={q.metric_name}>
              {q.metric_name}
            </p>
          </div>

          {/* Target Size Check */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Target Threshold</span>
            {q.target_size_bytes ? (
              <div className="mt-1">
                <span className={`text-sm font-semibold font-mono ${q.target_reached ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {q.target_reached ? 'Target Met ✓' : 'Floor Protected'}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Target: {(q.target_size_bytes / (1024 * 1024)).toFixed(1)} MB | Actual: {q.compressed_formatted}
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <span className="text-sm font-semibold text-slate-800 font-mono">Profile Applied</span>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {current.compression_method}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tradeoff note if present */}
        {q.quality_tradeoff_note && (
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-4">
            <span className="font-semibold">Note: </span>
            <span>{q.quality_tradeoff_note}</span>
          </div>
        )}

        {/* Section: Previews */}
        <div className="my-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Inspection Preview</span>
            </div>

            {category === 'image' && (
              <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 p-0.5 rounded text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('side_by_side')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    previewTab === 'side_by_side' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('toggle')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    previewTab === 'toggle' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A/B Toggle
                </button>
              </div>
            )}
          </div>

          {/* IMAGE PREVIEW */}
          {category === 'image' && (
            <div>
              {previewTab === 'side_by_side' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Original */}
                  <div className="bg-slate-50 rounded-md border border-slate-200 p-2 text-center">
                    <div className="flex items-center justify-between mb-1.5 px-1 text-xs">
                      <span className="font-medium text-slate-600">Original</span>
                      <span className="font-mono text-slate-500">{q.original_formatted}</span>
                    </div>
                    <div className="max-h-64 flex items-center justify-center bg-white rounded border border-slate-200 overflow-hidden">
                      <img
                        src={origPreview}
                        alt="Original"
                        className="max-h-64 w-auto object-contain"
                      />
                    </div>
                  </div>

                  {/* Compressed */}
                  <div className="bg-slate-50 rounded-md border border-blue-200 p-2 text-center">
                    <div className="flex items-center justify-between mb-1.5 px-1 text-xs">
                      <span className="font-medium text-blue-900">Compressed ({current.quality.quality_score}% SSIM)</span>
                      <span className="font-mono text-emerald-700 font-semibold">{q.compressed_formatted}</span>
                    </div>
                    <div className="max-h-64 flex items-center justify-center bg-white rounded border border-slate-200 overflow-hidden">
                      <img
                        src={compPreview}
                        alt="Compressed"
                        className="max-h-64 w-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-md border border-slate-200 p-3 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setToggleActive('original')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                        toggleActive === 'original' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Original ({q.original_formatted})
                    </button>
                    <button
                      type="button"
                      onClick={() => setToggleActive('compressed')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                        toggleActive === 'compressed' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Compressed ({q.compressed_formatted})
                    </button>
                  </div>
                  <div className="max-h-72 flex items-center justify-center bg-white rounded border border-slate-200 overflow-hidden">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-md border border-slate-200 p-2 text-center">
                <div className="flex items-center justify-between mb-1.5 px-1 text-xs">
                  <span className="font-medium text-slate-600">Original Page 1</span>
                  <span className="font-mono text-slate-500">{q.original_formatted}</span>
                </div>
                <div className="max-h-64 flex items-center justify-center bg-white rounded border border-slate-200 overflow-hidden mx-auto p-1">
                  <img src={origPreview} alt="Original PDF Page 1" className="max-h-60 w-auto object-contain" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-md border border-blue-200 p-2 text-center">
                <div className="flex items-center justify-between mb-1.5 px-1 text-xs">
                  <span className="font-medium text-blue-900">Optimized Page 1</span>
                  <span className="font-mono text-emerald-700 font-semibold">{q.compressed_formatted}</span>
                </div>
                <div className="max-h-64 flex items-center justify-center bg-white rounded border border-slate-200 overflow-hidden mx-auto p-1">
                  <img src={compPreview} alt="Compressed PDF Page 1" className="max-h-60 w-auto object-contain" />
                </div>
              </div>
            </div>
          )}

          {/* VIDEO PREVIEW */}
          {category === 'video' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-md border border-slate-200 p-2">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium text-slate-600">Original Video</span>
                  <span className="font-mono text-slate-500">{q.original_formatted}</span>
                </div>
                <video controls src={origPreview} className="w-full rounded bg-black aspect-video" />
              </div>

              <div className="bg-slate-50 rounded-md border border-blue-200 p-2">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-medium text-blue-900">Compressed Video</span>
                  <span className="font-mono text-emerald-700 font-semibold">{q.compressed_formatted}</span>
                </div>
                <video controls src={compPreview} className="w-full rounded bg-black aspect-video" />
              </div>
            </div>
          )}

          {/* AUDIO PREVIEW */}
          {category === 'audio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-medium text-slate-600">Original Audio</span>
                  <span className="font-mono text-slate-500">{q.original_formatted}</span>
                </div>
                <audio controls src={origPreview} className="w-full" />
              </div>

              <div className="bg-slate-50 rounded-md border border-blue-200 p-3">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-medium text-blue-900">Compressed Audio</span>
                  <span className="font-mono text-emerald-700 font-semibold">{q.compressed_formatted}</span>
                </div>
                <audio controls src={compPreview} className="w-full" />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onProceedToOutput}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
          >
            <span>Proceed to Download</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
