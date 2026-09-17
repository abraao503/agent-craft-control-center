import type { SVGProps } from "react";

export function WhisperIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="8.8" cy="6.4" r="3.1" />
      <path d="M2.9 20.5c.5-4.1 2.5-6.6 5.9-6.6 2.1 0 3.8.9 4.9 2.5" />
      <path d="M12.2 8.7c1.4.1 2.6.9 3.1 2.1" />
      <path d="m11.2 10.5 1.7-.1c1.2-.1 2.3.4 3 1.4l-.9 1.8c-.8.9-2 .9-2.9.3l-1.6-1" />
      <path d="M17.5 5.6c.7.7 1.1 1.5 1.1 2.4s-.4 1.7-1.1 2.4" />
      <path d="M19.8 4.1c1.2 1 1.8 2.3 1.8 3.9s-.6 2.9-1.8 3.9" />
    </svg>
  );
}
