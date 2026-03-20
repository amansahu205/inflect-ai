import NavBar from "@/components/ui/NavBar";
import BottomBarComponent from "@/components/ui/BottomBar";

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen" style={{ background: "#080C14", paddingTop: 56, paddingBottom: 48 }}>
    <NavBar />
    {children}
    <BottomBarComponent />
  </div>
);

export default AppLayout;
