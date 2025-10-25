import { useState, useCallback } from 'react';

export function useWizard(totalSteps: number, initialStep: number = 0) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      // Scroll to top quando mudar de step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalSteps]);

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const previousStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const reset = useCallback(() => {
    goToStep(0);
  }, [goToStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return {
    currentStep,
    goToStep,
    nextStep,
    previousStep,
    reset,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps,
  };
}
