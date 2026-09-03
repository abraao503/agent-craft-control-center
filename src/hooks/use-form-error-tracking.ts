import { useEffect } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { HighlightService } from "@/lib/highlight";
import {
  sanitizeHighlightStringMetadata,
  sanitizeObservabilityText,
  sanitizeObservabilityUrl,
  serializeObservabilityValue,
} from "@/services/observability/sanitizeObservability";

/**
 * Hook to track form validation errors with Highlight
 * 
 * @param form The form object from react-hook-form
 * @param formId A unique identifier for the form
 * @param formName A descriptive name for the form
 * @param contextInfo Additional context info about the form
 */
export function useFormErrorTracking<T extends FieldValues>(
  form: UseFormReturn<T>,
  formId: string,
  formName: string,
  contextInfo?: Record<string, string>
) {
  useEffect(() => {
    // Monitor form state for errors
    const subscription = form.watch((data) => {
      const { errors } = form.formState;
      
      // Only track when there are errors
      if (Object.keys(errors).length > 0) {
        const pageContext = sanitizeHighlightStringMetadata({
          url: sanitizeObservabilityUrl(window.location.href),
          path: sanitizeObservabilityText(window.location.pathname),
          ...contextInfo,
        });

        const formDataStr = serializeObservabilityValue(data, 1000);
        const safeErrors = Object.fromEntries(
          Object.entries(errors).map(([field, fieldError]) => [
            sanitizeObservabilityText(field) || "field",
            {
              message:
                sanitizeObservabilityText(fieldError?.message) || "Invalid",
            },
          ]),
        );
        
        HighlightService.reportFormError(
          formId,
          formName,
          safeErrors,
          {
            ...pageContext,
            formData: formDataStr,
          }
        );
      }
    });
    
    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [form, formId, formName, contextInfo]);
  
  // Return nothing as this is just for tracking
  return null;
} 
