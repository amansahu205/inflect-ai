import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AppPortfolio = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <header className="flex items-center justify-between px-8 h-16 border-b border-border">
        <h1 className="font-display text-lg font-bold text-foreground">Portfolio</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="p-8">
        <p className="text-muted-foreground">Portfolio dashboard coming soon.</p>
      </main>
    </div>
  );
};

export default AppPortfolio;
