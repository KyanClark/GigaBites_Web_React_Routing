import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { firestore } from '../../firebase'

// Async thunks for Firebase operations
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'products'))
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      return products
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(firestore, 'products'), {
        ...productData,
        createdAt: new Date()
      })
      return { id: docRef.id, ...productData }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      await updateDoc(doc(firestore, 'products', id), {
        ...productData,
        updatedAt: new Date()
      })
      return { id, ...productData }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(firestore, 'products', productId))
      return productId
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    searchTerm: '',
    sortBy: 'name'
  },
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add product
      .addCase(addProduct.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.error = action.payload
      })
      // Update product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.error = action.payload
      })
      // Delete product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload)
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const { setSearchTerm, setSortBy, clearError } = productsSlice.actions

// Selectors
export const selectProducts = (state) => state.products.items
export const selectProductsLoading = (state) => state.products.loading
export const selectProductsError = (state) => state.products.error
export const selectSearchTerm = (state) => state.products.searchTerm
export const selectSortBy = (state) => state.products.sortBy

export const selectFilteredAndSortedProducts = (state) => {
  const { items, searchTerm, sortBy } = state.products
  
  return items
    .filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0)
        case 'price-high':
          return (b.price || 0) - (a.price || 0)
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '')
      }
    })
}

export default productsSlice.reducer
