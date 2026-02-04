import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrder, reorder, clearOrder } from '@/store/slices/orderSlice';
import { Spinner, Card, Button } from '@/components/ui';
import {
  ShoppingBagIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MapPinIcon,
  CreditCardIcon,
  PhoneIcon,
  PrinterIcon,
  ArrowLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Order Status Timeline Component
const OrderTimeline = ({ statusHistory = [], currentStatus }) => {
  const allStatuses = [
    { key: 'pending', label: 'Order Placed', icon: ShoppingBagIcon },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircleIcon },
    { key: 'processing', label: 'Preparing', icon: ArrowPathIcon },
    { key: 'shipped', label: 'On the Way', icon: TruckIcon },
    { key: 'delivered', label: 'Delivered', icon: CheckCircleIcon }
  ];

  const getStatusIndex = (status) => {
    if (status === 'cancelled' || status === 'refunded') return -1;
    return allStatuses.findIndex(s => s.key === status);
  };

  const currentIndex = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'refunded';

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusTimestamp = (statusKey) => {
    const entry = statusHistory.find(h => h.status === statusKey);
    return entry?.timestamp;
  };

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">
            Order {currentStatus === 'cancelled' ? 'Cancelled' : 'Refunded'}
          </h3>
          {statusHistory.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(statusHistory[statusHistory.length - 1]?.timestamp)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded-full">
        <div
          className="h-full bg-red-600 rounded-full transition-all duration-500"
          style={{ width: `${currentIndex >= 0 ? (currentIndex / (allStatuses.length - 1)) * 100 : 0}%` }}
        />
      </div>

      {/* Status Steps */}
      <div className="relative flex justify-between">
        {allStatuses.map((status, index) => {
          const Icon = status.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const timestamp = getStatusTimestamp(status.key);

          return (
            <div key={status.key} className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all ${
                  isCompleted
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-red-200' : ''}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <p className={`mt-2 text-xs font-medium text-center ${
                isCompleted ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {status.label}
              </p>
              {timestamp && (
                <p className="text-xs text-gray-400 mt-0.5 text-center">
                  {formatDate(timestamp)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Order Item Component
const OrderItem = ({ item }) => {
  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-b-0">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <ShoppingBagIcon className="h-8 w-8 text-gray-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-gray-800">{item.name}</h4>
            {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
            {item.addOns && item.addOns.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Add-ons: {item.addOns.map(a => a.name).join(', ')}
              </p>
            )}
          </div>
          <span className="font-semibold text-gray-800">₹{item.subtotal?.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex items-center text-sm text-gray-500">
          <span>₹{item.price?.toFixed(2)} × {item.quantity}</span>
        </div>
      </div>
    </div>
  );
};

// Success Banner Component
const SuccessBanner = ({ onClose }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CheckCircleIcon className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="font-semibold text-green-800">Order Placed Successfully!</h3>
          <p className="text-sm text-green-700">Thank you for your order. We'll start preparing it right away.</p>
        </div>
      </div>
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        <XCircleIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { order, isLoading, error } = useSelector((state) => state.orders);

  const [showSuccessBanner, setShowSuccessBanner] = useState(
    location.state?.orderSuccess || false
  );
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    dispatch(getOrder(id));
    return () => {
      dispatch(clearOrder());
    };
  }, [dispatch, id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReorder = async () => {
    try {
      setIsReordering(true);
      const result = await dispatch(reorder(id)).unwrap();
      navigate(`/orders/${result._id}`, { state: { orderSuccess: true } });
    } catch (error) {
      console.error('Reorder failed:', error);
    } finally {
      setIsReordering(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="p-12 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-4">{error || "The order you're looking for doesn't exist."}</p>
          <Link to="/orders">
            <Button variant="primary" className="bg-red-600 hover:bg-red-700">
              View All Orders
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 print:p-0">
      {/* Back Button */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-gray-600 hover:text-red-600 mb-4 print:hidden"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Success Banner */}
      {showSuccessBanner && (
        <SuccessBanner onClose={() => setShowSuccessBanner(false)} />
      )}

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order {order.orderNumber}</h1>
          <p className="text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <PrinterIcon className="h-4 w-4 mr-1" />
            Print
          </Button>
          {['delivered', 'cancelled', 'refunded'].includes(order.status) && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleReorder}
              loading={isReordering}
              className="bg-red-600 hover:bg-red-700"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Reorder
            </Button>
          )}
        </div>
      </div>

      {/* Order Status Timeline */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Order Status</h2>
        <OrderTimeline
          statusHistory={order.statusHistory}
          currentStatus={order.status}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h2>
            <div>
              {order.items?.map((item, index) => (
                <OrderItem key={index} item={item} />
              ))}
            </div>
          </Card>
        </div>

        {/* Order Summary & Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Price Summary */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{order.pricing?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({((order.pricing?.taxRate || 0) * 100).toFixed(0)}%)</span>
                <span className="font-medium">₹{order.pricing?.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {order.pricing?.shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `₹${order.pricing?.shipping?.toFixed(2)}`
                  )}
                </span>
              </div>
              {order.pricing?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.pricing?.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-red-600">₹{order.pricing?.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              Shipping Address
            </h2>
            <address className="text-gray-600 not-italic text-sm space-y-1">
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && (
                <p className="flex items-center gap-1 pt-2 text-gray-500">
                  <PhoneIcon className="h-4 w-4" />
                  {order.shippingAddress?.phone}
                </p>
              )}
            </address>
          </Card>

          {/* Payment Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-gray-400" />
              Payment
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium capitalize ${
                  order.paymentStatus === 'paid' ? 'text-green-600' :
                  order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.paymentDetails?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-xs">{order.paymentDetails.transactionId}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Tracking Info (if shipped) */}
          {order.tracking?.trackingNumber && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-gray-400" />
                Tracking
              </h2>
              <div className="text-sm space-y-2">
                {order.tracking?.carrier && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Carrier</span>
                    <span className="font-medium">{order.tracking.carrier}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking #</span>
                  <span className="font-mono text-xs">{order.tracking.trackingNumber}</span>
                </div>
                {order.tracking?.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Delivery</span>
                    <span className="font-medium">
                      {new Date(order.tracking.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Customer Notes */}
          {order.notes?.customer && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Order Notes</h2>
              <p className="text-sm text-gray-600">{order.notes.customer}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Help Section */}
      <Card className="p-6 mt-6 print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">Need Help?</h3>
            <p className="text-sm text-gray-500">Contact our support team for any order inquiries</p>
          </div>
          <Button variant="outline">
            Contact Support
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default OrderDetailPage;
