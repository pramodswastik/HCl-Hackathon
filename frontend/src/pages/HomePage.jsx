import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '@/store/slices/categorySlice';
import { getProducts } from '@/store/slices/productSlice';
import { Spinner, Card, Button } from '@/components/ui';
import { 
  ShoppingCartIcon, 
  FireIcon, 
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { addToCart } from '@/store/slices/cartSlice';

// Hero Banner Component with promotional content
const HeroBanner = () => {
  const banners = [
    {
      id: 1,
      title: "Today's Special",
      subtitle: "Get 20% off on all combo meals",
      bgColor: "from-red-600 to-yellow-500",
      icon: FireIcon,
      cta: "Order Now",
      link: "/products"
    },
    {
      id: 2,
      title: "Free Delivery",
      subtitle: "On orders above $25",
      bgColor: "from-amber-500 to-orange-600",
      icon: ClockIcon,
      cta: "Shop Now",
      link: "/products"
    }
  ];

  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const banner = banners[currentBanner];
  const Icon = banner.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${banner.bgColor} p-8 md:p-12 mb-8 transition-all duration-500`}>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
        <div className="text-white mb-6 md:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium uppercase tracking-wider opacity-90">Limited Time</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">{banner.title}</h2>
          <p className="text-lg opacity-90 mb-4">{banner.subtitle}</p>
          <Link to={banner.link}>
            <Button variant="outline" className="bg-white text-red-600 border-white hover:bg-gray-100">
              {banner.cta}
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        <div className="hidden md:block">
          <SparklesIcon className="h-32 w-32 text-white/20" />
        </div>
      </div>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Banner indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentBanner(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentBanner ? 'bg-white w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category }) => {
  return (
    <Link to={`/category/${category._id}`} className="group">
      <Card 
        hoverable 
        className="flex flex-col items-center justify-center p-6 h-40 transition-all duration-300 group-hover:border-red-500 group-hover:shadow-lg"
      >
        <div className="w-16 h-16 mb-3 rounded-full bg-gradient-to-br from-red-100 to-yellow-100 flex items-center justify-center overflow-hidden">
          {category.logo?.url ? (
            <img 
              src={category.logo.url} 
              alt={category.name}
              className="w-12 h-12 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-2xl font-bold text-red-600">
              {category.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-800 text-center group-hover:text-red-600 transition-colors">
          {category.name}
        </h3>
        {category.metadata?.productCount > 0 && (
          <span className="text-xs text-gray-500 mt-1">
            {category.metadata.productCount} items
          </span>
        )}
      </Card>
    </Link>
  );
};

// Quick Nav Chip Component
const QuickNavChip = ({ category, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
      isActive
        ? 'bg-red-600 text-white shadow-md'
        : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600'
    }`}
  >
    {category.name}
  </button>
);

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  
  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

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
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
            {product.shortDescription}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-red-600">
              ${product.price?.toFixed(2)}
            </span>
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

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { categories, isLoading: categoriesLoading } = useSelector((state) => state.categories);
  const { products, isLoading: productsLoading } = useSelector((state) => state.products);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    dispatch(getCategories());
    dispatch(getProducts({ limit: 8, featured: true }));
  }, [dispatch]);

  useEffect(() => {
    // Filter featured products or show first 8
    if (products && products.length > 0) {
      const featured = products.filter(p => p.isFeatured);
      setFeaturedProducts(featured.length > 0 ? featured : products.slice(0, 8));
    }
  }, [products]);

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1, addOns: [] }));
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category._id === selectedCategory ? null : category._id);
    navigate(`/category/${category._id}`);
  };

  const activeCategories = (categories || []).filter(c => c.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Banner Section */}
      <HeroBanner />

      {/* Quick Category Navigation */}
      {activeCategories.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Quick Order:</span>
            {activeCategories.slice(0, 8).map((category) => (
              <QuickNavChip
                key={category._id}
                category={category}
                isActive={selectedCategory === category._id}
                onClick={() => handleCategoryClick(category)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Showcase Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Explore Menu</h2>
            <p className="text-gray-500 mt-1">Discover our delicious categories</p>
          </div>
          <Link to="/products" className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
            View All <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        
        {categoriesLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeCategories.slice(0, 6).map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <FireIcon className="h-6 w-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-800">Popular Right Now</h2>
            </div>
            <p className="text-gray-500 mt-1">Our most loved items</p>
          </div>
          <Link to="/products" className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
            See More <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard 
                key={product._id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* Promotional Banner - Bottom */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-yellow-400 to-red-500 rounded-2xl p-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Download Our App
          </h3>
          <p className="text-white/90 mb-4">
            Order faster, earn rewards, and get exclusive deals!
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="bg-white text-red-600 border-white hover:bg-gray-100">
              App Store
            </Button>
            <Button variant="outline" className="bg-white text-red-600 border-white hover:bg-gray-100">
              Play Store
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
