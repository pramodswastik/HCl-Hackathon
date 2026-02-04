/**
 * Database Seeding Script
 * 
 * Usage:
 *   npm run seed        - Seed database with sample data
 *   npm run seed:reset  - Clear database and reseed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Category, Product, Order } = require('../models');

// Sample data
const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@foodhub.com',
    password: 'Admin@123456',
    role: 'admin',
    isEmailVerified: true,
    phone: '+1234567890'
  },
  {
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@example.com',
    password: 'Customer@123',
    role: 'customer',
    isEmailVerified: true,
    phone: '+919876543210',
    addresses: [
      {
        type: 'home',
        street: '42 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@example.com',
    password: 'Customer@123',
    role: 'customer',
    isEmailVerified: true,
    phone: '+919988776655'
  }
];

const categories = [
  {
    name: 'Burgers',
    description: 'Delicious gourmet burgers with fresh ingredients',
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Pizza',
    description: 'Authentic wood-fired pizzas with premium toppings',
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Beverages',
    description: 'Refreshing drinks and beverages',
    isActive: true,
    displayOrder: 3
  },
  {
    name: 'Desserts',
    description: 'Sweet treats and delicious desserts',
    isActive: true,
    displayOrder: 4
  },
  {
    name: 'Sides',
    description: 'Perfect accompaniments to your meal',
    isActive: true,
    displayOrder: 5
  },
  {
    name: 'Indian',
    description: 'Authentic Indian cuisine',
    isActive: true,
    displayOrder: 6
  }
];

const products = [
  // Burgers
  {
    name: 'Classic Cheese Burger',
    description: 'Juicy beef patty with melted cheddar cheese, fresh lettuce, tomatoes, onions, pickles, and our special sauce on a toasted sesame bun.',
    shortDescription: 'Classic beef burger with cheese',
    price: 249,
    compareAtPrice: 299,
    categoryName: 'Burgers',
    stock: { quantity: 100, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['burger', 'cheese', 'beef', 'bestseller'],
    images: [
      { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', alt: 'Classic Cheese Burger', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Cheese', price: 30, isAvailable: true },
      { name: 'Bacon', price: 50, isAvailable: true },
      { name: 'Jalapenos', price: 20, isAvailable: true }
    ]
  },
  {
    name: 'Crispy Chicken Burger',
    description: 'Crispy fried chicken breast with coleslaw, pickles, and spicy mayo on a brioche bun.',
    shortDescription: 'Crispy chicken with spicy mayo',
    price: 229,
    categoryName: 'Burgers',
    stock: { quantity: 80, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['burger', 'chicken', 'crispy'],
    images: [
      { url: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800', alt: 'Crispy Chicken Burger', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Sauce', price: 15, isAvailable: true },
      { name: 'Cheese Slice', price: 25, isAvailable: true }
    ]
  },
  {
    name: 'BBQ Bacon Burger',
    description: 'Smoky BBQ glazed beef patty topped with crispy bacon, onion rings, and tangy BBQ sauce.',
    shortDescription: 'BBQ beef burger with bacon',
    price: 329,
    compareAtPrice: 379,
    categoryName: 'Burgers',
    stock: { quantity: 60, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['burger', 'bbq', 'bacon', 'premium'],
    images: [
      { url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800', alt: 'BBQ Bacon Burger', isPrimary: true }
    ],
    addOns: [
      { name: 'Double Patty', price: 100, isAvailable: true },
      { name: 'Extra Bacon', price: 60, isAvailable: true }
    ]
  },
  {
    name: 'Veggie Delight Burger',
    description: 'Grilled vegetable patty with avocado, sprouts, tomato, and herb mayo on a whole wheat bun.',
    shortDescription: 'Healthy veggie burger',
    price: 199,
    categoryName: 'Burgers',
    stock: { quantity: 70, lowStockThreshold: 10 },
    status: 'active',
    tags: ['burger', 'vegetarian', 'healthy'],
    images: [
      { url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800', alt: 'Veggie Delight Burger', isPrimary: true }
    ],
    addOns: [
      { name: 'Avocado', price: 40, isAvailable: true },
      { name: 'Cheese', price: 25, isAvailable: true }
    ]
  },

  // Pizza
  {
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with San Marzano tomato sauce, fresh mozzarella, basil, and extra virgin olive oil.',
    shortDescription: 'Classic tomato and mozzarella',
    price: 349,
    categoryName: 'Pizza',
    stock: { quantity: 50, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['pizza', 'vegetarian', 'classic', 'italian'],
    images: [
      { url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800', alt: 'Margherita Pizza', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Cheese', price: 50, isAvailable: true },
      { name: 'Olives', price: 30, isAvailable: true }
    ]
  },
  {
    name: 'Pepperoni Supreme',
    description: 'Loaded with spicy pepperoni, mozzarella cheese, and our signature tomato sauce on a hand-tossed crust.',
    shortDescription: 'Loaded pepperoni pizza',
    price: 449,
    compareAtPrice: 499,
    categoryName: 'Pizza',
    stock: { quantity: 45, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['pizza', 'pepperoni', 'bestseller'],
    images: [
      { url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800', alt: 'Pepperoni Supreme', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Pepperoni', price: 60, isAvailable: true },
      { name: 'Stuffed Crust', price: 80, isAvailable: true }
    ]
  },
  {
    name: 'BBQ Chicken Pizza',
    description: 'Grilled chicken, red onions, cilantro, and tangy BBQ sauce with smoked gouda cheese.',
    shortDescription: 'BBQ chicken with smoked gouda',
    price: 479,
    categoryName: 'Pizza',
    stock: { quantity: 40, lowStockThreshold: 10 },
    status: 'active',
    tags: ['pizza', 'chicken', 'bbq'],
    images: [
      { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', alt: 'BBQ Chicken Pizza', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Chicken', price: 70, isAvailable: true },
      { name: 'Jalapenos', price: 25, isAvailable: true }
    ]
  },
  {
    name: 'Veggie Garden Pizza',
    description: 'Fresh bell peppers, mushrooms, onions, olives, tomatoes, and spinach with a garlic herb base.',
    shortDescription: 'Fresh vegetable medley',
    price: 399,
    categoryName: 'Pizza',
    stock: { quantity: 55, lowStockThreshold: 10 },
    status: 'active',
    tags: ['pizza', 'vegetarian', 'healthy'],
    images: [
      { url: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=800', alt: 'Veggie Garden Pizza', isPrimary: true }
    ],
    addOns: [
      { name: 'Paneer', price: 50, isAvailable: true },
      { name: 'Extra Veggies', price: 40, isAvailable: true }
    ]
  },

  // Beverages
  {
    name: 'Fresh Lime Soda',
    description: 'Refreshing lime juice with soda, mint, and a hint of black salt.',
    shortDescription: 'Refreshing lime soda',
    price: 79,
    categoryName: 'Beverages',
    stock: { quantity: 200, lowStockThreshold: 30 },
    status: 'active',
    tags: ['drink', 'refreshing', 'lime'],
    images: [
      { url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800', alt: 'Fresh Lime Soda', isPrimary: true }
    ]
  },
  {
    name: 'Mango Smoothie',
    description: 'Creamy mango smoothie made with fresh Alphonso mangoes and yogurt.',
    shortDescription: 'Creamy Alphonso mango smoothie',
    price: 149,
    categoryName: 'Beverages',
    stock: { quantity: 100, lowStockThreshold: 20 },
    status: 'active',
    isFeatured: true,
    tags: ['drink', 'smoothie', 'mango', 'healthy'],
    images: [
      { url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800', alt: 'Mango Smoothie', isPrimary: true }
    ]
  },
  {
    name: 'Cold Coffee',
    description: 'Rich and creamy cold coffee blended with vanilla ice cream.',
    shortDescription: 'Creamy cold coffee',
    price: 129,
    categoryName: 'Beverages',
    stock: { quantity: 150, lowStockThreshold: 25 },
    status: 'active',
    tags: ['drink', 'coffee', 'cold'],
    images: [
      { url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800', alt: 'Cold Coffee', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Shot', price: 30, isAvailable: true },
      { name: 'Whipped Cream', price: 20, isAvailable: true }
    ]
  },
  {
    name: 'Masala Chai',
    description: 'Traditional Indian spiced tea with cardamom, ginger, and cinnamon.',
    shortDescription: 'Traditional spiced tea',
    price: 49,
    categoryName: 'Beverages',
    stock: { quantity: 300, lowStockThreshold: 50 },
    status: 'active',
    tags: ['drink', 'tea', 'indian', 'traditional'],
    images: [
      { url: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=800', alt: 'Masala Chai', isPrimary: true }
    ]
  },

  // Desserts
  {
    name: 'Chocolate Brownie',
    description: 'Warm fudgy chocolate brownie served with vanilla ice cream and chocolate sauce.',
    shortDescription: 'Fudgy brownie with ice cream',
    price: 179,
    categoryName: 'Desserts',
    stock: { quantity: 60, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['dessert', 'chocolate', 'brownie'],
    images: [
      { url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=800', alt: 'Chocolate Brownie', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Ice Cream', price: 40, isAvailable: true },
      { name: 'Nuts', price: 25, isAvailable: true }
    ]
  },
  {
    name: 'Gulab Jamun',
    description: 'Soft milk dumplings soaked in rose-flavored sugar syrup, served warm.',
    shortDescription: 'Traditional Indian sweet',
    price: 99,
    categoryName: 'Desserts',
    stock: { quantity: 80, lowStockThreshold: 15 },
    status: 'active',
    tags: ['dessert', 'indian', 'traditional', 'sweet'],
    images: [
      { url: 'https://images.unsplash.com/photo-1666190094762-2e498bde71e0?w=800', alt: 'Gulab Jamun', isPrimary: true }
    ]
  },
  {
    name: 'New York Cheesecake',
    description: 'Creamy classic cheesecake with graham cracker crust and berry compote.',
    shortDescription: 'Classic creamy cheesecake',
    price: 229,
    categoryName: 'Desserts',
    stock: { quantity: 40, lowStockThreshold: 8 },
    status: 'active',
    tags: ['dessert', 'cheesecake', 'premium'],
    images: [
      { url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800', alt: 'New York Cheesecake', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Berries', price: 35, isAvailable: true },
      { name: 'Whipped Cream', price: 20, isAvailable: true }
    ]
  },

  // Sides
  {
    name: 'French Fries',
    description: 'Crispy golden french fries seasoned with herbs and served with ketchup.',
    shortDescription: 'Crispy seasoned fries',
    price: 99,
    categoryName: 'Sides',
    stock: { quantity: 200, lowStockThreshold: 30 },
    status: 'active',
    tags: ['sides', 'fries', 'snack'],
    images: [
      { url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800', alt: 'French Fries', isPrimary: true }
    ],
    addOns: [
      { name: 'Cheese Dip', price: 30, isAvailable: true },
      { name: 'Peri Peri Seasoning', price: 20, isAvailable: true }
    ]
  },
  {
    name: 'Onion Rings',
    description: 'Crispy battered onion rings served with garlic aioli.',
    shortDescription: 'Crispy onion rings',
    price: 129,
    categoryName: 'Sides',
    stock: { quantity: 120, lowStockThreshold: 20 },
    status: 'active',
    tags: ['sides', 'snack', 'crispy'],
    images: [
      { url: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800', alt: 'Onion Rings', isPrimary: true }
    ]
  },
  {
    name: 'Chicken Wings',
    description: 'Crispy fried chicken wings tossed in your choice of buffalo, BBQ, or honey garlic sauce.',
    shortDescription: 'Crispy wings with sauce',
    price: 249,
    compareAtPrice: 299,
    categoryName: 'Sides',
    stock: { quantity: 80, lowStockThreshold: 15 },
    status: 'active',
    isFeatured: true,
    tags: ['sides', 'chicken', 'wings', 'spicy'],
    images: [
      { url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800', alt: 'Chicken Wings', isPrimary: true }
    ],
    addOns: [
      { name: 'Extra Sauce', price: 25, isAvailable: true },
      { name: 'Blue Cheese Dip', price: 35, isAvailable: true }
    ]
  },
  {
    name: 'Garlic Bread',
    description: 'Toasted garlic bread with herbs and melted butter.',
    shortDescription: 'Toasted garlic bread',
    price: 79,
    categoryName: 'Sides',
    stock: { quantity: 150, lowStockThreshold: 25 },
    status: 'active',
    tags: ['sides', 'bread', 'garlic'],
    images: [
      { url: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800', alt: 'Garlic Bread', isPrimary: true }
    ],
    addOns: [
      { name: 'Cheese Topping', price: 30, isAvailable: true }
    ]
  },

  // Indian
  {
    name: 'Butter Chicken',
    description: 'Tender chicken pieces in a rich, creamy tomato-based curry with butter and spices.',
    shortDescription: 'Creamy tomato chicken curry',
    price: 349,
    categoryName: 'Indian',
    stock: { quantity: 60, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['indian', 'curry', 'chicken', 'bestseller'],
    images: [
      { url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800', alt: 'Butter Chicken', isPrimary: true }
    ],
    addOns: [
      { name: 'Naan', price: 40, isAvailable: true },
      { name: 'Rice', price: 50, isAvailable: true }
    ]
  },
  {
    name: 'Paneer Tikka',
    description: 'Marinated cottage cheese cubes grilled to perfection with bell peppers and onions.',
    shortDescription: 'Grilled marinated paneer',
    price: 279,
    categoryName: 'Indian',
    stock: { quantity: 70, lowStockThreshold: 12 },
    status: 'active',
    tags: ['indian', 'paneer', 'vegetarian', 'grilled'],
    images: [
      { url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800', alt: 'Paneer Tikka', isPrimary: true }
    ],
    addOns: [
      { name: 'Mint Chutney', price: 20, isAvailable: true },
      { name: 'Extra Paneer', price: 60, isAvailable: true }
    ]
  },
  {
    name: 'Biryani',
    description: 'Fragrant basmati rice layered with spiced chicken, caramelized onions, and saffron.',
    shortDescription: 'Aromatic layered rice dish',
    price: 299,
    categoryName: 'Indian',
    stock: { quantity: 50, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['indian', 'rice', 'biryani', 'chicken'],
    images: [
      { url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', alt: 'Biryani', isPrimary: true }
    ],
    addOns: [
      { name: 'Raita', price: 30, isAvailable: true },
      { name: 'Extra Chicken', price: 80, isAvailable: true }
    ]
  },
  {
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils in a rich, creamy tomato gravy with butter and cream.',
    shortDescription: 'Creamy black lentil curry',
    price: 199,
    categoryName: 'Indian',
    stock: { quantity: 80, lowStockThreshold: 15 },
    status: 'active',
    tags: ['indian', 'dal', 'vegetarian', 'lentils'],
    images: [
      { url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800', alt: 'Dal Makhani', isPrimary: true }
    ],
    addOns: [
      { name: 'Butter Naan', price: 45, isAvailable: true },
      { name: 'Jeera Rice', price: 50, isAvailable: true }
    ]
  }
];

// Seeding functions
async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  await Order.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
  console.log('✅ Database cleared');
}

async function seedUsers() {
  console.log('👤 Seeding users...');
  const createdUsers = [];
  
  for (const userData of users) {
    const user = await User.create(userData);
    createdUsers.push(user);
    console.log(`   Created user: ${user.email}`);
  }
  
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

async function seedCategories() {
  console.log('📁 Seeding categories...');
  const categoryMap = new Map();
  
  // Create all categories (no parents in this simplified structure)
  for (const catData of categories) {
    const category = await Category.create({
      name: catData.name,
      description: catData.description,
      isActive: catData.isActive,
      displayOrder: catData.displayOrder
    });
    categoryMap.set(catData.name, category);
    console.log(`   Created category: ${category.name}`);
  }
  
  console.log(`✅ Created ${categoryMap.size} categories`);
  return categoryMap;
}

async function seedProducts(categoryMap, adminUser) {
  console.log('📦 Seeding products...');
  const createdProducts = [];
  
  for (const prodData of products) {
    const category = categoryMap.get(prodData.categoryName);
    if (!category) {
      console.warn(`   ⚠️  Category "${prodData.categoryName}" not found, skipping product "${prodData.name}"`);
      continue;
    }
    
    const product = await Product.create({
      ...prodData,
      category: category._id,
      createdBy: adminUser._id
    });
    createdProducts.push(product);
    console.log(`   Created product: ${product.name}`);
  }
  
  // Update category product counts
  for (const [name, category] of categoryMap) {
    const count = await Product.countDocuments({ category: category._id });
    await Category.findByIdAndUpdate(category._id, { 'metadata.productCount': count });
  }
  
  console.log(`✅ Created ${createdProducts.length} products`);
  return createdProducts;
}

async function seedSampleOrder(users, products) {
  console.log('🛒 Creating sample order...');
  
  const customer = users.find(u => u.role === 'customer');
  if (!customer || products.length < 2) {
    console.log('   ⚠️  Skipping sample order (need customer and products)');
    return null;
  }
  
  const orderItems = products.slice(0, 3).map(p => ({
    product: p._id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    quantity: 1,
    subtotal: p.price
  }));
  
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.08;
  
  const order = await Order.create({
    user: customer._id,
    items: orderItems,
    shippingAddress: customer.addresses?.[0] || {
      street: '42 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    pricing: {
      subtotal,
      tax,
      taxRate: 0.08,
      shipping: 0,
      discount: 0,
      total: subtotal + tax
    },
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    paymentDetails: {
      transactionId: 'TXN' + Date.now(),
      paidAt: new Date()
    }
  });
  
  console.log(`✅ Created sample order: ${order.orderNumber}`);
  return order;
}

// Main seed function
async function seed(reset = false) {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');
    
    if (reset) {
      await clearDatabase();
    }
    
    console.log('');
    const createdUsers = await seedUsers();
    console.log('');
    const categoryMap = await seedCategories();
    console.log('');
    const adminUser = createdUsers.find(u => u.role === 'admin');
    const createdProducts = await seedProducts(categoryMap, adminUser);
    console.log('');
    await seedSampleOrder(createdUsers, createdProducts);
    
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Categories: ${categoryMap.size}`);
    console.log(`   - Products: ${createdProducts.length}`);
    console.log('\n📧 Admin credentials:');
    console.log('   Email: admin@foodhub.com');
    console.log('   Password: Admin@123456');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 Database connection closed');
  }
}

// Run based on command line argument
const reset = process.argv.includes('--reset');
seed(reset).catch(() => process.exit(1));
