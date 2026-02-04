import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { searchProducts } from '@/store/slices/productSlice';
import { getCategories } from '@/store/slices/categorySlice';
import { addToCart } from '@/store/slices/cartSlice';
import { Spinner, Card, Button } from '@/components/ui';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Search Product Card Component
const SearchProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <Card
      hoverable
      className="flex overflow-hidden cursor-pointer"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      <div className="relative w-24 sm:w-32 h-24 sm:h-32 bg-gray-100 flex-shrink-0">
        {primaryImage?.url ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCartIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute top-1 left-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded">
            Featured
          </span>
        )}
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-gray-800 line-clamp-1 hover:text-red-600 transition-colors">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="text-gray-500 text-sm line-clamp-1 mt-0.5">{product.shortDescription}</p>
          )}
          {product.category?.name && (
            <span className="text-xs text-gray-400 mt-1 block">{product.category.name}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-red-600">${product.price?.toFixed(2)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            size="xs"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
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

// Search Filters Component
const SearchFilters = ({
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
        fixed lg:static inset-y-0 right-0 z-50 w-72 bg-white lg:bg-transparent
        transform transition-transform duration-300 lg:transform-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        overflow-y-auto
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
              <h3 className="font-semibold text-gray-800">Filters</h3>
              <button
                onClick={onClearFilters}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Category</h4>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Categories</option>
                {categories.filter(c => c.isActive).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
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

// Search Suggestions Component
const SearchSuggestions = ({ suggestions, recentSearches, trendingSearches, onSelect }) => {
  if (!suggestions.length && !recentSearches.length && !trendingSearches.length) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
      {/* Suggestions from search */}
      {suggestions.length > 0 && (
        <div className="p-2">
          <p className="text-xs text-gray-500 px-3 py-1">Suggestions</p>
          {suggestions.map((product, index) => (
            <button
              key={product._id || index}
              onClick={() => onSelect(product.name)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-3"
            >
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 truncate">{product.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && suggestions.length === 0 && (
        <div className="p-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 px-3 py-1 flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            Recent Searches
          </p>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => onSelect(search)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-3"
            >
              <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 truncate">{search}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trending Searches */}
      {trendingSearches.length > 0 && suggestions.length === 0 && (
        <div className="p-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 px-3 py-1 flex items-center gap-1">
            <ArrowTrendingUpIcon className="h-3 w-3" />
            Trending
          </p>
          {trendingSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => onSelect(search)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-3"
            >
              <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-gray-700 truncate">{search}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { products, pagination, isLoading } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Trending searches (static for demo)
  const trendingSearches = useMemo(() => [
    'Burger',
    'Pizza',
    'Fries',
    'Combo Meal',
    'Drinks'
  ], []);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // Search products when debounced query changes
  useEffect(() => {
    const params = {
      q: debouncedSearch,
      page: 1,
      limit: 20,
      ...(selectedCategory && { category: selectedCategory }),
      ...(priceRange.min && { minPrice: priceRange.min }),
      ...(priceRange.max && { maxPrice: priceRange.max })
    };

    // Update URL params
    const newParams = new URLSearchParams();
    if (debouncedSearch) newParams.set('q', debouncedSearch);
    if (selectedCategory) newParams.set('category', selectedCategory);
    if (priceRange.min) newParams.set('minPrice', priceRange.min);
    if (priceRange.max) newParams.set('maxPrice', priceRange.max);
    setSearchParams(newParams);

    if (debouncedSearch || selectedCategory || priceRange.min || priceRange.max) {
      dispatch(searchProducts(params));
    }
  }, [dispatch, debouncedSearch, selectedCategory, priceRange, setSearchParams]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setShowSuggestions(false);

    // Save to recent searches
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  }, [recentSearches]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1, addOns: [] }));
  };

  const handleLoadMore = () => {
    const params = {
      q: debouncedSearch,
      page: pagination.page + 1,
      limit: 20,
      ...(selectedCategory && { category: selectedCategory }),
      ...(priceRange.min && { minPrice: priceRange.min }),
      ...(priceRange.max && { maxPrice: priceRange.max })
    };
    dispatch(searchProducts(params));
  };

  // Get suggestions (first few products matching partial query)
  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return products.slice(0, 5);
  }, [products, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Search Products</h1>

        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for burgers, fries, drinks..."
              className="w-full pl-12 pr-12 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {showSuggestions && (
            <SearchSuggestions
              suggestions={suggestions}
              recentSearches={!searchQuery ? recentSearches : []}
              trendingSearches={!searchQuery ? trendingSearches : []}
              onSelect={handleSearch}
            />
          )}
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <span className="text-gray-600">
          {pagination.total} results found
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(true)}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <main className="flex-1">
          {isLoading && products.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !searchQuery && !selectedCategory && !priceRange.min && !priceRange.max ? (
            <Card className="p-12 text-center">
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Searching</h3>
              <p className="text-gray-500 mb-4">
                Enter a search term or select a category to find products.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {trendingSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(term)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </Card>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Results Found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find any products matching "{searchQuery}". Try different keywords.
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setSearchQuery('');
                  handleClearFilters();
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Clear Search
              </Button>
            </Card>
          ) : (
            <>
              {/* Results Header */}
              <div className="hidden lg:flex items-center justify-between mb-4">
                <span className="text-gray-600">
                  {pagination.total} results for "{searchQuery || 'all products'}"
                </span>
              </div>

              {/* Results Grid */}
              <div className="space-y-3">
                {products.map((product) => (
                  <SearchProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
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
                    Load More Results
                  </Button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <SearchFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            onClearFilters={handleClearFilters}
            isOpen={false}
            onClose={() => {}}
          />
        </aside>

        {/* Mobile Filter Sidebar */}
        <SearchFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={(cat) => {
            setSelectedCategory(cat);
            setShowFilters(false);
          }}
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          onClearFilters={() => {
            handleClearFilters();
            setShowFilters(false);
          }}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />
      </div>
    </div>
  );
};

export default SearchPage;
