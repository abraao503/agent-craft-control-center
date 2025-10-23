import React from "react";

interface TextMessageProps {
  content: string;
}

export const TextMessage: React.FC<TextMessageProps> = ({ content }) => {
  return (
    <p className="text-sm whitespace-pre-wrap break-words">
      {content}
    </p>
  );
};
