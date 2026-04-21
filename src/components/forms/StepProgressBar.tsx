// src/components/forms/StepProgressBar.tsx
'use client';

import { cn } from '@/lib/utils';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepProgressBar({ currentStep, totalSteps, labels }: StepProgressBarProps) {
  return (
    <div className="flex w-full justify-between gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full text-white',
                isActive ? 'bg-primary' : 'bg-muted-foreground'
              )}
            >
              {stepNumber}
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    'absolute left-[calc(100%+8px)] top-1/2 h-0.5 w-[calc(100%-16px)] -translate-y-1/2',
                    isActive && !isCurrent ? 'bg-primary' : 'bg-muted-foreground'
                  )}
                />
              )}
            </div>
            {labels && labels[index] && (
              <span
                className={cn(
                  'mt-2 text-xs text-center',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {labels[index]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
