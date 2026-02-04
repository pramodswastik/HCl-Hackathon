import { useParams } from 'react-router-dom';

const ProductDetailPage = () => {
  const { id } = useParams();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Product Details</h1>
      {/* TODO: Add product image gallery, info, add-ons, add to cart */}
      <p>Product ID: {id}</p>
    </div>
  );
};

export default ProductDetailPage;
