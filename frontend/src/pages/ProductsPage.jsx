import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProducts, setFilters, setPage } from '@/store/slices/productSlice';
import { getCategories, getCategory } from '@/store/slices/categorySlice';
import { addToCart } from '@/store/slices/cartSlice';
import { Spinner, Card, Button } from '@/components/ui';
import {
  ShoppingCartIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

// Product Card Component
const ProductCard = ({ product, onAddToCart, viewMode = 'grid' }) => {
  const navigate = useNavigate();
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  if (viewMode === 'list') {
    return (
      <Card
        hoverable
        className="flex flex-col sm:flex-row overflow-hidden cursor-pointer"
        onClick={() => navigate(`/products/${product._id}`)}
      >
        <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-gray-100 flex-shrink-0">
          {primaryImage?.url ? (
            <img
              src={primaryImage.url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCartIcon className="h-12 w-12 text-gray-300" />
            </div>
          )}
          {product.isFeatured && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              Featured
            </span>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-800 mb-1 hover:text-red-600 transition-colors">
              {product.name}
            </h3>
            {product.shortDescription && (
              <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.shortDescription}</p>
            )}
            {product.description && (
              <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-red-600">${product.price?.toFixed(2)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-gray-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleAddToCart}
              className="bg-red-600 hover:bg-red-700"
              disabled={product.stock?.quantity <= 0}
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      hoverable
      className="overflow-hidden cursor-pointer group"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
        {primaryImage?.url ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCartIcon className="h-16 w-16 text-gray-300" />
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            Featured
          </span>
        )}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 group-hover:text-red-600 transition-colors">
          {product.name}
        </h3>
        {product.shortDescription && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.shortDescription}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-red-600">${product.price?.toFixed(2)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={handleAddToCart}
            className="bg-red-600 hover:bg-red-700"
            disabled={product.stock?.quantity <= 0}
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Filter Sidebar Component
const FilterSidebar = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  priceRange, 
  onPriceChange, 
  onClearFilters,
  isOpen,
  onClose 
}) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white lg:bg-transparent
        transform transition-transform duration-300 lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:block overflow-y-auto
      `}>
        <div className="p-4 lg:p-0">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h3 className="font-semibold text-lg">Filters</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FunnelIcon className="h-5 w-5" />
                Filters
              </h3>
              <button 
                onClick={onClearFilters}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={!selectedCategory}
                    onChange={() => onCategoryChange('')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-600">All Categories</span>
                </label>
                {categories.filter(c => c.isActive).map((category) => (
                  <label key={category._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category._id}
                      onChange={() => onCategoryChange(category._id)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-600">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => onPriceChange({ ...priceRange, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => onPriceChange({ ...priceRange, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const showPages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  let endPage = Math.min(totalPages, startPage + showPages - 1);
  
  if (endPage - startPage + 1 < showPages) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      
      {startPage > 1 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onPageChange(1)}>1</Button>
          {startPage > 2 && <span className="text-gray-400">...</span>}
        </>
      )}
      
      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(page)}
          className={page === currentPage ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          {page}
        </Button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
          <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

const ProductsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const { products, pagination, filters, isLoading } = useSelector((state) => state.products);
  const { categories, category: currentCategory } = useSelector((state) => state.categories);

  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortOption, setSortOption] = useState('createdAt-desc');
  const [loadedProducts, setLoadedProducts] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // Fetch category details if categoryId is present
  useEffect(() => {
    if (categoryId) {
      dispatch(getCategory(categoryId));
    }
  }, [dispatch, categoryId]);

  // Fetch products when filters or category changes
  useEffect(() => {
    const [sort, order] = sortOption.split('-');
    const params = {
      page: pagination.page,
      limit: 12,
      sort,
      order,
      ...(categoryId && { category: categoryId }),
      ...(priceRange.min && { minPrice: priceRange.min }),
      ...(priceRange.max && { maxPrice: priceRange.max }),
    };
    dispatch(getProducts(params));
  }, [dispatch, categoryId, pagination.page, sortOption, priceRange]);

  // Reset loaded products when category changes
  useEffect(() => {
    setLoadedProducts(products);
  }, [products]);

  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      const [sort, order] = sortOption.split('-');
      const params = {
        page: pagination.page + 1,
        limit: 12,
        sort,
        order,
        ...(categoryId && { category: categoryId }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
      };
      
      dispatch(getProducts(params)).then((action) => {
        if (action.payload?.products) {
          setLoadedProducts(prev => [...prev, ...action.payload.products]);
        }
        setIsLoadingMore(false);
      });
    }
  }, [dispatch, pagination, sortOption, categoryId, priceRange, isLoadingMore]);

  const handleCategoryChange = (catId) => {
    if (catId) {
      navigate(`/category/${catId}`);
    } else {
      navigate('/products');
    }
    dispatch(setPage(1));
    setLoadedProducts([]);
  };

  const handleClearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSortOption('createdAt-desc');
    navigate('/products');
    dispatch(setPage(1));
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1, addOns: [] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-red-600">Home</Link>
        <span>/</span>
        <span className="text-gray-800">
          {currentCategory?.name || 'All Products'}
        </span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {currentCategory?.name || 'All Products'}
          </h1>
          <p className="text-gray-500 mt-1">
            {pagination.total} products found
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowFilters(true)}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>

          {/* Sort Dropdown */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <FilterSidebar
            categories={categories}
            selectedCategory={categoryId}
            onCategoryChange={handleCategoryChange}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            onClearFilters={handleClearFilters}
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
          />
        </aside>

        {/* Mobile Filter Sidebar */}
        <FilterSidebar
          categories={categories}
          selectedCategory={categoryId}
          onCategoryChange={handleCategoryChange}
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          onClearFilters={handleClearFilters}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />

        {/* Products Grid/List */}
        <main className="flex-1">
          {isLoading && loadedProducts.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : loadedProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingCartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or browse all products.</p>
              <Button variant="primary" onClick={handleClearFilters} className="bg-red-600 hover:bg-red-700">
                Clear Filters
              </Button>
            </Card>
          ) : (
            <>
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {loadedProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {pagination.page < pagination.totalPages && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    loading={isLoadingMore}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Load More Products
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;
