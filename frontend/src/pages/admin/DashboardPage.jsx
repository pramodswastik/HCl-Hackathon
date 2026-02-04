import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Spinner } from '../../components/ui';
import orderService from '../../services/orderService';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCategories: 0,
    lowStockProducts: [],
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders, products, and categories in parallel
      const [ordersResult, productsResult, categoriesResult] = await Promise.all([
        orderService.getAllOrders({ limit: 10, page: 1 }),
        productService.getProducts({ limit: 100 }),
        categoryService.getCategories(),
      ]);

      // Calculate stats
      const orders = ordersResult.orders || [];
      const products = productsResult.products || [];
      const categories = categoriesResult || [];

      const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const lowStockProducts = products.filter(p => 
        p.stock?.trackInventory && p.stock?.quantity <= (p.stock?.lowStockThreshold || 10)
      );

      setStats({
        totalOrders: ordersResult.pagination?.total || orders.length,
        pendingOrders,
        totalRevenue,
        totalProducts: productsResult.pagination?.total || products.length,
        totalCategories: categories.length,
        lowStockProducts,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
            </div>
            <div className="bg-blue-400/30 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-4">
            {stats.pendingOrders} pending orders
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="bg-green-400/30 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-green-100 text-sm mt-4">
            From all completed orders
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
            </div>
            <div className="bg-purple-400/30 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-purple-100 text-sm mt-4">
            Across {stats.totalCategories} categories
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Low Stock Alerts</p>
              <p className="text-3xl font-bold mt-1">{stats.lowStockProducts.length}</p>
            </div>
            <div className="bg-orange-400/30 p-3 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-orange-100 text-sm mt-4">
            Products need restocking
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/products">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </Button>
            </Link>
            <Link to="/admin/categories">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Add Category
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View All Orders
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>Recent Orders</Card.Title>
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </Card.Header>
          <Card.Body>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <div key={order._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.user?.firstName} {order.user?.lastName} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(order.pricing?.total || 0)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>Low Stock Alerts</Card.Title>
            <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-700">
              Manage products →
            </Link>
          </Card.Header>
          <Card.Body>
            {stats.lowStockProducts.length === 0 ? (
              <div className="text-center py-4">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">All products are well stocked!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.images?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.stock?.quantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stock?.quantity === 0 ? 'Out of Stock' : `${product.stock?.quantity} left`}
                      </span>
                    </div>
                  </div>
                ))}
                {stats.lowStockProducts.length > 5 && (
                  <p className="text-sm text-gray-500 pt-3 text-center">
                    +{stats.lowStockProducts.length - 5} more products with low stock
                  </p>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
