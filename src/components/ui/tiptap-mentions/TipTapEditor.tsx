import "./style.css";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Placeholder from "@tiptap/extension-placeholder";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { ReactRenderer } from "@tiptap/react";
import { MentionList, MentionListRef } from "./MentionList";

const CustomMention = Mention.extend({
  renderHTML({ node }) {
    return [
      "span",
      {
        "data-type": "mention",
        "data-id": node.attrs.id,
        "data-label": node.attrs.label,
        class: "mention",
      },
      `${node.attrs.label}`,
    ];
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='mention']",
        getAttrs: (dom: HTMLElement) => ({
          id: dom.getAttribute("data-id"),
          label: dom.getAttribute("data-label"),
        }),
      },
    ];
  },
});

export default function EditorWithMention({
  onChange,
  value,
  className,
  placeholder,
  mentionItems,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  mentionItems?: Array<{ id: string; label: string }>;
}) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Placeholder.configure({ placeholder }),
      Text,
      CustomMention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          char: "{",
          items: ({ query }) => {
            return mentionItems
              .filter((item) =>
                item.label.toLowerCase().startsWith(query.toLowerCase())
              )
              .slice(0, 5);
          },

          render: () => {
            let reactRenderer: ReactRenderer<MentionListRef> | null = null;
            let popup: Instance[] | null = null;

            return {
              onStart: (props) => {
                if (!props.clientRect) {
                  return;
                }

                reactRenderer = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: reactRenderer.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props) {
                reactRenderer.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();

                  return true;
                }

                return reactRenderer.ref?.onKeyDown(props);
              },

              onExit() {
                if (popup) {
                  popup[0].destroy();
                  reactRenderer.destroy();
                }
              },
            };
          },
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose p-2 min-h-[150px] max-h-[400px] overflow-y-auto border rounded w-full resize-y focus:outline-none " +
          className,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Atualiza o conteúdo do editor quando o valor é alterado externamente
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
}
