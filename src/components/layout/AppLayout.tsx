import NavBar from "@/components/ui/NavBar";
import BottomBarComponent from "@/components/ui/BottomBar";
import TickerBar from "@/components/ui/TickerBar";
import { useLocation } from "react-router-dom";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isResearch = location.pathname === "/app/research";

  // Research page manages its own layout (sidebar, no padding)
  if (isResearch) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))", paddingTop: 96, paddingBottom: 48 }}>
      <NavBar />
      <TickerBar />
      {children}
      <BottomBarComponent />
    </div>
  );
};

export default AppLayout;
