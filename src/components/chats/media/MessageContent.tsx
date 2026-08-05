import React from "react";
import { Message } from "@/types/message";
import { TextMessage } from "./TextMessage";
import { ImageMessage } from "./ImageMessage";
import { AudioMessage } from "./AudioMessage";
import { DocumentMessage } from "./DocumentMessage";

interface MessageContentProps {
  message: Message;
}

export const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const messageType = message.type || "text";

  switch (messageType) {
    case "image":
      if (!message.mediaUrl) {
        return <TextMessage content={message.content} />;
      }
      return (
        <ImageMessage
          url={message.mediaUrl}
          caption={message.content}
          mimetype={message.mediaMimetype || undefined}
        />
      );

    case "audio":
      if (!message.mediaUrl) {
        return <TextMessage content={message.content} />;
      }
      return (
        <AudioMessage
          url={message.mediaUrl}
          mimetype={message.mediaMimetype || undefined}
        />
      );

    case "document":
      if (!message.mediaUrl) {
        return <TextMessage content={message.content} />;
      }
      return (
        <DocumentMessage
          url={message.mediaUrl}
          filename={message.content}
          mimetype={message.mediaMimetype || undefined}
        />
      );

    case "text":
    case "template":
    default:
      return <TextMessage content={message.content} />;
  }
};
