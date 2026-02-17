import React from "react";
import {
  parseTemplateSegments,
  getVariableDisplayLabel,
} from "./template-utils";

interface TemplateTextDisplayProps {
  text: string;
  className?: string;
}

/**
 * Renders API text with {{customer.xxx}} variables highlighted as inline badges.
 * Used in read-only contexts like detail pages.
 */
export function TemplateTextDisplay({
  text,
  className,
}: TemplateTextDisplayProps) {
  const segments = parseTemplateSegments(text);

  return (
    <span className={className}>
      {segments.map((segment, i) =>
        segment.type === "variable" ? (
          <code
            key={i}
            className="inline-flex items-center bg-primary/15 text-primary border border-primary/30 rounded px-1.5 py-0 text-xs font-mono font-medium whitespace-nowrap"
          >
            {`{{${getVariableDisplayLabel(segment.value)}}}`}
          </code>
        ) : (
          <React.Fragment key={i}>{segment.value}</React.Fragment>
        ),
      )}
    </span>
  );
}
