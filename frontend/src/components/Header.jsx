import React from 'react';
import { Layers, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header({ health, onOpenAssistant }) {
  const isHealthy = health?.status === 'healthy';
  const hasGemini = health?.gemini_api_configured;
  const hasFFmpeg = health?.ffmpeg_available;

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm sm:text-base text-slate-900 tracking-tight">
                AI Compressor
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Right Status Badges & Assistant Action */}
        <div className="flex items-center space-x-3">
          {/* Engine Status Indicators */}
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1">
            <span className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isHealthy ? 'Engine ready' : 'Connecting...'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500" title={hasFFmpeg ? "FFmpeg ready for Video/Audio" : "FFmpeg not detected"}>
              FFmpeg {hasFFmpeg ? '✓' : '✗'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">
              {hasGemini ? 'Gemini AI' : 'Local Analyzer'}
            </span>
          </div>

          {/* Assistant Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center space-x-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
}
