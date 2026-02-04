import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, reorder } from '@/store/slices/orderSlice';
import { Spinner, Card, Button } from '@/components/ui';
import {
  ShoppingBagIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Order Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      icon: ClockIcon
    },
    confirmed: {
      label: 'Confirmed',
      color: 'bg-blue-100 text-blue-800',
      icon: CheckCircleIcon
    },
    processing: {
      label: 'Processing',
      color: 'bg-purple-100 text-purple-800',
      icon: ArrowPathIcon
    },
    shipped: {
      label: 'Shipped',
      color: 'bg-indigo-100 text-indigo-800',
      icon: TruckIcon
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircleIcon
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800',
      icon: XCircleIcon
    },
    refunded: {
      label: 'Refunded',
      color: 'bg-gray-100 text-gray-800',
      icon: ArrowPathIcon
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

// Order Card Component
const OrderCard = ({ order, onReorder, isReordering }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderItems = () => {
    const items = order.items || [];
    const displayItems = items.slice(0, 3);
    const remainingCount = items.length - 3;
    return { displayItems, remainingCount };
  };

  const { displayItems, remainingCount } = getOrderItems();

  return (
    <Card hoverable className="overflow-hidden">
      {/* Order Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShoppingBagIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{order.orderNumber}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Order Items Preview */}
      <div className="p-4">
        <div className="space-y-2">
          {displayItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                  {item.quantity}×
                </span>
                <span className="text-gray-700 truncate">{item.name}</span>
              </div>
              <span className="text-gray-600 flex-shrink-0">${item.subtotal?.toFixed(2)}</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <p className="text-xs text-gray-400">
              +{remainingCount} more item{remainingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Order Total */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-gray-600">Total</span>
          <span className="text-lg font-bold text-red-600">
            ${order.pricing?.total?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>

      {/* Order Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => navigate(`/orders/${order._id}`)}
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View Details
        </Button>
        {['delivered', 'cancelled'].includes(order.status) && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => onReorder(order._id)}
            loading={isReordering}
            className="bg-red-600 hover:bg-red-700"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Reorder
          </Button>
        )}
      </div>
    </Card>
  );
};

// Empty Orders Component
const EmptyOrders = () => {
  return (
    <Card className="p-12 text-center">
      <ShoppingBagIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">No Orders Yet</h2>
      <p className="text-gray-500 mb-6">
        You haven't placed any orders yet. Start shopping to see your orders here.
      </p>
      <Link to="/products">
        <Button variant="primary" size="lg" className="bg-red-600 hover:bg-red-700">
          <ShoppingBagIcon className="h-5 w-5 mr-2" />
          Start Shopping
        </Button>
      </Link>
    </Card>
  );
};

// Order Status Filter Tabs
const StatusTabs = ({ activeStatus, onStatusChange, orderCounts }) => {
  const statuses = [
    { key: '', label: 'All', count: orderCounts.all },
    { key: 'pending', label: 'Pending', count: orderCounts.pending },
    { key: 'processing', label: 'Processing', count: orderCounts.processing },
    { key: 'shipped', label: 'Shipped', count: orderCounts.shipped },
    { key: 'delivered', label: 'Delivered', count: orderCounts.delivered },
    { key: 'cancelled', label: 'Cancelled', count: orderCounts.cancelled }
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {statuses.map((status) => (
        <button
          key={status.key}
          onClick={() => onStatusChange(status.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeStatus === status.key
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {status.label}
          {status.count > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
              activeStatus === status.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {status.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

const OrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { orders, pagination, isLoading, error } = useSelector((state) => state.orders);

  const [activeStatus, setActiveStatus] = useState('');
  const [reorderingId, setReorderingId] = useState(null);

  // Calculate order counts by status
  const safeOrders = orders || [];
  const orderCounts = {
    all: pagination.total || safeOrders.length,
    pending: safeOrders.filter(o => o.status === 'pending').length,
    processing: safeOrders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
    shipped: safeOrders.filter(o => o.status === 'shipped').length,
    delivered: safeOrders.filter(o => o.status === 'delivered').length,
    cancelled: safeOrders.filter(o => ['cancelled', 'refunded'].includes(o.status)).length
  };

  useEffect(() => {
    const params = {
      page: 1,
      limit: 20,
      ...(activeStatus && { status: activeStatus })
    };
    dispatch(getOrders(params));
  }, [dispatch, activeStatus]);

  const handleReorder = async (orderId) => {
    try {
      setReorderingId(orderId);
      const result = await dispatch(reorder(orderId)).unwrap();
      navigate(`/orders/${result._id}`);
    } catch (error) {
      console.error('Reorder failed:', error);
    } finally {
      setReorderingId(null);
    }
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      dispatch(getOrders({
        page: pagination.page + 1,
        limit: 20,
        ...(activeStatus && { status: activeStatus })
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
        <p className="text-gray-500 mt-1">Track and manage your orders</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6">
        <StatusTabs
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          orderCounts={orderCounts}
        />
      </div>

      {/* Orders List */}
      {isLoading && orders.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Orders</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button
            variant="primary"
            onClick={() => dispatch(getOrders({ page: 1, limit: 20 }))}
            className="bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </Card>
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onReorder={handleReorder}
                isReordering={reorderingId === order._id}
              />
            ))}
          </div>

          {/* Load More */}
          {pagination.page < pagination.totalPages && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                loading={isLoading}
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Load More Orders
              </Button>
            </div>
          )}

          {/* Order Count Info */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Showing {orders.length} of {pagination.total} orders
          </p>
        </>
      )}
    </div>
  );
};

export default OrdersPage;
