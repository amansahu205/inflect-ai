import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InflectToastProvider } from "@/components/ui/InflectToast";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import AppResearch from "./pages/AppResearch.tsx";
import AppPortfolio from "./pages/AppPortfolio.tsx";
import Demo from "./pages/Demo.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AuthInit = ({ children }: { children: React.ReactNode }) => {
  useAuth();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InflectToastProvider>
        <BrowserRouter>
          <AuthInit>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/demo" element={<Demo />} />
              <Route
                path="/app/research"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AppResearch />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/portfolio"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AppPortfolio />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthInit>
        </BrowserRouter>
      </InflectToastProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
