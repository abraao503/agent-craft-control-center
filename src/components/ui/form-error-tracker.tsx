import React from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useFormErrorTracking } from "@/hooks/use-form-error-tracking";

export interface FormErrorTrackerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  formId: string;
  formName: string;
  contextInfo?: Record<string, string>;
  children: React.ReactNode;
}

/**
 * Component that tracks form errors and reports them to Highlight.
 * Wrap your form with this component to get detailed error tracking.
 */
export function FormErrorTracker<T extends FieldValues>({
  form,
  formId,
  formName,
  contextInfo,
  children,
}: FormErrorTrackerProps<T>) {
  // Use the tracking hook with the form instance
  useFormErrorTracking(form, formId, formName, contextInfo);

  // Just render the children - this component doesn't affect the UI
  return <>{children}</>;
} 