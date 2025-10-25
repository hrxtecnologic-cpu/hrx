'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface WizardContainerProps {
  steps: WizardStep[];
  currentStep: number;
  children: ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  hideNavigation?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  submitLabel?: string;
  className?: string;
}

export function WizardContainer({
  steps,
  currentStep,
  children,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting = false,
  canGoNext = true,
  canGoPrevious = true,
  hideNavigation = false,
  nextLabel = 'Próximo',
  previousLabel = 'Voltar',
  submitLabel = 'Finalizar',
  className,
}: WizardContainerProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-zinc-400">
            Passo {currentStep + 1} de {steps.length}
          </div>
          <div className="text-sm font-medium text-zinc-400">
            {Math.round(progressPercentage)}% completo
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="mb-8 hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    index < currentStep && 'bg-red-600 text-white',
                    index === currentStep && 'bg-red-600 text-white ring-4 ring-red-600/20',
                    index > currentStep && 'bg-zinc-800 text-zinc-500'
                  )}
                >
                  {index < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {/* Label */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-xs font-medium transition-colors',
                      index <= currentStep ? 'text-zinc-200' : 'text-zinc-500'
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-zinc-500 mt-0.5 max-w-[120px] mx-auto">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors duration-300 -mt-10',
                    index < currentStep ? 'bg-red-600' : 'bg-zinc-800'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Steps Indicator */}
      <div className="mb-8 md:hidden">
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentStep && 'w-12 bg-red-600',
                index < currentStep && 'w-8 bg-red-600',
                index > currentStep && 'w-8 bg-zinc-800'
              )}
            />
          ))}
        </div>
        <div className="text-center mt-4">
          <div className="text-sm font-medium text-zinc-200">
            {steps[currentStep].title}
          </div>
          {steps[currentStep].description && (
            <div className="text-xs text-zinc-400 mt-1">
              {steps[currentStep].description}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-8">
        {children}
      </div>

      {/* Navigation */}
      {!hideNavigation && (
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-zinc-800">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious || isFirstStep || isSubmitting}
            className={cn(
              'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white',
              (isFirstStep || !canGoPrevious) && 'invisible'
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {previousLabel}
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-8"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={!canGoNext || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-8"
            >
              {nextLabel}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
