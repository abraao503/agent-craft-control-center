import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PendingNavigation = { proceed: () => void; discard: () => void };
type UnsavedChangesContextValue = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  requestNavigation: (next: () => void) => void;
};
const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setDirty] = useState(false);
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);
  const requestNavigation = useCallback((next: () => void) => {
    if (!dirtyRef.current) {
      next();
      return;
    }
    setPending({ proceed: next, discard: () => setDirty(false) });
  }, []);
  return (
    <UnsavedChangesContext.Provider
      value={{ isDirty, setDirty, requestNavigation }}
    >
      {children}
      <AlertDialog
        open={!!pending}
        onOpenChange={(value) => !value && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas no funil. Elas serão perdidas se
              sair desta página.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPending(null)}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const current = pending;
                setPending(null);
                current?.discard();
                current?.proceed();
              }}
            >
              Descartar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const value = useContext(UnsavedChangesContext);
  if (!value)
    throw new Error(
      "useUnsavedChanges deve ser usado dentro de UnsavedChangesProvider",
    );
  return value;
}
