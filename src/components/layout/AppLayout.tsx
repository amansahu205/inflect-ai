import NavBar from "@/components/ui/NavBar";
import BottomBarComponent from "@/components/ui/BottomBar";
import TickerBar from "@/components/ui/TickerBar";

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen" style={{ background: "#080C14", paddingTop: 96, paddingBottom: 48 }}>
    <NavBar />
    <TickerBar />
    {children}
    <BottomBarComponent />
  </div>
);

export default AppLayout;
