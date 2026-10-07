import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Loader2, 
  ArrowRight, 
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

  // Multi-stage progress state
  const [progressStage, setProgressStage] = useState(0);

  const isBatch = analyzedFiles.length > 1;

  // Presets definition
  const presets = [
    {
      id: 'smart_optimize',
      name: 'Smart Optimize',
      icon: Sparkles,
      desc: 'Perceptually tuned by MINIFY. Preserves key visual details while slashing 50–70% of size.',
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
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      defaultQuality: 80
    },
    {
      id: 'email',
      name: 'Email Safe',
      icon: Mail,
      desc: 'Compressed to comfortably satisfy standard email client attachment limits.',
      badge: 'Compact',
      badgeColor: 'bg-accent-amber/20 text-accent-amber border-accent-amber/40',
      defaultQuality: 70
    },
    {
      id: 'social',
      name: 'Social & Feed',
      icon: Share2,
      desc: 'High chroma fidelity tuned to resist heavy re-compression by social platforms.',
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
      desc: 'Direct control over quality slider, resolution scaling, and container profile.',
      badge: 'Manual',
      badgeColor: 'bg-dark-800 text-slate-300 border-dark-700',
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="bg-dark-900/90 border border-dark-750 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-semibold text-primary-400">Optimization Engine</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">Stage 3 of 5</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Compression Settings
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Select an optimization profile on the left or fine-tune parameters on the right.
            </p>
          </div>
          {isBatch && (
            <span className="px-3 py-1 rounded-full bg-dark-800 text-slate-300 text-xs font-mono border border-dark-750 self-start sm:self-auto">
              Batch ({analyzedFiles.length} files)
            </span>
          )}
        </div>

        {/* 2-COLUMN MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Optimization Profile */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Optimization Profile
              </h3>
              <span className="text-xs text-slate-400">Select preset</span>
            </div>

            <div className="space-y-2.5">
              {presets.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                const isSmart = preset.id === 'smart_optimize';
                const Icon = preset.icon;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/10 shadow-sm ring-1 ring-primary-500/30'
                        : isSmart
                        ? 'border-primary-500/30 bg-dark-850 hover:border-primary-500/60 hover:bg-dark-800'
                        : 'border-dark-750 bg-dark-850/80 hover:border-dark-600 hover:bg-dark-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-400' : isSmart ? 'text-primary-400' : 'text-slate-400'}`} />
                        <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {preset.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pr-2">
                      {preset.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Customization / Fine-tuning */}
          <div className="lg:col-span-7 space-y-5 bg-dark-850/50 p-5 sm:p-6 rounded-2xl border border-dark-750/70">
            <div className="flex items-center justify-between pb-1 border-b border-dark-800">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Fine-tune your optimization
              </h3>
              <span className="text-xs text-slate-400">Custom parameters</span>
            </div>

            {/* Quality vs Size Priority */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-primary-400" />
                  <span>Quality vs. Size Priority</span>
                </label>
                <span className="text-xs font-mono font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
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
                className="w-full accent-primary-500 bg-dark-700 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Smaller footprint (30%)</span>
                <span className="text-slate-400">Balanced (80%)</span>
                <span>Near lossless (100%)</span>
              </div>
            </div>

            {/* Target File Size Threshold */}
            <div className="pt-3 border-t border-dark-800/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-3.5 h-3.5 text-accent-emerald" />
                    <h4 className="text-xs font-semibold text-white">
                      Target File Size Threshold
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Binary search adjusts compression to meet your size ceiling.
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
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-dark-800 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Quick target buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">Quick targets:</span>
                {[1, 2, 5, 10].map((mb) => (
                  <button
                    key={mb}
                    type="button"
                    onClick={() => setTargetSizeMb(mb.toString())}
                    className={`px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
                      targetSizeMb === mb.toString()
                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                        : 'bg-dark-900 border-dark-700 text-slate-300 hover:border-dark-600'
                    }`}
                  >
                    &lt; {mb} MB
                  </button>
                ))}
              </div>
            </div>

            {/* Format & Scaling Grid */}
            <div className="pt-3 border-t border-dark-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Output Format */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
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
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Resolution Scaling
                  </label>
                  <select
                    value={resizePercent}
                    onChange={(e) => setResizePercent(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
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
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Audio Tuning
                  </label>
                  <select
                    value={audioPreset}
                    onChange={(e) => setAudioPreset(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                  >
                    <option value="speech">Voice / Speech (Mono 64k)</option>
                    <option value="music">Music / Hi-Fi (Stereo 160k)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Privacy / Metadata Stripping */}
            <div className="pt-3 border-t border-dark-800/80">
              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stripMetadata}
                  onChange={(e) => setStripMetadata(e.target.checked)}
                  className="mt-0.5 rounded border-dark-700 bg-dark-800 text-primary-500 focus:ring-primary-500 w-4 h-4 shrink-0"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  Strip EXIF geolocation, camera parameters, and container metadata (recommended for privacy)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Progress State Overlay / Banner */}
        {isCompressing && (
          <div className="p-4 rounded-xl bg-dark-850 border border-primary-500/30 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                <span>{stagesText[progressStage]}</span>
              </span>
              <span className="font-mono text-primary-400 text-xs">
                Stage {progressStage + 1} of 5
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-dark-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-500 to-cyan-400 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (progressStage + 1) * 20)}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Primary Action Bar */}
        <div className="pt-5 border-t border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            Perceptual SSIM verification will quantify mathematical fidelity upon completion.
          </p>

          <button
            type="button"
            onClick={handleRun}
            disabled={isCompressing}
            className="h-11 px-7 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold text-xs sm:text-sm transition-all inline-flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 shrink-0"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Optimizing with MINIFY...</span>
              </>
            ) : (
              <>
                <span>
                  {isBatch ? `Optimize ${analyzedFiles.length} Files` : 'Optimize File'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
