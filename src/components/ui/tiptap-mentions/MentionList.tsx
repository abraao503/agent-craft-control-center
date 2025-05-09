import "./MentionList.css";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef>(
  (
    props: {
      items: {
        id: string;
        label: string;
      }[];
      command: (props: { id: string; label: string }) => void;
    },
    ref
  ) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];

      if (item) {
        props.command({ id: item.id, label: item.label });
      }
    };

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length
      );
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    return (
      <div className="dropdown-menu">
        {props.items.length ? (
          props.items.map((item, index) => (
            <button
              className={index === selectedIndex ? "is-selected" : ""}
              key={index}
              onClick={() => selectItem(index)}
            >
              {item.label}
            </button>
          ))
        ) : (
          <div className="item">No result</div>
        )}
      </div>
    );
  }
);
