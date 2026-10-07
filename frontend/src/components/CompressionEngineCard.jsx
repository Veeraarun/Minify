import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Loader2, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Sparkles, 
  Globe, 
  Mail, 
  Share2, 
  Zap, 
  Settings2
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

  // Preset modes
  const [selectedPreset, setSelectedPreset] = useState('smart_optimize');
  const [qualitySlider, setQualitySlider] = useState(85);
  const [targetSizeMb, setTargetSizeMb] = useState('');
  const [outputFormat, setOutputFormat] = useState(rec.recommended_output_format || 'webp');
  const [resizePercent, setResizePercent] = useState('100');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [audioPreset, setAudioPreset] = useState(current?.content?.is_speech ? 'speech' : 'music');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Multi-stage progress state
  const [progressStage, setProgressStage] = useState(0);

  const isBatch = analyzedFiles.length > 1;

  // Presets definition
  const presets = [
    {
      id: 'smart_optimize',
      name: 'Smart Optimize',
      icon: Sparkles,
      desc: 'Perceptually tuned by MINIFY engine. Preserves visual details while cutting 50–70% size.',
      badge: 'Recommended',
      badgeColor: 'bg-primary-500/20 text-primary-300 border-primary-500/40',
      defaultQuality: 85
    },
    {
      id: 'web',
      name: 'Web Delivery',
      icon: Globe,
      desc: 'Optimized for high-speed page loads and responsive CDN delivery.',
      badge: 'Fast Load',
      badgeColor: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40',
      defaultQuality: 80
    },
    {
      id: 'email',
      name: 'Email Safe',
      icon: Mail,
      desc: 'Compressed to fit standard email client attachment constraints.',
      badge: 'Compact',
      badgeColor: 'bg-accent-amber/20 text-accent-amber border-accent-amber/40',
      defaultQuality: 70
    },
    {
      id: 'social',
      name: 'Social & Feed',
      icon: Share2,
      desc: 'Sharp colors and high bitrates tuned to resist re-compression by social platforms.',
      badge: 'High Detail',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      defaultQuality: 90
    },
    {
      id: 'max_savings',
      name: 'Maximum Savings',
      icon: Zap,
      desc: 'Aggressive quantization for minimal disk usage. Up to 80–85% reduction.',
      badge: 'Smallest',
      badgeColor: 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/40',
      defaultQuality: 55
    },
    {
      id: 'custom',
      name: 'Custom',
      icon: Settings2,
      desc: 'Manual control over quality slider, resolution scaling, and container format.',
      badge: 'Advanced',
      badgeColor: 'bg-dark-700 text-slate-300 border-dark-600',
      defaultQuality: 80
    }
  ];

  const formatOptions = {
    image: ['webp', 'jpg', 'png', 'gif'],
    video: ['mp4', 'mkv'],
    audio: ['mp3', 'aac', 'wav'],
    pdf: ['pdf']
  }[category] || ['webp'];

  // Update slider when preset changes
  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    const p = presets.find((x) => x.id === presetId);
    if (p && presetId !== 'custom') {
      setQualitySlider(p.defaultQuality);
    }
  };

  // Animate progress stages while compressing
  useEffect(() => {
    if (!isCompressing) return;
    const stages = [1, 2, 3, 4];
    let currentStageIdx = 0;
    const timer = setInterval(() => {
      if (currentStageIdx < stages.length) {
        setProgressStage(stages[currentStageIdx]);
        currentStageIdx++;
      }
    }, 700);
    return () => {
      clearInterval(timer);
      setProgressStage(0);
    };
  }, [isCompressing]);

  const stagesText = [
    "Analyzing content entropy...",
    "Calibrating quantization matrices...",
    "Encoding bitstream...",
    "Computing SSIM quality metric...",
    "Finalizing optimized output..."
  ];

  const handleRun = () => {
    // Map preset to backend quality_preset
    let backendQuality = 'balanced';
    if (selectedPreset === 'max_savings') backendQuality = 'max_compression';
    else if (selectedPreset === 'social') backendQuality = 'high_quality';
    else if (selectedPreset === 'email') backendQuality = 'email';
    else if (selectedPreset === 'web') backendQuality = 'web';
    else if (selectedPreset === 'smart_optimize') backendQuality = 'smart_optimize';
    else if (selectedPreset === 'custom') {
      if (qualitySlider >= 88) backendQuality = 'high_quality';
      else if (qualitySlider <= 60) backendQuality = 'max_compression';
      else backendQuality = 'balanced';
    }

    const options = {
      quality_preset: backendQuality,
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
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 sm:p-6 shadow-xl">
        {/* Header */}
        <div className="pb-4 border-b border-dark-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">Optimization Engine</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Compression Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an optimization profile or set an exact target threshold
            </p>
          </div>
          {isBatch && (
            <span className="px-2.5 py-1 rounded-lg bg-dark-800 text-slate-300 text-xs font-mono border border-dark-700">
              Batch ({analyzedFiles.length} files)
            </span>
          )}
        </div>

        {/* Section 1: Presets Grid */}
        <div className="my-5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
            Choose Optimization Profile
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {presets.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              const Icon = preset.icon;

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/10 shadow-sm ring-1 ring-primary-500/30'
                      : 'border-dark-750 bg-dark-850 hover:border-dark-600 hover:bg-dark-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-400' : 'text-slate-400'}`} />
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {preset.name}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Quality vs Size Slider */}
        <div className="p-4 rounded-xl bg-dark-850 border border-dark-750 my-5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary-400" />
              <span>Quality vs. Size Priority</span>
            </label>
            <span className="text-xs font-mono font-bold text-primary-400">
              {qualitySlider}% fidelity
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="100"
            step="1"
            value={qualitySlider}
            onChange={(e) => {
              setQualitySlider(parseInt(e.target.value, 10));
              if (selectedPreset !== 'custom') setSelectedPreset('custom');
            }}
            className="w-full accent-primary-500 bg-dark-700 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Smaller footprint (30%)</span>
            <span>Balanced (80%)</span>
            <span>Near lossless (100%)</span>
          </div>
        </div>

        {/* Section 3: Exact Target Size Input */}
        <div className="p-4 rounded-xl bg-dark-850 border border-dark-750 my-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Target className="w-3.5 h-3.5 text-accent-emerald" />
                <h4 className="text-xs font-semibold text-white">
                  Target File Size Threshold
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                MINIFY will iteratively test quantization matrices to satisfy your target size.
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="text-xs text-slate-400">Under</span>
              <input
                type="number"
                min="0.1"
                step="0.5"
                placeholder="e.g. 5"
                value={targetSizeMb}
                onChange={(e) => setTargetSizeMb(e.target.value)}
                className="w-20 bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-primary-500"
              />
              <span className="text-xs text-slate-300 font-semibold font-mono">MB</span>
              {targetSizeMb && (
                <button
                  type="button"
                  onClick={() => setTargetSizeMb('')}
                  className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-dark-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick preset chips for target size */}
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-dark-800 text-[11px] text-slate-400">
            <span className="text-[10px] uppercase font-mono text-slate-500">Quick targets:</span>
            {[1, 2, 5, 10].map((mb) => (
              <button
                key={mb}
                type="button"
                onClick={() => setTargetSizeMb(mb.toString())}
                className={`px-2 py-0.5 rounded border text-[11px] font-mono transition-colors ${
                  targetSizeMb === mb.toString()
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-dark-900 border-dark-700 text-slate-300 hover:border-dark-600'
                }`}
              >
                &lt; {mb} MB
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Collapsible Advanced Settings */}
        <div className="border border-dark-750 rounded-xl overflow-hidden my-5">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-3.5 bg-dark-850 hover:bg-dark-800 flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Settings2 className="w-4 h-4 text-slate-400" />
              <span>Advanced settings (Format, Scaling, Metadata)</span>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="p-4 bg-dark-900 border-t border-dark-750 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Output Format */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                    Output Format
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                  >
                    {formatOptions.map((fmt) => (
                      <option key={fmt} value={fmt}>
                        {fmt.toUpperCase()} {fmt === rec.recommended_output_format ? '(Recommended)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resolution Scaling */}
                {['image', 'video'].includes(category) && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                      Resolution Scaling
                    </label>
                    <select
                      value={resizePercent}
                      onChange={(e) => setResizePercent(e.target.value)}
                      className="w-full bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                    >
                      <option value="100">100% (Original Resolution)</option>
                      <option value="75">75% Scale</option>
                      <option value="50">50% Scale</option>
                      <option value="25">25% Scale</option>
                    </select>
                  </div>
                )}

                {/* Audio Presets */}
                {category === 'audio' && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                      Audio Tuning
                    </label>
                    <select
                      value={audioPreset}
                      onChange={(e) => setAudioPreset(e.target.value)}
                      className="w-full bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                    >
                      <option value="speech">Voice / Speech (Mono 64k)</option>
                      <option value="music">Music / Hi-Fi (Stereo 160k)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Metadata Stripping */}
              <div className="pt-2 border-t border-dark-800">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stripMetadata}
                    onChange={(e) => setStripMetadata(e.target.checked)}
                    className="rounded border-dark-700 bg-dark-800 text-primary-500 focus:ring-primary-500 w-4 h-4"
                  />
                  <span className="text-xs text-slate-300">
                    Strip EXIF, GPS location, device tags, and container metadata (recommended for privacy)
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Progress State Overlay / Banner */}
        {isCompressing && (
          <div className="my-5 p-4 rounded-xl bg-dark-850 border border-primary-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                <span>{stagesText[progressStage]}</span>
              </span>
              <span className="font-mono text-primary-400 text-[11px]">
                Stage {progressStage + 1} of 5
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-dark-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-500 to-accent-cyan h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (progressStage + 1) * 20)}%` }}
              />
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-4 border-t border-dark-800 flex justify-end">
          <button
            type="button"
            onClick={handleRun}
            disabled={isCompressing}
            className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-60"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Optimizing with MINIFY...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isBatch ? `Optimize ${analyzedFiles.length} Files` : 'Optimize File'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
