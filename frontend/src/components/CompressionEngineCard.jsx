import React, { useState } from 'react';
import { 
  Target, 
  Loader2, 
  Play
} from 'lucide-react';

export default function CompressionEngineCard({
  analyzedFiles,
  selectedIndex,
  onStartCompression,
  isCompressing
}) {
  const current = analyzedFiles[selectedIndex] || analyzedFiles[0];
  const file = current?.file || {};
  const rec = current?.recommendation || {};
  const category = file.category || 'image';

  // State
  const [qualityPreset, setQualityPreset] = useState(rec.expected_quality_level || 'balanced');
  const [targetSizeMb, setTargetSizeMb] = useState('');
  const [outputFormat, setOutputFormat] = useState(rec.recommended_output_format || 'webp');
  const [resizePercent, setResizePercent] = useState('100');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [audioPreset, setAudioPreset] = useState(current?.content?.is_speech ? 'speech' : 'music');

  const isBatch = analyzedFiles.length > 1;

  const presets = [
    {
      id: 'max_compression',
      name: 'Maximum Compression',
      desc: 'Aggressive compression for smallest file footprint. Up to 75–85% reduction.',
      badge: 'Smallest'
    },
    {
      id: 'balanced',
      name: 'Balanced',
      desc: 'Perceptually tuned optimization. 50–70% size reduction with ~94% fidelity.',
      badge: 'Recommended'
    },
    {
      id: 'high_quality',
      name: 'High Quality',
      desc: 'Conservative quantization for showcases and high-detail graphics.',
      badge: 'High Fidelity'
    },
    {
      id: 'lossless',
      name: 'Lossless / Archival',
      desc: 'Preserves exact mathematical pixels and vectors. Strips overhead only.',
      badge: 'Zero Loss'
    }
  ];

  const formatOptions = {
    image: ['webp', 'jpg', 'png', 'gif'],
    video: ['mp4', 'mkv'],
    audio: ['mp3', 'aac', 'wav'],
    pdf: ['pdf']
  }[category] || ['webp'];

  const handleRun = () => {
    const options = {
      quality_preset: qualityPreset,
      target_size_mb: targetSizeMb ? parseFloat(targetSizeMb) : null,
      output_format: outputFormat,
      resize_percentage: parseInt(resizePercent, 10),
      strip_metadata: stripMetadata,
      audio_preset: category === 'audio' ? audioPreset : null
    };
    onStartCompression(options);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Compression Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an optimization profile or set an exact target file size
            </p>
          </div>
          {isBatch && (
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200">
              Batch ({analyzedFiles.length} files)
            </span>
          )}
        </div>

        {/* Section 1: Quality Presets */}
        <div className="my-5">
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            Preset Profile
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {presets.map((preset) => {
              const isSelected = qualityPreset === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => setQualityPreset(preset.id)}
                  className={`p-3 rounded-md border text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {preset.name}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {preset.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Target Size Input */}
        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 my-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-slate-600" />
                <h4 className="text-xs font-semibold text-slate-800">
                  Target File Size (Optional)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                The engine iteratively tests quantization matrices down to safe visual thresholds.
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500">Under</span>
              <input
                type="number"
                min="0.05"
                step="0.5"
                placeholder="e.g. 5"
                value={targetSizeMb}
                onChange={(e) => setTargetSizeMb(e.target.value)}
                className="w-20 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
              <span className="text-xs text-slate-600 font-medium font-mono">MB</span>
              {targetSizeMb && (
                <button
                  type="button"
                  onClick={() => setTargetSizeMb('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Fine-tuning options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-5">
          {/* Output Format */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
              Output Format
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-600"
            >
              {formatOptions.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt.toUpperCase()} {fmt === rec.recommended_output_format ? '(Recommended)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Scale Resolution (for images/videos) */}
          {['image', 'video'].includes(category) && (
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Resolution Scaling
              </label>
              <select
                value={resizePercent}
                onChange={(e) => setResizePercent(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-600"
              >
                <option value="100">100% (Original)</option>
                <option value="75">75% Scale</option>
                <option value="50">50% Scale</option>
              </select>
            </div>
          )}

          {/* Audio Presets */}
          {category === 'audio' && (
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Audio Tuning
              </label>
              <select
                value={audioPreset}
                onChange={(e) => setAudioPreset(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-600"
              >
                <option value="speech">Voice / Speech (Mono 64k)</option>
                <option value="music">Music / Hi-Fi (Stereo 160k)</option>
              </select>
            </div>
          )}

          {/* Metadata Stripping */}
          <div className="flex items-center sm:pt-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stripMetadata}
                onChange={(e) => setStripMetadata(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-xs text-slate-700">
                Strip EXIF & container metadata
              </span>
            </label>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleRun}
            disabled={isCompressing}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-5 py-2 rounded-md shadow-sm transition-colors disabled:opacity-60"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Compressing files...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isBatch ? `Compress ${analyzedFiles.length} Files` : 'Start Compression'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
