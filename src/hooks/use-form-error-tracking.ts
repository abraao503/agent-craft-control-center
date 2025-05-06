import { useEffect } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { HighlightService } from "@/lib/highlight";

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
        // Create context data with page/route information
        const pageContext = {
          url: window.location.href,
          path: window.location.pathname,
          ...contextInfo
        };

        // Remove sensitive data if needed
        const safeData = { ...data };
        if ('password' in safeData) safeData.password = "[REDACTED]";
        if ('confirmPassword' in safeData) safeData.confirmPassword = "[REDACTED]";
        
        // Add form data context (limited to prevent large payloads)
        const formDataStr = JSON.stringify(safeData).substring(0, 1000);
        
        // Report to Highlight using the specialized method
        HighlightService.reportFormError(
          formId,
          formName,
          errors as Record<string, { message?: string }>,
          {
            ...pageContext,
            formData: formDataStr
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