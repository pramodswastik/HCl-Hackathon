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
    email: 'admin@retailportal.com',
    password: 'Admin@123456',
    role: 'admin',
    isEmailVerified: true,
    phone: '+1234567890'
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'Customer@123',
    role: 'customer',
    isEmailVerified: true,
    phone: '+1987654321',
    addresses: [
      {
        type: 'home',
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'Customer@123',
    role: 'customer',
    isEmailVerified: true,
    phone: '+1122334455'
  }
];

const categories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Smartphones',
    description: 'Mobile phones and accessories',
    isActive: true,
    displayOrder: 1,
    parentName: 'Electronics'
  },
  {
    name: 'Laptops',
    description: 'Laptops and notebooks',
    isActive: true,
    displayOrder: 2,
    parentName: 'Electronics'
  },
  {
    name: 'Clothing',
    description: 'Fashion and apparel',
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Men\'s Clothing',
    description: 'Men\'s fashion and apparel',
    isActive: true,
    displayOrder: 1,
    parentName: 'Clothing'
  },
  {
    name: 'Women\'s Clothing',
    description: 'Women\'s fashion and apparel',
    isActive: true,
    displayOrder: 2,
    parentName: 'Clothing'
  },
  {
    name: 'Home & Kitchen',
    description: 'Home appliances and kitchenware',
    isActive: true,
    displayOrder: 3
  },
  {
    name: 'Books',
    description: 'Books and educational materials',
    isActive: true,
    displayOrder: 4
  },
  {
    name: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    isActive: true,
    displayOrder: 5
  }
];

