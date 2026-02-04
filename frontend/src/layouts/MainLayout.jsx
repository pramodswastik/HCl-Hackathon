import { Outlet } from 'react-router-dom';

// TODO: Import Header and Footer components when created
// import Header from '@/components/layout/Header';
// import Footer from '@/components/layout/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <Header /> */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Retail Portal</h1>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* <Footer /> */}
      <footer className="bg-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          © 2026 Retail Portal. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
