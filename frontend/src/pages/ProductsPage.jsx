import { useParams } from 'react-router-dom';

const ProductsPage = () => {
  const { categoryId } = useParams();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {categoryId ? 'Category Products' : 'All Products'}
      </h1>
      {/* TODO: Add product grid, filters, pagination */}
      <p>Products page content coming soon...</p>
    </div>
  );
};

export default ProductsPage;
