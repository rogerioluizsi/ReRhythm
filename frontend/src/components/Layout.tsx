import { Outlet } from 'react-router-dom';
import { Navigation } from "@/components/layout/Navigation";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navigation />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
