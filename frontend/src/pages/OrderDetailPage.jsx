import { useParams } from 'react-router-dom';

const OrderDetailPage = () => {
  const { id } = useParams();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>
      {/* TODO: Add order items, status, timeline */}
      <p>Order ID: {id}</p>
    </div>
  );
};

export default OrderDetailPage;
