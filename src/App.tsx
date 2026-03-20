import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import AppResearch from "./pages/AppResearch.tsx";
import AppPortfolio from "./pages/AppPortfolio.tsx";
import Demo from "./pages/Demo.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AuthInit = ({ children }: { children: React.ReactNode }) => {
  useAuth(); // Initialize auth listener
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
                  <AppResearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/portfolio"
              element={
                <ProtectedRoute>
                  <AppPortfolio />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthInit>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
