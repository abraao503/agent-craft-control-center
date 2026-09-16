import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth/hooks";

export function ProfileLoadError() {
  const { loadUserProfile } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await loadUserProfile();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Falha no servidor</h2>
        <p className="text-gray-600 mb-4">
          Não foi possível carregar seu perfil. Verifique sua conexão e tente
          novamente.
        </p>
        <Button onClick={handleRetry} disabled={retrying}>
          {retrying ? "Tentando novamente..." : "Tentar novamente"}
        </Button>
      </div>
    </div>
  );
}
