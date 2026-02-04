import { createBrowserRouter } from 'react-router-dom';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Public Pages
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import SearchPage from '@/pages/SearchPage';
import CartPage from '@/pages/CartPage';

// Protected Pages
import ProfilePage from '@/pages/ProfilePage';
import OrdersPage from '@/pages/OrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/DashboardPage';
import AdminProducts from '@/pages/admin/ProductsPage';
import AdminCategories from '@/pages/admin/CategoriesPage';
import AdminOrders from '@/pages/admin/OrdersPage';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

// Error Pages
import NotFoundPage from '@/pages/NotFoundPage';

const router = createBrowserRouter([
  // Public routes with main layout
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'products/:id',
        element: <ProductDetailPage />,
      },
      {
        path: 'category/:categoryId',
        element: <ProductsPage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'cart',
        element: <CartPage />,
      },
      // Protected customer routes
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Auth routes
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  // Admin routes
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'products',
        element: <AdminProducts />,
      },
      {
        path: 'categories',
        element: <AdminCategories />,
      },
      {
        path: 'orders',
        element: <AdminOrders />,
      },
    ],
  },
  // 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
