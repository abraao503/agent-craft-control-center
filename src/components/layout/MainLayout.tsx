import { forwardRef, ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/auth/hooks";
import { Navigate } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
  forwardRef?: React.Ref<HTMLDivElement>;
}

const MainLayout = ({ children, forwardRef }: MainLayoutProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main
        className="flex-1 p-6 bg-background max-h-screen overflow-y-auto dark:text-gray-200"
        ref={forwardRef}
      >
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