const products = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
    shortDescription: 'Latest iPhone with A17 Pro chip',
    price: 1199.99,
    compareAtPrice: 1299.99,
    categoryName: 'Smartphones',
    stock: { quantity: 50, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['apple', 'smartphone', 'premium'],
    images: [{ url: 'https://placeholder.com/iphone15.jpg', alt: 'iPhone 15 Pro Max', isPrimary: true }]
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Samsung\'s flagship phone with S Pen, AI features, and titanium frame.',
    shortDescription: 'Samsung flagship with S Pen',
    price: 1099.99,
    compareAtPrice: 1199.99,
    categoryName: 'Smartphones',
    stock: { quantity: 45, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['samsung', 'smartphone', 'android'],
    images: [{ url: 'https://placeholder.com/galaxy-s24.jpg', alt: 'Samsung Galaxy S24 Ultra', isPrimary: true }]
  },
  {
    name: 'MacBook Pro 16" M3 Max',
    description: 'Powerful laptop with M3 Max chip, up to 128GB RAM, and stunning Liquid Retina XDR display.',
    shortDescription: 'Powerful laptop with M3 Max chip',
    price: 3499.99,
    categoryName: 'Laptops',
    stock: { quantity: 25, lowStockThreshold: 5 },
    status: 'active',
    isFeatured: true,
    tags: ['apple', 'laptop', 'professional'],
    images: [{ url: 'https://placeholder.com/macbook-pro.jpg', alt: 'MacBook Pro 16"', isPrimary: true }]
  },
  {
    name: 'Dell XPS 15',
    description: 'Premium Windows laptop with InfinityEdge display and Intel Core Ultra processor.',
    shortDescription: 'Premium Windows laptop',
    price: 1899.99,
    compareAtPrice: 2099.99,
    categoryName: 'Laptops',
    stock: { quantity: 30, lowStockThreshold: 5 },
    status: 'active',
    tags: ['dell', 'laptop', 'windows'],
    images: [{ url: 'https://placeholder.com/dell-xps.jpg', alt: 'Dell XPS 15', isPrimary: true }]
  },
  {
    name: 'Classic Cotton T-Shirt',
    description: '100% organic cotton t-shirt, comfortable and breathable.',
    shortDescription: 'Comfortable organic cotton tee',
    price: 29.99,
    categoryName: 'Men\'s Clothing',
    stock: { quantity: 200, lowStockThreshold: 20 },
    status: 'active',
    tags: ['clothing', 'casual', 'cotton'],
    images: [{ url: 'https://placeholder.com/tshirt.jpg', alt: 'Cotton T-Shirt', isPrimary: true }]
  },
  {
    name: 'Summer Floral Dress',
    description: 'Light and airy floral dress perfect for summer occasions.',
    shortDescription: 'Light floral summer dress',
    price: 79.99,
    compareAtPrice: 99.99,
    categoryName: 'Women\'s Clothing',
    stock: { quantity: 75, lowStockThreshold: 10 },
    status: 'active',
    tags: ['clothing', 'dress', 'summer'],
    images: [{ url: 'https://placeholder.com/dress.jpg', alt: 'Summer Floral Dress', isPrimary: true }]
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-use pressure cooker, slow cooker, rice cooker, steamer, and more.',
    shortDescription: '7-in-1 multi-use pressure cooker',
    price: 89.99,
    compareAtPrice: 119.99,
    categoryName: 'Home & Kitchen',
    stock: { quantity: 60, lowStockThreshold: 10 },
    status: 'active',
    isFeatured: true,
    tags: ['kitchen', 'appliance', 'cooking'],
    images: [{ url: 'https://placeholder.com/instant-pot.jpg', alt: 'Instant Pot Duo', isPrimary: true }]
  },
  {
    name: 'The Art of Programming',
    description: 'Comprehensive guide to software development best practices.',
    shortDescription: 'Software development guide',
    price: 49.99,
    categoryName: 'Books',
    stock: { quantity: 100, lowStockThreshold: 15 },
    status: 'active',
    tags: ['book', 'programming', 'education'],
    images: [{ url: 'https://placeholder.com/programming-book.jpg', alt: 'Programming Book', isPrimary: true }]
  },
  {
    name: 'Professional Yoga Mat',
    description: 'Non-slip yoga mat with extra cushioning for comfort during practice.',
    shortDescription: 'Non-slip yoga mat with cushioning',
    price: 45.99,
    categoryName: 'Sports & Outdoors',
    stock: { quantity: 80, lowStockThreshold: 10 },
    status: 'active',
    tags: ['yoga', 'fitness', 'exercise'],
    images: [{ url: 'https://placeholder.com/yoga-mat.jpg', alt: 'Yoga Mat', isPrimary: true }]
  },
  {
    name: 'Wireless Bluetooth Earbuds',
    description: 'High-quality wireless earbuds with active noise cancellation and 24-hour battery life.',
    shortDescription: 'Wireless earbuds with ANC',
    price: 149.99,
    compareAtPrice: 179.99,
    categoryName: 'Electronics',
    stock: { quantity: 120, lowStockThreshold: 20 },
    status: 'active',
    isFeatured: true,
    tags: ['audio', 'wireless', 'earbuds'],
    images: [{ url: 'https://placeholder.com/earbuds.jpg', alt: 'Wireless Earbuds', isPrimary: true }]
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
  
  // First pass: Create parent categories
  for (const catData of categories.filter(c => !c.parentName)) {
    const category = await Category.create({
      name: catData.name,
      description: catData.description,
      isActive: catData.isActive,
      displayOrder: catData.displayOrder
    });
    categoryMap.set(catData.name, category);
    console.log(`   Created category: ${category.name}`);
  }
  
  // Second pass: Create child categories
  for (const catData of categories.filter(c => c.parentName)) {
    const parent = categoryMap.get(catData.parentName);
    const category = await Category.create({
      name: catData.name,
      description: catData.description,
      isActive: catData.isActive,
      displayOrder: catData.displayOrder,
      parent: parent._id
    });
    categoryMap.set(catData.name, category);
    console.log(`   Created subcategory: ${category.name} (under ${catData.parentName})`);
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
  
  const orderItems = products.slice(0, 2).map(p => ({
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
      street: '123 Default Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    pricing: {
      subtotal,
      tax,
      taxRate: 0.08,
      shipping: 9.99,
      discount: 0,
      total: subtotal + tax + 9.99
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
    console.log('   Email: admin@retailportal.com');
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
