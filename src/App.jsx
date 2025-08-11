import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import ProductGrid from './components/ProductGrid'
import ProductModal from './components/ProductModal'
import ProductForm from './components/ProductForm'
import CartPage from './components/CartPage'
import CheckoutConfirmation from './components/CheckoutConfirmation'
import Notification from './components/Notification'
import ErrorBoundary from './components/ErrorBoundary'

import { db } from './firebase'
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  onSnapshot,
  addDoc,
  increment as firestoreIncrement
} from 'firebase/firestore'
// Auth removed as per user request
import { 
  fetchProducts, 
  subscribeToProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  updateMultipleProductStocks 
} from './services/productService'
import { 
  updateCartItem, 
  removeCartItem, 
  clearCart,
  subscribeToCart,
  loadCart as loadCartFromFirestore
} from './services/cartService'
import './App.css'

function AppContent() {
  const navigate = useNavigate()
  // Local state
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [initializationError, setInitializationError] = useState(null)
  
  // Load cart on mount
  useEffect(() => {
    // Load initial cart
    const loadInitialCart = async () => {
      try {
        const items = await loadCartFromFirestore()
        setCartItems(items || [])
      } catch (error) {
        console.error('Error loading cart:', error)
        showNotification('Failed to load cart', 'error')
      }
    }
    
    // Subscribe to cart changes
    const unsubscribe = subscribeToCart((items) => {
      setCartItems(items || [])
    })
    
    // Load initial cart
    loadInitialCart()
    
    return () => unsubscribe()
  }, [])

  const [sortBy, setSortBy] = useState('name')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: 'success', isVisible: false })
  const [checkoutData, setCheckoutData] = useState(null)
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false)

  // Apply dark mode
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : ''
  }, [isDarkMode])

  // Load products from Firebase on component mount
  useEffect(() => {
    try {
      const unsubscribe = subscribeToProducts((fetchedProducts) => {
        try {
          setProducts(fetchedProducts || [])
          setFilteredProducts(fetchedProducts || [])
          setLoading(false)
        } catch (error) {
          console.error('Error in products subscription callback:', error)
          setInitializationError('Failed to load products. Please refresh the page.')
          setLoading(false)
        }
      }, (error) => {
        console.error('Error subscribing to products:', error)
        setInitializationError('Failed to load products. Please check your connection and refresh.')
        setLoading(false)
      })

      return () => {
        try {
          unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from products:', error)
        }
      }
    } catch (error) {
      console.error('Error initializing products subscription:', error)
      setInitializationError('Failed to initialize the application. Please try again later.')
      setLoading(false)
    }
  }, [])

  // Filter and sort products
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })

    filtered = filtered.sort((a, b) => {
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

    setFilteredProducts(filtered)
  }, [products, searchQuery, sortBy])

  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0)

  // Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, isVisible: true })
  }

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }))
  }

  // Handlers
  const handleAddToCart = async (product, quantity = 1) => {
    if (!product) {
      console.error('Invalid product data:', product)
      showNotification('Error: Invalid product data', 'error')
      return
    }

    try {
      // First try to get the product by ID
      let productRef = doc(db, 'products', product.id || '')
      let productSnap = await getDoc(productRef)
      let currentProduct = productSnap.exists() 
        ? { id: productSnap.id, ...productSnap.data() }
        : null
      
      // If product not found by ID, try to find by name
      if (!currentProduct) {
        const productsQuery = query(
          collection(db, 'products'),
          where('name', '==', product.name)
        )
        const querySnapshot = await getDocs(productsQuery)
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          currentProduct = { id: doc.id, ...doc.data() }
          productRef = doc.ref
        }
      }
      
      if (!currentProduct) {
        console.error('Product not found in database:', product)
        showNotification('Product not found in database', 'error')
        return
      }
      
      const existingCartItem = cartItems.find(item => item.id === currentProduct.id)
      const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0
      const totalRequestedQuantity = currentCartQuantity + quantity
      
      // Validate stock
      if (currentProduct.stock < quantity) {
        showNotification(`Insufficient stock! Only ${currentProduct.stock} available.`, 'error')
        return
      }
      
      if (currentProduct.stock < totalRequestedQuantity) {
        const available = currentProduct.stock - currentCartQuantity
        showNotification(`Cannot add ${quantity} more. Only ${available} available.`, 'error')
        return
      }

      // Update product stock in Firestore
      const newStock = currentProduct.stock - quantity
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date()
      })
      
      // Update cart in Firestore
      await updateCartItem({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image,
        stock: newStock
      }, totalRequestedQuantity)
      
      showNotification(`${product.name} added to cart! (${newStock} remaining)`, 'success')
      
    } catch (error) {
      console.error('Error in handleAddToCart:', error)
      showNotification('Failed to add item to cart. Please try again.', 'error')
    }
  }

  const handleAddProduct = async (productData) => {
    try {
      setLoading(true)
      console.log('Adding product:', productData)
      const newProduct = await addProduct({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setIsProductFormOpen(false)
      showNotification('Product added successfully!')
      return newProduct
    } catch (error) {
      console.error('Error adding product:', error)
      showNotification(`Failed to add product: ${error.message}`, 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProduct = async (id, productData) => {
    try {
      setLoading(true)
      console.log('Updating product:', { id, ...productData })
      await updateProduct(id, {
        ...productData,
        updatedAt: new Date()
      })
      setIsProductFormOpen(false)
      setEditingProduct(null)
      showNotification('Product updated successfully!')
    } catch (error) {
      console.error('Error updating product:', error)
      showNotification(`Failed to update product: ${error.message}`, 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id)
      showNotification('Product deleted successfully!')
    } catch (error) {
      console.error('Error deleting product:', error)
      showNotification('Failed to delete product', 'error')
    }
  }



  // Checkout functionality
  const handleCheckout = async () => {
    
    if (cartItems.length === 0) {
      showNotification('Your cart is empty!', 'error')
      return
    }

    try {
      setLoading(true)
      
      // Validate stock availability before checkout
      for (const item of cartItems) {
        const currentProduct = products.find(p => p.id === item.id)
        if (!currentProduct || currentProduct.stock < item.quantity) {
          showNotification(`Insufficient stock for ${item.name}. Available: ${currentProduct?.stock || 0}`, 'error')
          setLoading(false)
          return
        }
      }
      
      // Calculate totals
      const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
      const tax = subtotal * 0.1 // 10% tax
      const shipping = subtotal > 0 ? 10 : 0 // $10 flat rate shipping
      const total = subtotal + tax + shipping
      
      // Create order in Firestore
      const ordersRef = collection(db, 'orders')
      const orderData = {
        userId: currentUser.uid,
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        subtotal,
        tax,
        shipping,
        total,
        status: 'completed',
        createdAt: new Date()
      }
      
      await addDoc(ordersRef, orderData)
      
      // Clear cart
      await clearCart()
      
      // Show success message
      setCheckoutData({
        orderNumber: `#${Math.floor(Math.random() * 1000000)}`,
        items: [...cartItems],
        total: orderData.total,
        customerInfo: {
          email: currentUser.email || 'customer@example.com',
          orderDate: new Date().toLocaleDateString(),
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        }
      })
      
      setShowCheckoutConfirmation(true)
      showNotification('Order placed successfully!', 'success')
      
    } catch (error) {
      console.error('Error during checkout:', error)
      showNotification('Error during checkout. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Cart management
  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(id)
      return
    }
    
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ))
  }

  const handleRemoveFromCart = async (id) => {
    try {
      const removedItem = cartItems.find(item => item.id === id)
      if (!removedItem) return
      
      // Update local state immediately for better UX
      setCartItems(prev => prev.filter(item => item.id !== id))
      
      // Update Firestore
      await removeCartItem(id)
      
      // Restore stock if needed
      const productRef = doc(db, 'products', id)
      const productSnap = await getDoc(productRef)
      if (productSnap.exists()) {
        await updateDoc(productRef, {
          stock: firestoreIncrement(removedItem.quantity || 1),
          updatedAt: new Date()
        })
      }
      
      showNotification(`${removedItem.name} removed from cart`)
    } catch (error) {
      console.error('Error removing item from cart:', error)
      showNotification('Failed to remove item from cart', 'error')
    }
  }

  // UI handlers
  const handleProductClick = (product) => {
    setSelectedProduct(product)
  }

  const handleCloseModal = () => {
    setSelectedProduct(null)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setIsProductFormOpen(true)
  }

  const handleCloseProductForm = () => {
    setIsProductFormOpen(false)
    setEditingProduct(null)
  }

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }



  const handleSortChange = (sort) => {
    setSortBy(sort)
  }

  const handleAddProductClick = () => {
    setEditingProduct(null)
    setIsProductFormOpen(true)
  }

  const handleHomeClick = () => {
    navigate('/')
  }

  const handleCloseCheckoutConfirmation = () => {
    setShowCheckoutConfirmation(false)
    setCheckoutData(null)
    // Navigation will be handled by the CheckoutConfirmation component
  }

  // Render error state if initialization failed
  if (initializationError) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Something went wrong</h2>
          <p>{initializationError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <Header 
        cartItemCount={cartCount}
        onCartClick={() => navigate('/cart')}
        onHomeClick={handleHomeClick}
        searchTerm={searchQuery}
        onSearchChange={handleSearch}
        darkMode={isDarkMode}
        onDarkModeToggle={handleToggleDarkMode}
      />
      
      <main className="main-content">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={
              <>
                <Hero 
                  onAddProductClick={handleAddProductClick}
                  hasProducts={products.length > 0}
                />
                <ProductGrid 
                  products={filteredProducts}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  onProductClick={handleProductClick}
                  onAddToCart={handleAddToCart}
                  onEditProduct={handleEditProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAddProductClick={handleAddProductClick}
                  hasProducts={products.length > 0}
                  loading={loading}
                />
              </>
            } />
            <Route path="/cart" element={
              <CartPage 
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveFromCart}
                onCheckout={handleCheckout}
              />
            } />
          </Routes>
        </ErrorBoundary>
      </main>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}

      {isProductFormOpen && (
        <ProductForm 
          product={editingProduct}
          onSubmit={editingProduct ? 
            (data) => handleUpdateProduct(editingProduct.id, data) : 
            handleAddProduct
          }
          onClose={handleCloseProductForm}
        />
      )}

      {showCheckoutConfirmation && checkoutData && (
        <CheckoutConfirmation 
          orderData={checkoutData}
          onClose={handleCloseCheckoutConfirmation}
        />
      )}

      <Notification 
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  )
}

export default App
