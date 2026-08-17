import "./message-template.css";

import React, { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { User, Mail, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  TEMPLATE_VARIABLES,
  templateHtmlToApiText,
  apiTextToTemplateHtml,
  getVariableDisplayLabel,
} from "./template-utils";

const VARIABLE_ICONS: Record<string, typeof User> = {
  firstName: User,
  name: UserRound,
  email: Mail,
};

/**
 * Custom Mention node that renders template variables as highlighted badges.
 */
const TemplateMention = Mention.extend({
  name: "templateVariable",

  renderHTML({ node }) {
    const display = getVariableDisplayLabel(node.attrs.id);
    return [
      "span",
      {
        "data-type": "template-variable",
        "data-id": node.attrs.id,
        "data-label": node.attrs.label,
        class: "template-variable",
      },
      display,
    ];
  },

  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='template-variable']",
        getAttrs: (dom: HTMLElement) => ({
          id: dom.getAttribute("data-id"),
          label: dom.getAttribute("data-label"),
        }),
      },
    ];
  },
});

// ── Component ─────────────────────────────────────────────────────

interface MessageTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MessageTemplateEditor({
  value,
  onChange,
  placeholder = "Digite a mensagem...",
}: MessageTemplateEditorProps) {
  const { t } = useTranslation();
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Placeholder.configure({ placeholder }),
      TemplateMention.configure({
        HTMLAttributes: {
          class: "template-variable",
        },
        // Disable suggestion popup — we use buttons instead
        suggestion: {
          char: "\0", // unreachable trigger char
          items: () => [],
        },
      }),
    ],
    content: apiTextToTemplateHtml(value),
    editorProps: {
      attributes: {
        class:
          "message-template-editor prose prose-sm p-3 min-h-[80px] max-h-[200px] overflow-y-auto border rounded-md w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-sm",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const apiText = templateHtmlToApiText(html);
      onChange(apiText);
    },
  });

  // Sync external value changes
  React.useEffect(() => {
    if (!editor) return;
    const currentApiText = templateHtmlToApiText(editor.getHTML());
    if (currentApiText !== value) {
      editor.commands.setContent(apiTextToTemplateHtml(value));
    }
  }, [value, editor]);

  const insertVariable = useCallback(
    (variable: (typeof TEMPLATE_VARIABLES)[number]) => {
      if (!editor) return;

      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;

      // Check if there's text before cursor position
      const nodeBefore = $from.nodeBefore;
      const textBefore = nodeBefore?.text || "";
      const charBeforeCursor = textBefore.slice(-1);

      // Add space before variable if there's text that doesn't end with whitespace
      const needsSpaceBefore = textBefore.length > 0 && !/\s$/.test(textBefore);

      const chain = editor.chain().focus();

      if (needsSpaceBefore) {
        chain.insertContent(" ");
      }

      chain
        .insertContent({
          type: "templateVariable",
          attrs: {
            id: variable.id,
            label: variable.id,
          },
        })
        .insertContent(" ")
        .run();
    },
    [editor],
  );

  return (
    <div className="space-y-2">
      <EditorContent editor={editor} />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          {t("broadcastCreate.insertVariable")}
        </span>
        {TEMPLATE_VARIABLES.map((variable) => {
          const Icon = VARIABLE_ICONS[variable.id] || User;
          return (
            <Button
              key={variable.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 font-mono"
              onClick={() => insertVariable(variable)}
            >
              <Icon className="h-3 w-3" />
              {getVariableDisplayLabel(variable.id)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
