import { useState } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User,
  Sparkles
} from 'lucide-react';
import { askAssistant } from '../services/api';

const QUICK_PROMPTS = [
  "Which format should I choose?",
  "Why did my file only compress by 25%?",
  "How does MINIFY ensure visual fidelity?",
  "Can I compress this below 2 MB?"
];

export default function AIAssistantDrawer({ isOpen, onClose, currentContext }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      provider: 'MINIFY Assistant',
      text: "Hello! I am the MINIFY Assistant. I can help guide your compression strategy, explain codec advantages (WebP vs AVIF, H.264 vs H.265), or unpack fidelity metrics like SSIM."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (questionText) => {
    const q = questionText || inputValue;
    if (!q.trim() || isLoading) return;

    setInputValue('');
    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setIsLoading(true);

    try {
      const response = await askAssistant(q, currentContext);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          provider: response.provider || 'MINIFY Engine',
          text: response.answer,
          suggestedActions: response.suggested_actions || []
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          provider: 'Local Engine',
          text: "A connection issue occurred. Please check backend connectivity or try one of the preset prompts."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-dark-900 border-l border-dark-700 shadow-2xl h-full flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">MINIFY Assistant</h3>
              <p className="text-[11px] text-slate-400">Intelligent optimization advisor</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Assistant"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="p-2.5 bg-dark-850/60 border-b border-dark-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-dark-800 hover:bg-dark-750 text-slate-300 border border-dark-700 whitespace-nowrap transition-colors text-[11px] font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const isBot = msg.sender === 'bot';

            return (
              <div
                key={index}
                className={`flex items-start space-x-2.5 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    isBot 
                      ? 'bg-dark-800 text-primary-400 border border-dark-700' 
                      : 'bg-primary-600 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  isBot
                    ? 'bg-dark-850 border border-dark-750 text-slate-200'
                    : 'bg-primary-600 text-white shadow-sm'
                }`}>
                  {isBot && (
                    <div className="text-[10px] text-slate-400 font-mono mb-1.5 pb-1 border-b border-dark-750 flex items-center justify-between">
                      <span>{msg.provider}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* Suggested action chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-dark-750 flex flex-wrap gap-1">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleSend(action)}
                          className="px-2 py-0.5 rounded bg-dark-900 border border-dark-700 text-primary-400 hover:text-primary-300 text-[10px] font-mono transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
              <span>MINIFY is formulating recommendations...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="p-3 bg-dark-850 border-t border-dark-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about codecs, quality, or formats..."
              disabled={isLoading}
              className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
