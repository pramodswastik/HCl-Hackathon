import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { updateQuantity, removeFromCart, clearCart } from '@/store/slices/cartSlice';
import { createOrder } from '@/store/slices/orderSlice';
import { Card, Button, Modal } from '@/components/ui';
import {
  ShoppingCartIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
  ShoppingBagIcon,
  TruckIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Cart Item Component
const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-b-0">
      {/* Product Image */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBagIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Link
              to={`/products/${item.productId}`}
              className="font-semibold text-gray-800 hover:text-red-600 transition-colors line-clamp-1"
            >
              {item.name}
            </Link>

            {/* Add-ons */}
            {item.addOns && item.addOns.length > 0 && (
              <div className="mt-1">
                <span className="text-xs text-gray-500">Add-ons: </span>
                <span className="text-xs text-gray-600">
                  {item.addOns.map(addon => addon.name).join(', ')}
                </span>
              </div>
            )}

            {/* Price per item */}
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm text-gray-600">${item.price?.toFixed(2)} each</span>
              {item.addOns && item.addOns.length > 0 && (
                <span className="text-xs text-gray-400">
                  (Base: ${item.basePrice?.toFixed(2)})
                </span>
              )}
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.cartItemId)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Remove item"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Quantity and Subtotal */}
        <div className="mt-3 flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
              className="p-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={item.quantity <= 1}
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
              className="p-1 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Subtotal */}
          <span className="font-bold text-red-600">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Order Summary Component
const OrderSummary = ({ subtotal, tax, shipping, discount, total, onCheckout, isLoading }) => {
  return (
    <Card className="p-6 sticky top-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Tax (8%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">
            {shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              `$${shipping.toFixed(2)}`
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-800">Total</span>
            <span className="text-red-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Free Shipping Progress */}
      {subtotal < 25 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 text-sm mb-2">
            <TruckIcon className="h-4 w-4" />
            <span>Add ${(25 - subtotal).toFixed(2)} more for free shipping!</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (subtotal / 25) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <Button
        fullWidth
        size="lg"
        variant="primary"
        onClick={onCheckout}
        loading={isLoading}
        className="mt-6 bg-red-600 hover:bg-red-700"
      >
        <CreditCardIcon className="h-5 w-5 mr-2" />
        Proceed to Checkout
      </Button>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Secure checkout powered by Stripe
      </p>
    </Card>
  );
};

// Empty Cart Component
const EmptyCart = () => {
  return (
    <Card className="p-12 text-center">
      <ShoppingCartIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Cart is Empty</h2>
      <p className="text-gray-500 mb-6">
        Looks like you haven't added any items to your cart yet.
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

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, totalAmount } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { isLoading: orderLoading } = useSelector((state) => state.orders);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Calculate order totals
  const orderTotals = useMemo(() => {
    const subtotal = totalAmount;
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const shippingThreshold = 25;
    const shippingCost = 5;
    const shipping = subtotal >= shippingThreshold ? 0 : shippingCost;
    const discount = 0; // No discount for now
    const total = subtotal + tax + shipping - discount;

    return { subtotal, tax, shipping, discount, total };
  }, [totalAmount]);

  const handleUpdateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      dispatch(removeFromCart(cartItemId));
    } else {
      dispatch(updateQuantity({ cartItemId, quantity }));
    }
  };

  const handleRemoveItem = (cartItemId) => {
    dispatch(removeFromCart(cartItemId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    setShowClearModal(false);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    setShowCheckoutModal(true);
  };

  const handleConfirmOrder = async () => {
    const orderData = {
      items: items.map(item => ({
        product: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        addOns: item.addOns || [],
        subtotal: item.price * item.quantity
      })),
      shippingAddress: {
        street: user?.address?.street || '123 Main St',
        city: user?.address?.city || 'New York',
        state: user?.address?.state || 'NY',
        zipCode: user?.address?.zipCode || '10001',
        country: 'USA'
      },
      pricing: {
        subtotal: orderTotals.subtotal,
        tax: orderTotals.tax,
        taxRate: 0.08,
        shipping: orderTotals.shipping,
        discount: orderTotals.discount,
        total: orderTotals.total
      },
      paymentMethod: 'credit_card'
    };

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      dispatch(clearCart());
      setShowCheckoutModal(false);
      navigate(`/orders/${result._id}`, { state: { orderSuccess: true } });
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
          <p className="text-gray-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowClearModal(true)}
          className="text-red-600 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6">
            {items.map((item) => (
              <CartItem
                key={item.cartItemId}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            ))}
          </Card>

          {/* Continue Shopping */}
          <div className="mt-4">
            <Link
              to="/products"
              className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <ShoppingBagIcon className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            subtotal={orderTotals.subtotal}
            tax={orderTotals.tax}
            shipping={orderTotals.shipping}
            discount={orderTotals.discount}
            total={orderTotals.total}
            onCheckout={handleCheckout}
            isLoading={orderLoading}
          />
        </div>
      </div>

      {/* Clear Cart Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Cart"
      >
        <div className="p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Are you sure you want to clear your cart?
          </h3>
          <p className="text-gray-500 mb-6">
            This will remove all {items.length} item{items.length !== 1 ? 's' : ''} from your cart.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleClearCart}
            >
              Clear Cart
            </Button>
          </div>
        </div>
      </Modal>

      {/* Checkout Confirmation Modal */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Confirm Order"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Ready to place your order?
            </h3>
            <p className="text-gray-500">
              Your order total is <span className="font-bold text-red-600">${orderTotals.total.toFixed(2)}</span>
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              {items.slice(0, 3).map((item) => (
                <div key={item.cartItemId} className="flex justify-between">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-gray-400 text-xs">
                  +{items.length - 3} more item{items.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              fullWidth
              variant="outline"
              onClick={() => setShowCheckoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="primary"
              onClick={handleConfirmOrder}
              loading={orderLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Place Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CartPage;
