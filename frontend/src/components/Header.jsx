import React from 'react';
import { Layers, HelpCircle, Shield, BookOpen, History, Cpu, Sparkles } from 'lucide-react';

export default function Header({
  health,
  onOpenAssistant,
  onOpenHowItWorks,
  onOpenPrivacy,
  onOpenHistory,
  historyCount = 0
}) {
  const isHealthy = health?.status === 'healthy';
  const hasGemini = health?.gemini_api_configured;
  const hasFFmpeg = health?.ffmpeg_available;

  return (
    <header className="border-b border-dark-700 bg-dark-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Nav */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 cursor-pointer select-none">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                  MINIFY
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-slate-400 border border-dark-700">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                Intelligent file optimization
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs">
            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-dark-800 transition-colors flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>How it works</span>
            </button>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-dark-800 transition-colors flex items-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Privacy</span>
            </button>
            {historyCount > 0 && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-dark-800 transition-colors flex items-center space-x-1.5"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>History</span>
                <span className="px-1 py-0.2 rounded-full bg-primary-500/20 text-primary-400 text-[10px] font-mono">
                  {historyCount}
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Status Badges & Assistant Action */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Engine Status Indicators */}
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-300 bg-dark-800/80 border border-dark-700 rounded-md px-3 py-1.5">
            <span className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${isHealthy ? 'bg-accent-emerald animate-pulse' : 'bg-accent-rose'}`} />
              <span className="text-slate-300 font-medium">{isHealthy ? 'Engine ready' : 'Connecting...'}</span>
            </span>
            <span className="text-dark-600">|</span>
            <span className="text-slate-400" title={hasFFmpeg ? "FFmpeg ready for Video/Audio" : "FFmpeg not detected"}>
              FFmpeg {hasFFmpeg ? '✓' : '✗'}
            </span>
            <span className="text-dark-600">|</span>
            <span className="text-slate-300 font-medium flex items-center space-x-1">
              {hasGemini ? (
                <>
                  <Sparkles className="w-3 h-3 text-primary-400 inline mr-1" />
                  <span>Gemini AI</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3 h-3 text-slate-400 inline mr-1" />
                  <span>Local analysis</span>
                </>
              )}
            </span>
          </div>

          {/* Assistant Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center space-x-1.5 border border-dark-700 hover:border-dark-600 bg-dark-800 hover:bg-dark-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-md shadow-sm transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary-400" />
            <span className="hidden sm:inline">MINIFY Assistant</span>
            <span className="sm:hidden">Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
}
