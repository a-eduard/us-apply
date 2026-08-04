import { Suspense } from "react";
import { notFound } from "next/navigation";
import WizardClient from "./WizardClient";

interface WizardPageProps {
  params: Promise<{
    step: string;
  }>;
}

export default async function WizardPage({ params }: WizardPageProps) {
  // 1. Unwrap the Promise to get the actual params
  const resolvedParams = await params;
  const stepParam = resolvedParams.step;

  // 2. Extract the step number from the URL (e.g., "step-1" -> 1)
  const stepNumber = parseInt(stepParam.replace("step-", ""), 10);

  // 3. If the step is invalid, return a 404
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 3) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <WizardClient initialStep={stepNumber - 1} />
    </Suspense>
  );
}