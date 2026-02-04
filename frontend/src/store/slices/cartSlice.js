import { createSlice } from '@reduxjs/toolkit';

// Get cart from localStorage
const cartItems = JSON.parse(localStorage.getItem('cart')) || [];

const initialState = {
  items: cartItems,
  totalQuantity: cartItems.reduce((total, item) => total + item.quantity, 0),
  totalAmount: cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
};

const saveCartToStorage = (items) => {
  localStorage.setItem('cart', JSON.stringify(items));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, addOns = [] } = action.payload;
      const cartItemId = `${product._id}-${JSON.stringify(addOns.map(a => a._id).sort())}`;
      
      const existingItem = state.items.find(item => item.cartItemId === cartItemId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        const addOnTotal = addOns.reduce((sum, addon) => sum + addon.price, 0);
        state.items.push({
          cartItemId,
          productId: product._id,
          name: product.name,
          price: product.price + addOnTotal,
          basePrice: product.price,
          image: product.images?.[0] || '',
          quantity,
          addOns,
        });
      }
      
      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      saveCartToStorage(state.items);
    },
    
    removeFromCart: (state, action) => {
      const cartItemId = action.payload;
      state.items = state.items.filter(item => item.cartItemId !== cartItemId);
      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      saveCartToStorage(state.items);
    },
    
    updateQuantity: (state, action) => {
      const { cartItemId, quantity } = action.payload;
      const item = state.items.find(item => item.cartItemId === cartItemId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.cartItemId !== cartItemId);
        } else {
          item.quantity = quantity;
        }
      }
      
      state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      saveCartToStorage(state.items);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      localStorage.removeItem('cart');
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
