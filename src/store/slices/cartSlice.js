import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import { firestore } from '../../firebase'

// Async thunks for Firestore cart operations
export const fetchCartItems = createAsyncThunk(
  'cart/fetchCartItems',
  async (userId = 'guest', { rejectWithValue }) => {
    try {
      const q = query(collection(firestore, 'cart'), where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      const cartItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      return cartItems
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const addToCartFirestore = createAsyncThunk(
  'cart/addToCartFirestore',
  async ({ product, userId = 'guest' }, { rejectWithValue }) => {
    try {
      const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        userId,
        addedAt: new Date()
      }
      const docRef = await addDoc(collection(firestore, 'cart'), cartItem)
      return { id: docRef.id, ...cartItem }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateCartItemFirestore = createAsyncThunk(
  'cart/updateCartItemFirestore',
  async ({ id, quantity }, { rejectWithValue }) => {
    try {
      await updateDoc(doc(firestore, 'cart', id), {
        quantity,
        updatedAt: new Date()
      })
      return { id, quantity }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const removeFromCartFirestore = createAsyncThunk(
  'cart/removeFromCartFirestore',
  async (cartItemId, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(firestore, 'cart', cartItemId))
      return cartItemId
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
      const { product } = action.payload
      const existingItem = state.items.find(item => item.productId === product.id)
      
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.items.push({
          id: `temp-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        })
      }
    },
    updateCartItemLocal: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.items.find(item => item.id === id)
      if (item) {
        item.quantity = quantity
      }
    },
    removeFromCartLocal: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload)
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
  removeFromCartLocal 
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
