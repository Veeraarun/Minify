import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Upload' },
  { id: 2, name: 'Content Analysis' },
  { id: 3, name: 'Compression Engine' },
  { id: 4, name: 'Quality Check' },
  { id: 5, name: 'Output' },
];

export default function WorkflowStepper({ currentStep, onStepClick }) {
  return (
    <div className="w-full bg-white border-b border-slate-200 py-3 px-4 mb-6">
      <div className="max-w-4xl mx-auto">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, stepIdx) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <li key={step.name} className="relative flex-1 flex items-center">
                  <button
                    type="button"
                    disabled={!isCompleted}
                    onClick={() => {
                      if (isCompleted && onStepClick) onStepClick(step.id);
                    }}
                    className={`flex items-center space-x-2 text-left transition-colors ${
                      isCompleted ? 'cursor-pointer group' : 'cursor-default'
                    }`}
                  >
                    {/* Circle badge */}
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-300 group-hover:bg-emerald-100'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.id}
                    </span>

                    {/* Step label */}
                    <span
                      className={`text-xs font-medium whitespace-nowrap hidden sm:inline ${
                        isCurrent
                          ? 'text-blue-600 font-semibold'
                          : isCompleted
                          ? 'text-slate-700 group-hover:text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </button>

                  {/* Connecting line */}
                  {stepIdx < STEPS.length - 1 && (
                    <div
                      className={`hidden md:block flex-1 h-px mx-3 ${
                        isCompleted ? 'bg-emerald-300' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
