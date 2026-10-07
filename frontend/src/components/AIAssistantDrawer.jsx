import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  HelpCircle, 
  Bot, 
  User
} from 'lucide-react';
import { askAssistant } from '../services/api';

const QUICK_PROMPTS = [
  "Why did my file only compress by 20%?",
  "Which format should I use?",
  "Can I compress this below 5 MB?",
  "Will compression reduce quality?"
];

export default function AIAssistantDrawer({ isOpen, onClose, currentContext }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      provider: 'Assistant',
      text: "Hello! I can help you select the best container format (WebP, MP4, MP3), choose compression presets, or explain fidelity metrics like SSIM."
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
          provider: response.provider || 'Engine',
          text: response.answer,
          suggestedActions: response.suggested_actions || []
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          provider: 'Local Engine',
          text: "A connection error occurred. Please try again or select one of the suggested prompts below."
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
        className="fixed inset-0 bg-slate-900/30 transition-opacity"
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 shadow-xl h-full flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Compression Assistant</h3>
            <p className="text-[11px] text-slate-500">Codec & optimization guidance</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-colors text-[11px] font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg, index) => {
            const isBot = msg.sender === 'bot';

            return (
              <div
                key={index}
                className={`flex items-start space-x-2 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 ${
                    isBot ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[85%] rounded-md p-3 text-xs leading-relaxed ${
                  isBot
                    ? 'bg-slate-50 border border-slate-200 text-slate-800'
                    : 'bg-blue-600 text-white'
                }`}>
                  {isBot && (
                    <div className="text-[10px] text-slate-400 font-mono mb-1 pb-1 border-b border-slate-200">
                      <span>{msg.provider}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* Suggested action chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-1">
                      {msg.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(act)}
                          className="px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200 text-[10px] hover:bg-blue-50 transition-colors font-medium"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask about codecs, settings, sizes..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 transition-colors flex items-center space-x-1"
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
