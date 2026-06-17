import {
  SurveyStep,
  Position,
  YesNo,
  SURVEY_STEPS_ORDER,
  STEP_LABELS,
} from '@avitus/shared-types';

export function getNextStep(
  currentStep: SurveyStep,
  answers: Record<string, unknown>,
): SurveyStep {
  const currentIndex = SURVEY_STEPS_ORDER.indexOf(currentStep);

  let nextIndex = currentIndex + 1;

  while (nextIndex < SURVEY_STEPS_ORDER.length) {
    const nextStep = SURVEY_STEPS_ORDER[nextIndex];

    if (nextStep === 'otherPosition' && answers.position !== Position.OTHER) {
      nextIndex++;
      continue;
    }

    if (nextStep === 'fomPrograms' && answers.fomExperience !== YesNo.YES) {
      nextIndex++;
      continue;
    }

    if (nextStep === 'convictionNote' && answers.convicted !== YesNo.YES) {
      nextIndex++;
      continue;
    }

    return nextStep;
  }

  return 'completed';
}

export function getStepNumber(step: SurveyStep): number {
  const visibleSteps = SURVEY_STEPS_ORDER.filter(
    (s) => !['otherPosition', 'fomPrograms', 'convictionNote', 'completed'].includes(s),
  );
  const index = visibleSteps.indexOf(step);
  return index >= 0 ? index + 1 : visibleSteps.length;
}

export function getTotalSteps(): number {
  return SURVEY_STEPS_ORDER.filter(
    (s) => !['otherPosition', 'fomPrograms', 'convictionNote', 'completed'].includes(s),
  ).length;
}

export function getStepLabel(step: SurveyStep): string {
  return STEP_LABELS[step] ?? step;
}

export function shouldSkipStep(step: SurveyStep, answers: Record<string, unknown>): boolean {
  if (step === 'otherPosition' && answers.position !== Position.OTHER) return true;
  if (step === 'fomPrograms' && answers.fomExperience !== YesNo.YES) return true;
  if (step === 'convictionNote' && answers.convicted !== YesNo.YES) return true;
  return false;
}

export function getPreviousStep(
  currentStep: SurveyStep,
  answers: Record<string, unknown>,
): SurveyStep | null {
  const currentIndex = SURVEY_STEPS_ORDER.indexOf(currentStep);
  if (currentIndex <= 0) return null;

  for (let i = currentIndex - 1; i >= 0; i--) {
    const step = SURVEY_STEPS_ORDER[i];
    if (!shouldSkipStep(step, answers)) {
      return step;
    }
  }

  return null;
}
