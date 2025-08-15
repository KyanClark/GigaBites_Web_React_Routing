import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import { firestore } from '../../firebase'

// Async thunks for Firestore cart operations - Updated to use session-based approach
export const fetchCartItems = createAsyncThunk(
  'cart/fetchCartItems',
  async (_, { rejectWithValue }) => {
    try {
      // Use the carts collection with session-based approach
      const sessionId = sessionStorage.getItem('cartSessionId') || 'guest'
      const q = query(collection(firestore, 'carts'), where('sessionId', '==', sessionId))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const cartDoc = querySnapshot.docs[0]
        return cartDoc.data().items || []
      }
      return []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const addToCartFirestore = createAsyncThunk(
  'cart/addToCartFirestore',
  async ({ product, quantity = 1 }, { rejectWithValue }) => {
    try {
      // This will be handled by the cartService, so we just return success
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateCartItemFirestore = createAsyncThunk(
  'cart/updateCartItemFirestore',
  async ({ id, quantity }, { rejectWithValue }) => {
    try {
      // This will be handled by the cartService, so we just return success
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const removeFromCartFirestore = createAsyncThunk(
  'cart/removeFromCartFirestore',
  async (cartItemId, { rejectWithValue }) => {
    try {
      // This will be handled by the cartService, so we just return success
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    loading: false,
    error: null,
    isOpen: false
  },
  reducers: {
    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },
    closeCart: (state) => {
      state.isOpen = false
    },
    clearError: (state) => {
      state.error = null
    },
    // Local cart operations (for immediate UI feedback)
    addToCartLocal: (state, action) => {
      const { product, quantity = 1 } = action.payload
      console.log('Adding to cart local:', { product, quantity, currentItems: state.items })
      
      // Check for existing item by both productId and id
      const existingItem = state.items.find(item => 
        item.productId === product.id || item.id === product.id
      )
      
      if (existingItem) {
        console.log('Updating existing item:', existingItem)
        existingItem.quantity += quantity
      } else {
        console.log('Adding new item to cart')
        const newItem = {
          id: product.id, // Use product.id as the item id
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: quantity
        }
        state.items.push(newItem)
        console.log('New cart items:', state.items)
      }
    },
    updateCartItemLocal: (state, action) => {
      const { id, quantity } = action.payload
      console.log('Updating cart item local:', { id, quantity, currentItems: state.items })
      
      // Find item by either id or productId
      const item = state.items.find(item => item.id === id || item.productId === id)
      if (item) {
        console.log('Found item to update:', item)
        item.quantity = quantity
      } else {
        console.log('Item not found for update:', id)
      }
    },
    removeFromCartLocal: (state, action) => {
      const productId = action.payload
      console.log('Removing from cart local:', { productId, currentItems: state.items })
      
      // Remove by either productId or id
      state.items = state.items.filter(item => item.productId !== productId && item.id !== productId)
      console.log('Items after removal:', state.items)
    },
    initializeCart: (state, action) => {
      state.items = action.payload || []
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart items
      .addCase(fetchCartItems.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add to cart
      .addCase(addToCartFirestore.fulfilled, (state, action) => {
        // Replace temp item with real Firestore item
        const tempIndex = state.items.findIndex(item => 
          item.productId === action.payload.productId && item.id.startsWith('temp-')
        )
        if (tempIndex !== -1) {
          state.items[tempIndex] = action.payload
        } else {
          state.items.push(action.payload)
        }
      })
      .addCase(addToCartFirestore.rejected, (state, action) => {
        state.error = action.payload
      })
      // Update cart item
      .addCase(updateCartItemFirestore.fulfilled, (state, action) => {
        const item = state.items.find(item => item.id === action.payload.id)
        if (item) {
          item.quantity = action.payload.quantity
        }
      })
      .addCase(updateCartItemFirestore.rejected, (state, action) => {
        state.error = action.payload
      })
      // Remove from cart
      .addCase(removeFromCartFirestore.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload)
      })
      .addCase(removeFromCartFirestore.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const { 
  toggleCart, 
  closeCart, 
  clearError, 
  addToCartLocal, 
  updateCartItemLocal, 
  removeFromCartLocal,
  initializeCart
} = cartSlice.actions

// Selectors
export const selectCartItems = (state) => state.cart.items
export const selectCartLoading = (state) => state.cart.loading
export const selectCartError = (state) => state.cart.error
export const selectCartIsOpen = (state) => state.cart.isOpen
export const selectCartItemCount = (state) => 
  state.cart.items.reduce((total, item) => total + (item.quantity || 1), 0)
export const selectCartTotal = (state) => 
  state.cart.items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0)

export default cartSlice.reducer
