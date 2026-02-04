import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProduct, clearProduct } from '@/store/slices/productSlice';
import { addToCart } from '@/store/slices/cartSlice';
import { Spinner, Card, Button } from '@/components/ui';
import {
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  HeartIcon,
  ShareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// Image Gallery Component
const ImageGallery = ({ images = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const displayImages = images.length > 0 ? images : [{ url: null, alt: 'No image' }];
  const currentImage = displayImages[selectedIndex];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-zoom-in"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        {currentImage?.url ? (
          <img
            src={currentImage.url}
            alt={currentImage.alt || 'Product image'}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCartIcon className="h-24 w-24 text-gray-300" />
          </div>
        )}

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-red-600 ring-2 ring-red-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {image?.url ? (
                <img
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ShoppingCartIcon className="h-6 w-6 text-gray-300" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Quantity Selector Component
const QuantitySelector = ({ quantity, onQuantityChange, max = 99, min = 1 }) => {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onQuantityChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <MinusIcon className="h-5 w-5" />
      </button>
      <input
        type="number"
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value) || min;
          onQuantityChange(Math.min(max, Math.max(min, val)));
        }}
        className="w-16 text-center text-lg font-semibold border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
        min={min}
        max={max}
      />
      <button
        onClick={() => onQuantityChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <PlusIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

// Add-on Selection Component
const AddOnSelector = ({ addOns = [], selectedAddOns, onAddOnToggle }) => {
  if (!addOns || addOns.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Customize Your Order</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {addOns.filter(addon => addon.isAvailable !== false).map((addon, index) => {
          const isSelected = selectedAddOns.some(a => a.name === addon.name);
          return (
            <button
              key={index}
              onClick={() => onAddOnToggle(addon)}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-red-600 bg-red-600' : 'border-gray-300'
                }`}>
                  {isSelected && <CheckCircleIcon className="h-4 w-4 text-white" />}
                </div>
                <span className="font-medium text-gray-700">{addon.name}</span>
              </div>
              <span className="text-red-600 font-semibold">+${addon.price?.toFixed(2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Rating Stars Component
const RatingStars = ({ rating = 0, count = 0 }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= Math.floor(rating) ? (
            <StarSolidIcon key={star} className="h-5 w-5 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="h-5 w-5 text-gray-300" />
          )
        ))}
      </div>
      <span className="text-gray-600 text-sm">
        {rating.toFixed(1)} ({count} reviews)
      </span>
    </div>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { product, isLoading, error } = useSelector((state) => state.products);

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    dispatch(getProduct(id));
    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, id]);

  const handleAddOnToggle = (addon) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some(a => a.name === addon.name);
      if (exists) {
        return prev.filter(a => a.name !== addon.name);
      }
      return [...prev, addon];
    });
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    const addOnTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    return (product.price + addOnTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({
      product,
      quantity,
      addOns: selectedAddOns
    }));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.shortDescription || product?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card className="p-12 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-4">{error || "The product you're looking for doesn't exist."}</p>
          <Button variant="primary" onClick={() => navigate('/products')} className="bg-red-600 hover:bg-red-700">
            Browse Products
          </Button>
        </Card>
      </div>
    );
  }

  const inStock = product.stock?.quantity > 0;
  const lowStock = product.stock?.quantity > 0 && product.stock?.quantity <= (product.stock?.lowStockThreshold || 10);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-red-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-red-600">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/category/${product.category._id || product.category}`} className="hover:text-red-600">
              {product.category.name || 'Category'}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-800 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image Gallery */}
        <div>
          <ImageGallery images={product.images} />
        </div>

        {/* Right: Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {product.isFeatured && (
                  <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium mb-2">
                    Featured
                  </span>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  {product.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  {isFavorite ? (
                    <HeartSolidIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <ShareIcon className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Ratings */}
            {product.ratings?.count > 0 && (
              <RatingStars rating={product.ratings.average} count={product.ratings.count} />
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-red-600">
              ${product.price?.toFixed(2)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
                <span className="bg-green-100 text-green-700 text-sm font-medium px-2 py-1 rounded">
                  Save {Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          {(product.shortDescription || product.description) && (
            <div>
              <p className="text-gray-600 leading-relaxed">
                {product.shortDescription || product.description}
              </p>
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {inStock ? (
              <>
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span className={`font-medium ${lowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                  {lowStock ? `Only ${product.stock.quantity} left in stock!` : 'In Stock'}
                </span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-600">Out of Stock</span>
              </>
            )}
          </div>

          {/* Add-ons */}
          {product.addOns && product.addOns.length > 0 && (
            <AddOnSelector
              addOns={product.addOns}
              selectedAddOns={selectedAddOns}
              onAddOnToggle={handleAddOnToggle}
            />
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  max={product.stock?.quantity || 99}
                />
              </div>

              <div className="flex-1 sm:text-right">
                <p className="text-sm text-gray-500 mb-1">Total Price</p>
                <p className="text-2xl font-bold text-red-600">
                  ${calculateTotalPrice().toFixed(2)}
                </p>
              </div>
            </div>

            <Button
              fullWidth
              size="xl"
              variant="primary"
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`${addedToCart ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {addedToCart ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>

          {/* Product Details */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Product Details</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {product.attributes.map((attr, index) => (
                  <div key={index}>
                    <dt className="text-gray-500">{attr.name}</dt>
                    <dd className="font-medium text-gray-800">{attr.value}</dd>
                  </div>
                ))}
                {product.sku && (
                  <div>
                    <dt className="text-gray-500">SKU</dt>
                    <dd className="font-medium text-gray-800">{product.sku}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Description */}
      {product.description && product.description !== product.shortDescription && (
        <div className="mt-12">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Description</h2>
            <div className="prose max-w-none text-gray-600">
              <p>{product.description}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
