import { Outlet } from 'react-router-dom';
import { Header, Footer } from '@/components/layout';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;
