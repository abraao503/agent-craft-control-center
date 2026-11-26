import { useEffect, useRef, useState, type ReactNode } from 'react';

export function DeferredChatImage({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element || ready) return;
    if (typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return;
    }

    let root = element.parentElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) {
      root = root.parentElement;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setReady(true);
        observer.disconnect();
      }
    }, { root, rootMargin: '400px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div ref={container}>
      {ready ? children : (
        <div className="h-40 w-48 max-w-full animate-pulse rounded-lg bg-muted/50"
          role="status" aria-label="Imagem aguardando visualização" />
      )}
    </div>
  );
}
