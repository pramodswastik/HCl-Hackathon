import { useState, useEffect } from 'react';
import { Card, Button, Modal, Spinner } from '../../components/ui';
import orderService from '../../services/orderService';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'processing', label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
  ];

  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: ['refunded'],
    refunded: [],
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter, dateRange]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 10,
      };
      
      if (statusFilter) params.status = statusFilter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const result = await orderService.getAllOrders(params);
      setOrders(result.orders || []);
      setPagination(result.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus('');
    setStatusNote('');
    setIsStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    setUpdateLoading(true);
    try {
      await orderService.updateOrderStatus(selectedOrder._id, newStatus);
      setIsStatusModalOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
      setStatusNote('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
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

  const getAvailableTransitions = (currentStatus) => {
    return validTransitions[currentStatus] || [];
  };

  // Order Timeline Component
  const OrderTimeline = ({ statusHistory }) => {
    if (!statusHistory || statusHistory.length === 0) return null;
    
    return (
      <div className="flow-root">
        <ul className="-mb-8">
          {statusHistory.map((entry, index) => (
            <li key={index}>
              <div className="relative pb-8">
                {index !== statusHistory.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      index === 0 ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Status changed to{' '}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(entry.status)}`}>
                          {entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1)}
                        </span>
                      </p>
                      {entry.note && (
                        <p className="text-sm text-gray-400 mt-1">{entry.note}</p>
                      )}
                      {entry.updatedBy && (
                        <p className="text-xs text-gray-400 mt-1">
                          by {entry.updatedBy.firstName} {entry.updatedBy.lastName}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      {formatDate(entry.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter('');
                  setDateRange({ start: '', end: '' });
                }}
                fullWidth
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Orders Table */}
      <Card>
        <Card.Body className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.user?.firstName} {order.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{order.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.items?.length || 0} item(s)
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {order.items?.map(item => item.name).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.pricing?.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => openDetailModal(order)}
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                          {getAvailableTransitions(order.status).length > 0 && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => openStatusModal(order)}
                              title="Update Status"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card.Footer className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedOrder(null); }}
        title={`Order #${selectedOrder?.orderNumber || selectedOrder?._id?.slice(-8).toUpperCase()}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Status & Info */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                </span>
                <p className="text-sm text-gray-500 mt-2">
                  Placed on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              {getAvailableTransitions(selectedOrder.status).length > 0 && (
                <Button size="sm" onClick={() => { setIsDetailModalOpen(false); openStatusModal(selectedOrder); }}>
                  Update Status
                </Button>
              )}
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedOrder.user?.email}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress?.street}<br />
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}<br />
                  {selectedOrder.shippingAddress?.country}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Items</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {item.product?.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                        {item.addOns?.length > 0 && (
                          <p className="text-xs text-gray-400">
                            Add-ons: {item.addOns.map(a => a.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.subtotal || (item.price * item.quantity))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(selectedOrder.pricing?.subtotal)}</span>
                </div>
                {selectedOrder.pricing?.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">-{formatCurrency(selectedOrder.pricing?.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">{formatCurrency(selectedOrder.pricing?.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(selectedOrder.pricing?.shipping)}</span>
                </div>
                <div className="flex justify-between text-base font-medium border-t pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(selectedOrder.pricing?.total)}</span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            {selectedOrder.statusHistory?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Order Timeline</h4>
                <OrderTimeline statusHistory={[...selectedOrder.statusHistory].reverse()} />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => { setIsStatusModalOpen(false); setSelectedOrder(null); setNewStatus(''); setStatusNote(''); }}
        title="Update Order Status"
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Current Status: 
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select new status</option>
                {getAvailableTransitions(selectedOrder.status).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (Optional)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a note for this status update..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => { setIsStatusModalOpen(false); setSelectedOrder(null); setNewStatus(''); setStatusNote(''); }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                loading={updateLoading}
                disabled={!newStatus}
              >
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;
