import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Header from './components/Header'
import Hero from './components/Hero'
import ProductGrid from './components/ProductGrid'
import ProductModal from './components/ProductModal'
import ProductForm from './components/ProductForm'
import CartPage from './components/CartPage'
import CheckoutConfirmation from './components/CheckoutConfirmation'
import Notification from './components/Notification'
import ErrorBoundary from './components/ErrorBoundary'
import ConfirmationDialog from './components/ConfirmationDialog'

import { db } from './firebase.js'
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, increment } from 'firebase/firestore'
import { addProduct, updateProduct, deleteProduct, subscribeToProducts } from './services/productService.js'
import { updateCartItem, removeCartItem, clearCart, loadCartFromFirestore } from './services/cartService.js'
import { generateSampleProducts, checkExistingProducts } from './generateSampleProducts.js'
// Auth removed as per user request
import { 
  addToCartLocal,
  updateCartItemLocal, 
  removeFromCartLocal,
  initializeCart,
  selectCartItems,
  selectCartItemCount,
  selectCartTotal
} from './store/slices/cartSlice'
import './App.css'

function AppContent() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  // Redux selectors
  const cartItems = useSelector(selectCartItems)
  const cartItemCount = useSelector(selectCartItemCount)
  const cartTotal = useSelector(selectCartTotal)
  
  // Local state
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false)
  const [checkoutData, setCheckoutData] = useState(null)
  const [notification, setNotification] = useState({
    message: '',
    type: 'info',
    isVisible: false
  })
  
  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    itemToRemove: null,
    message: ''
  })
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [initializationError, setInitializationError] = useState(null)
  
  // One-time initialization to ensure products are loaded from Firestore
  useEffect(() => {
    const initializeProducts = async () => {
      try {
        console.log('Initializing products from Firestore...');
        const productsCollection = collection(db, 'products');
        const q = query(productsCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.log('No products found in Firestore');
          setProducts([]);
          setFilteredProducts([]);
          return;
        }
        
        const initialProducts = [];
        querySnapshot.forEach((doc) => {
          initialProducts.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('Initialized products from Firestore:', initialProducts.map(p => ({ id: p.id, name: p.name })));
        setProducts(initialProducts);
        setFilteredProducts(initialProducts);
        setLoading(false);
        
      } catch (error) {
        console.error('Error initializing products:', error);
        setInitializationError('Failed to load products from database');
        setLoading(false);
      }
    };
    
    initializeProducts();
  }, []);
  
  // Monitor cart state changes for debugging
  useEffect(() => {
    console.log('Cart state changed:', {
      items: cartItems,
      count: cartItems.length,
      total: cartTotal
    });
  }, [cartItems, cartTotal]);
  
  // Load cart on mount
  useEffect(() => {
    // Load initial cart with recovery
    const loadInitialCart = async () => {
      try {
        console.log('🔍 Loading initial cart with recovery...')
        
        // First try to load from current session
        let items = await loadCartFromFirestore()
        console.log('🔍 Current session cart items:', items)
        
        // If no items in current session, try to recover from all existing carts
        if (!items || items.length === 0) {
          console.log('🔍 No items in current session, attempting cart recovery...')
          const { recoverUserCarts } = await import('./services/cartService')
          items = await recoverUserCarts()
          console.log('🔍 Recovered items from all carts:', items)
          
          // If we recovered items, save them to current session
          if (items && items.length > 0) {
            console.log('🔍 Saving recovered items to current session...')
            // Import and use the cart service to replace items
            const { replaceCartItems } = await import('./services/cartService')
            
            // Replace current session cart with recovered items
            await replaceCartItems(items)
          }
        }
        
        console.log('🔍 Final cart items to initialize:', items)
        console.log('🔍 Cart items structure:', items?.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity
        })))
        
        // Initialize Redux cart state with loaded items
        if (items && items.length > 0) {
          console.log('🔍 Cart items found, initializing with:', items)
          dispatch(initializeCart(items))
        } else {
          console.log('🔍 No cart items found, initializing empty cart')
          dispatch(initializeCart([]))
        }
      } catch (error) {
        console.error('❌ Error loading cart:', error)
        showNotification('Failed to load cart', 'error')
        dispatch(initializeCart([]))
      }
    }
    
    loadInitialCart()
    
    // Subscribe to cart changes
    const sessionId = sessionStorage.getItem('cartSessionId') || 'guest'
    console.log('🔍 Cart session ID:', sessionId)
    const cartRef = doc(db, 'carts', sessionId)
    
    const unsubscribe = onSnapshot(cartRef, (doc) => {
      if (doc.exists()) {
        const cartData = doc.data()
        console.log('Cart subscription update:', cartData.items)
        // Enable real-time cart updates
        dispatch(initializeCart(cartData.items || []))
      } else {
        console.log('Cart document does not exist, clearing cart')
        dispatch(initializeCart([]))
      }
    }, (error) => {
      console.error('Cart subscription error:', error)
    })
    
    return () => unsubscribe()
  }, [dispatch])

  const [sortBy, setSortBy] = useState('name')

  // Apply dark mode
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : ''
  }, [isDarkMode])

  // Load products from Firebase on component mount
  useEffect(() => {
    // This is now handled by the one-time initialization above
    // The subscription will handle real-time updates
    try {
      const unsubscribe = subscribeToProducts((fetchedProducts) => {
        try {
          // Only update if we have new products and they're different from current ones
          if (fetchedProducts && fetchedProducts.length > 0) {
            const currentIds = products.map(p => p.id).sort();
            const newIds = fetchedProducts.map(p => p.id).sort();
            
            if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
              console.log('Products updated via subscription');
              setProducts(fetchedProducts || []);
              setFilteredProducts(fetchedProducts || []);
            }
          }
        } catch (error) {
          console.error('Error in products subscription callback:', error);
        }
      }, (error) => {
        console.error('Error subscribing to products:', error);
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
    }
  }, []) // Remove products dependency to prevent infinite loops

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

  // Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, isVisible: true })
  }

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }))
  }

  // Search handler
  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  // Test cart functionality
  const testCart = () => {
    console.log('Testing cart functionality...');
    const testProduct = {
      id: 'test-product',
      name: 'Test Product',
      price: 99.99,
      image: 'test-image.jpg'
    };
    
    console.log('Current cart items:', cartItems);
    console.log('Dispatching test add to cart...');
    
    dispatch(addToCartLocal({
      product: testProduct,
      quantity: 1
    }));
    
    console.log('Test dispatch completed');
  };

  // Cart recovery function for debugging
  const recoverCarts = async () => {
    try {
      console.log('🔍 Manually triggering cart recovery...');
      const { recoverUserCarts } = await import('./services/cartService');
      const recoveredItems = await recoverUserCarts();
      
      if (recoveredItems && recoveredItems.length > 0) {
        console.log('🔍 Successfully recovered items:', recoveredItems);
        dispatch(initializeCart(recoveredItems));
        showNotification(`Recovered ${recoveredItems.length} cart items`, 'success');
      } else {
        console.log('🔍 No items recovered');
        showNotification('No cart items found to recover', 'info');
      }
    } catch (error) {
      console.error('❌ Error during cart recovery:', error);
      showNotification('Failed to recover cart items', 'error');
    }
  };

  // Generate sample products handler
  const handleGenerateSamples = async () => {
    try {
      setLoading(true);
      console.log('Starting sample products generation...');
      
      // Check if products already exist
      const existingCheck = await checkExistingProducts();
      console.log('Existing products:', existingCheck);
      
      if (existingCheck.count > 0) {
        const confirmed = window.confirm(
          `You already have ${existingCheck.count} products in your database.\n\n` +
          'This will add 9 more sample products.\n\n' +
          'Continue?'
        );
        
        if (!confirmed) {
          return;
        }
      }
      
      // Generate sample products
      const result = await generateSampleProducts();
      
      if (result.success) {
        showNotification(result.message, 'success');
        
        // Refresh products to show the new ones
        await refreshProducts();
        
        console.log('Sample products generated successfully');
      } else {
        showNotification(`Failed to generate samples: ${result.message}`, 'error');
      }
      
    } catch (error) {
      console.error('Sample generation error:', error);
      showNotification(`Failed to generate samples: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Refresh products from Firestore to ensure local state is in sync
  const refreshProducts = async () => {
    try {
      console.log('Refreshing products from Firestore...');
      const productsCollection = collection(db, 'products');
      const q = query(productsCollection, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const freshProducts = [];
      querySnapshot.forEach((doc) => {
        freshProducts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Refreshed products from Firestore:', freshProducts);
      console.log('Previous local products:', products);
      
      // Check if we're actually getting different data
      if (freshProducts.length === 0) {
        console.warn('No products found in Firestore - this might indicate a database issue');
        return [];
      }
      
      // Update both products and filtered products
      setProducts(freshProducts);
      setFilteredProducts(freshProducts);
      
      // Also refresh the cart to ensure it only contains valid products
      const currentCartItems = cartItems.filter(item => {
        const productExists = freshProducts.some(p => p.id === item.productId);
        if (!productExists) {
          console.log('Removing cart item for non-existent product:', item);
        }
        return productExists;
      });
      
      if (currentCartItems.length !== cartItems.length) {
        console.log('Updating cart to remove invalid products');
        dispatch(initializeCart(currentCartItems));
      }
      
      console.log('Products refreshed successfully. New product IDs:', freshProducts.map(p => p.id));
      return freshProducts;
    } catch (error) {
      console.error('Error refreshing products:', error);
      showNotification('Failed to refresh products', 'error');
      return [];
    }
  };

  // Handlers
  const handleAddToCart = async (product, quantity = 1) => {
    try {
      console.log('handleAddToCart called with:', { product, quantity });
      
      // Find the product in our local state
      const currentProduct = products.find(p => p.id === product.id);
      
      if (!currentProduct) {
        console.error('Product not found in local state:', product);
        showNotification('Product not found. Please refresh the page.', 'error');
        return;
      }
      
      console.log('Found product:', currentProduct);
      
      // Check if product exists in cart and calculate quantities
      const existingCartItem = cartItems.find(item => item.productId === currentProduct.id);
      const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
      const totalRequestedQuantity = currentCartQuantity + quantity;
      
      console.log('Cart state:', { existingCartItem, currentCartQuantity, totalRequestedQuantity });
      
      // Validate stock
      if (currentProduct.stock < quantity) {
        showNotification(`Insufficient stock! Only ${currentProduct.stock} available.`, 'error');
        return;
      }
      
      if (currentProduct.stock < totalRequestedQuantity) {
        const available = currentProduct.stock - currentCartQuantity;
        showNotification(`Cannot add ${quantity} more. Only ${available} available.`, 'error');
        return;
      }

      // Update product stock in Firestore
      const productRef = doc(db, 'products', currentProduct.id);
      const newStock = currentProduct.stock - quantity;
      
      try {
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date()
      });
        
        console.log('Stock updated successfully in Firestore');
      
      // Update local products state
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === currentProduct.id 
            ? { ...p, stock: newStock } 
            : p
        )
      );
        
      } catch (updateError) {
        console.error('Error updating stock in Firestore:', updateError);
        showNotification(`Failed to update stock: ${updateError.message}`, 'error');
        return;
      }
      
      // Update cart state
      if (existingCartItem) {
        console.log('Updating existing cart item:', { id: existingCartItem.id, quantity: totalRequestedQuantity });
        dispatch(updateCartItemLocal({ 
          id: existingCartItem.id, 
          quantity: totalRequestedQuantity 
        }));
      } else {
        console.log('Adding new cart item:', { product: currentProduct, quantity });
        const cartAction = addToCartLocal({ 
          product: {
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image,
            stock: newStock
          }, 
          quantity 
        });
        console.log('Dispatching cart action:', cartAction);
        dispatch(cartAction);
      }
      
      // Update cart in Firestore with proper structure
      const cartItemData = {
        id: currentProduct.id,
        productId: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image,
        stock: newStock
      };
      
      await updateCartItem(cartItemData, totalRequestedQuantity);
      
      console.log('Cart state after dispatch:', cartItems);
      console.log('Cart item count after dispatch:', cartItems.length);
      
      console.log('Cart updated successfully');
      showNotification(`${currentProduct.name} added to cart!`, 'success');
      
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
      showNotification(`Failed to add to cart: ${error.message}`, 'error');
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      setLoading(true);
      console.log('handleAddProduct called with:', productData);
      
      // Validate the product data
      if (!productData || 
          !productData.name || !productData.name.trim() || 
          !productData.description || !productData.description.trim() || 
          productData.price === undefined || productData.price === null || productData.price === '' || 
          productData.stock === undefined || productData.stock === null || productData.stock === '') {
        console.error('❌ Validation failed in handleAddProduct:', {
          hasProductData: !!productData,
          name: productData?.name,
          nameTrimmed: productData?.name?.trim(),
          description: productData?.description,
          descriptionTrimmed: productData?.description?.trim(),
          price: productData?.price,
          stock: productData?.stock
        });
        throw new Error('Missing required product information');
      }
      
      // Additional validation for numeric values
      if (isNaN(productData.price) || productData.price <= 0) {
        console.error('❌ Invalid price value:', productData.price);
        throw new Error('Price must be a valid positive number');
      }
      
      if (isNaN(productData.stock) || productData.stock < 0) {
        console.error('❌ Invalid stock value:', productData.stock);
        throw new Error('Stock must be a valid non-negative number');
      }
      
      // Add the product to Firestore
      await addProduct(productData);
      
      // Close the form
      setIsProductFormOpen(false);
      
      // Refresh products to get the new data
      await refreshProducts();
      
      showNotification('Product added successfully!', 'success');
    } catch (error) {
      console.error('Error adding product:', error);
      showNotification(`Failed to add product: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    try {
      setLoading(true);
      console.log('🔍 handleUpdateProduct called with:', { id, productData });
      console.log('🔍 Product data type:', typeof productData);
      console.log('🔍 Product data keys:', Object.keys(productData || {}));
      console.log('🔍 Product data details:', {
        hasProductData: !!productData,
        name: productData?.name,
        nameTrimmed: productData?.name?.trim(),
        description: productData?.description,
        descriptionTrimmed: productData?.description?.trim(),
        price: productData?.price,
        stock: productData?.stock
      });
      console.log('🔍 Raw values:', {
        name: productData?.name,
        description: productData?.description,
        price: productData?.price,
        stock: productData?.stock
      });
      
      // Validate the product data
      console.log('🔍 Starting validation...');
      console.log('🔍 productData exists:', !!productData);
      console.log('🔍 productData.name:', productData?.name, 'type:', typeof productData?.name);
      console.log('🔍 productData.description:', productData?.description, 'type:', typeof productData?.description);
      console.log('🔍 productData.price:', productData?.price, 'type:', typeof productData?.price);
      console.log('🔍 productData.stock:', productData?.stock, 'type:', typeof productData?.stock);
      
      // Simple validation - just check if the object has the required properties
      if (!productData || typeof productData !== 'object') {
        console.error('❌ productData is not a valid object:', productData);
        throw new Error('Product data is missing or invalid');
      }
      
      const requiredFields = ['name', 'description', 'price', 'stock'];
      const missingFields = requiredFields.filter(field => {
        const value = productData[field];
        const hasValue = value !== undefined && value !== null && value !== '';
        console.log(`🔍 Field ${field}:`, { value, hasValue, type: typeof value });
        return !hasValue;
      });
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Additional validation for numeric values
      if (isNaN(productData.price) || productData.price <= 0) {
        console.error('❌ Invalid price value:', productData.price);
        throw new Error('Price must be a valid positive number');
      }
      
      if (isNaN(productData.stock) || productData.stock < 0) {
        console.error('❌ Invalid stock value:', productData.stock);
        throw new Error('Stock must be a valid non-negative number');
      }
      
      // Ensure we have a valid product ID
      if (!id) {
        throw new Error('Product ID is required for updates');
      }
      
      // Update the product in Firestore
      const updatedProduct = await updateProduct(id, {
        ...productData,
        updatedAt: new Date()
      });
      
      console.log('Product updated successfully:', updatedProduct);
      
      // Close the form and reset state
      setIsProductFormOpen(false);
      setEditingProduct(null);
      
      // Refresh products to get the updated data
      await refreshProducts();
      
      showNotification('Product updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification(`Failed to update product: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
        const currentProduct = products.find(p => p.id === item.productId || p.id === item.id)
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
        userId: 'guest', // Use guest user since auth was removed
        items: cartItems.map(item => ({
          productId: item.productId || item.id,
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
      dispatch(initializeCart([]))
      
      // Show success message
      setCheckoutData({
        orderNumber: `#${Math.floor(Math.random() * 1000000)}`,
        items: [...cartItems],
        total: orderData.total,
        customerInfo: {
          email: 'customer@example.com', // Placeholder, as auth is removed
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
  const handleUpdateQuantity = async (id, newQuantity) => {
    if (newQuantity <= 0) {
      confirmRemoveFromCart(id);
      return;
    }
    
    try {
      // Find the cart item by either id or productId
      const cartItem = cartItems.find(item => item.id === id || item.productId === id);
      if (!cartItem) {
        showNotification('Cart item not found', 'error');
        return;
      }
      
      // Find the product to check stock
      const product = products.find(p => p.id === cartItem.productId || p.id === cartItem.id);
      if (!product) {
        showNotification('Product not found', 'error');
        return;
      }

      // Calculate stock difference
      const oldQuantity = cartItem.quantity;
      const quantityDifference = newQuantity - oldQuantity;
      
      // Check if we have enough stock
      if (product.stock < quantityDifference) {
        showNotification(`Insufficient stock! Only ${product.stock} available.`, 'error');
        return;
      }
      
      // Update stock in Firestore
      const productRef = doc(db, 'products', product.id);
      const newStock = product.stock - quantityDifference;
      
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date()
      });
      
      // Update local products state
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id 
            ? { ...p, stock: newStock } 
            : p
        )
      );
      
      // Update Redux cart state immediately
      dispatch(updateCartItemLocal({ id: cartItem.id, quantity: newQuantity }));
      
      // Update Firestore cart
      await updateCartItem(product, newQuantity);
      
      showNotification(`Quantity updated to ${newQuantity}`, 'success');
      
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Failed to update quantity', 'error');
    }
  }

  // Confirm remove from cart
  const confirmRemoveFromCart = (item) => {
    setConfirmationDialog({
      isOpen: true,
      itemToRemove: item,
      message: `Remove ${item.name} from cart?`
    });
  };

  // Handle remove from cart confirmation
  const handleRemoveFromCartConfirmed = async (confirmed) => {
    if (!confirmed || !confirmationDialog.itemToRemove) {
      setConfirmationDialog({
        isOpen: false,
        itemToRemove: null,
        message: ''
      });
      return;
    }

    const productId = confirmationDialog.itemToRemove.productId || confirmationDialog.itemToRemove.id;
    await handleRemoveFromCart(productId);
    
    setConfirmationDialog({
      isOpen: false,
      itemToRemove: null,
      message: ''
    });
  };

  // Remove item from cart
  const handleRemoveFromCart = async (productId) => {
    try {
      console.log('Removing product from cart:', productId);
      
      // Find the cart item to get the quantity
      const cartItem = cartItems.find(item => item.productId === productId || item.id === productId);
      if (!cartItem) {
        console.log('Cart item not found for product:', productId);
        return;
      }
      
      // Try to find the product in Firestore to restore stock
      const actualProductId = cartItem.productId || cartItem.id;
      const productRef = doc(db, 'products', actualProductId);
      const productDoc = await getDoc(productRef);
      
      if (productDoc.exists()) {
        // Product exists, restore stock
        const currentStock = productDoc.data().stock || 0;
        const quantityToRestore = cartItem.quantity || 1;
        const newStock = currentStock + quantityToRestore;
        
        console.log(`Restoring ${quantityToRestore} items to stock. New stock: ${newStock}`);
        
        await updateDoc(productRef, {
          stock: newStock
        });
        
        // Update local products state
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === actualProductId 
              ? { ...product, stock: newStock }
              : product
          )
        );
        
        console.log('Stock restored successfully');
      } else {
        console.log('Product does not exist in Firestore, skipping stock restoration');
        showNotification('Product no longer exists in database', 'warning');
      }
      
      // Remove from Redux cart state
      dispatch(removeFromCartLocal(cartItem.id));
      
      // Remove from Firestore cart
      await removeCartItem(actualProductId);
      
      showNotification('Item removed from cart', 'success');
      
    } catch (error) {
      console.error('Error removing item from cart:', error);
      
      // Even if stock update fails, still remove from cart
      const cartItem = cartItems.find(item => item.productId === productId || item.id === productId);
      if (cartItem) {
        dispatch(removeFromCartLocal(cartItem.id));
        try {
          await removeCartItem(productId);
        } catch (cartError) {
          console.error('Error removing from Firestore cart:', cartError);
        }
      }
      
      showNotification('Item removed from cart (stock update failed)', 'warning');
    }
  };

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
        cartItemCount={cartItems.length}
        onCartClick={() => navigate('/cart')}
        onHomeClick={handleHomeClick}
        onGenerateSamples={handleGenerateSamples}
        onTestCart={testCart}
        onRecoverCarts={recoverCarts}
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
                onRemoveItem={confirmRemoveFromCart}
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
            (id, data) => {
              console.log('🔍 ProductForm onSubmit called with:', { id, data });
              console.log('🔍 Data type:', typeof data);
              console.log('🔍 Data keys:', Object.keys(data || {}));
              return handleUpdateProduct(id, data);
            } : 
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

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title="Remove from Cart?"
        message={confirmationDialog.message}
        confirmText="Yes, remove it"
        cancelText="No, keep it"
        confirmColor="#ef4444"
        onConfirm={() => handleRemoveFromCartConfirmed(true)}
        onCancel={() => handleRemoveFromCartConfirmed(false)}
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
