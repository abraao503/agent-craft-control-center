import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/auth/hooks";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md mb-8 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
            <img src="/img/icon.png" alt="App icon" className="w-8 h-8" />
          </div>
          <span className="text-2xl font-bold">7 Agentes</span>
        </div>
        <h1 className="text-3xl font-bold">Bem-vindo ao 7 Agentes</h1>
        <p className="text-muted-foreground mt-2">
          Crie, gerencie e implemente agentes inteligentes sob medida para as
          necessidades do seu negócio.
        </p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Login;
