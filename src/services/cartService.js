import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const CARTS_COLLECTION = 'carts'

// Generate or get session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('cartSessionId')
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('cartSessionId', sessionId)
  }
  return sessionId
}

// Get a persistent user identifier (stored in localStorage)
const getUserId = () => {
  let userId = localStorage.getItem('cartUserId')
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('cartUserId', userId)
  }
  return userId
}

// Get or create a cart for the current session
const getOrCreateCart = async () => {
  const sessionId = getSessionId()
  const cartRef = doc(db, CARTS_COLLECTION, sessionId)
  const cartSnap = await getDoc(cartRef)
  
  if (!cartSnap.exists()) {
    await setDoc(cartRef, {
      items: [],
      updatedAt: new Date(),
      sessionId
    })
    return { id: sessionId, items: [] }
  }
  
  return { id: sessionId, ...cartSnap.data() }
}

// Recover and merge all existing carts for the user
export const recoverUserCarts = async () => {
  try {
    const userId = getUserId()
    console.log('🔍 Recovering carts for user:', userId)
    
    // Get all carts from Firestore
    const cartsCollection = collection(db, CARTS_COLLECTION)
    const { getDocs, query, where, orderBy } = await import('firebase/firestore')
    
    // Get all carts (we'll filter by userId later if needed)
    const querySnapshot = await getDocs(cartsCollection)
    
    if (querySnapshot.empty) {
      console.log('🔍 No carts found in Firestore')
      return []
    }
    
    console.log(`🔍 Found ${querySnapshot.size} cart documents`)
    
    // Collect all cart items from all carts
    const allItems = []
    const cartSessions = []
    
    querySnapshot.forEach((doc) => {
      const cartData = doc.data()
      console.log(`🔍 Cart ${doc.id}:`, { 
        sessionId: cartData.sessionId, 
        itemsCount: cartData.items?.length || 0,
        updatedAt: cartData.updatedAt
      })
      
      if (cartData.items && cartData.items.length > 0) {
        // Add items to the collection
        cartData.items.forEach(item => {
          // Check if item already exists (by productId)
          const existingItemIndex = allItems.findIndex(existing => 
            existing.productId === item.productId || existing.id === item.productId
          )
          
          if (existingItemIndex >= 0) {
            // Merge quantities if item already exists
            allItems[existingItemIndex].quantity += item.quantity
            console.log(`🔍 Merged item ${item.name}: total quantity ${allItems[existingItemIndex].quantity}`)
          } else {
            // Add new item
            allItems.push({
              ...item,
              // Ensure both id and productId are set
              id: item.id || item.productId,
              productId: item.productId || item.id
            })
          }
        })
        
        cartSessions.push({
          id: doc.id,
          sessionId: cartData.sessionId,
          updatedAt: cartData.updatedAt
        })
      }
    })
    
    console.log(`🔍 Recovered ${allItems.length} unique items from ${cartSessions.length} cart sessions`)
    console.log('🔍 Items:', allItems.map(item => ({ name: item.name, quantity: item.quantity })))
    
    return allItems
    
  } catch (error) {
    console.error('❌ Error recovering user carts:', error)
    return []
  }
}

// Add or update item in cart
export const updateCartItem = async (product, quantity) => {
  const sessionId = getSessionId()
  const cartRef = doc(db, CARTS_COLLECTION, sessionId)
  const cartSnap = await getDoc(cartRef)
  
  if (!cartSnap.exists()) {
    // Create cart if it doesn't exist
    await setDoc(cartRef, {
      items: [{ 
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity 
      }],
      updatedAt: new Date(),
      sessionId
    })
    return
  }
  
  const cartData = cartSnap.data()
  // Look for existing item by productId to match Redux store structure
  const existingItemIndex = cartData.items.findIndex(item => item.productId === product.id || item.id === product.id)
  
  if (existingItemIndex >= 0) {
    // Update existing item
    const updatedItems = [...cartData.items]
    updatedItems[existingItemIndex] = { 
      ...updatedItems[existingItemIndex], 
      quantity,
      productId: product.id, // Ensure productId is set
      id: product.id // Ensure id is set
    }
    
    await updateDoc(cartRef, {
      items: updatedItems,
      updatedAt: new Date()
    })
  } else {
    // Add new item
    await updateDoc(cartRef, {
      items: [...cartData.items, { 
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity 
      }],
      updatedAt: new Date()
    })
  }
}

// Remove item from cart
export const removeCartItem = async (productId) => {
  const sessionId = getSessionId()
  const cartRef = doc(db, CARTS_COLLECTION, sessionId)
  const cartSnap = await getDoc(cartRef)
  
  if (cartSnap.exists()) {
    const cartData = cartSnap.data()
    // Remove by either productId or id for compatibility
    const updatedItems = cartData.items.filter(item => item.productId !== productId && item.id !== productId)
    
    await updateDoc(cartRef, {
      items: updatedItems,
      updatedAt: new Date()
    })
  }
}

// Clear cart
export const clearCart = async () => {
  const sessionId = getSessionId()
  const cartRef = doc(db, CARTS_COLLECTION, sessionId)
  await setDoc(cartRef, {
    items: [],
    updatedAt: new Date(),
    sessionId
  })
}

// Clear current session cart and add new items
export const replaceCartItems = async (newItems) => {
  const sessionId = getSessionId()
  const cartRef = doc(db, CARTS_COLLECTION, sessionId)
  
  // Clear current cart and add new items
  await setDoc(cartRef, {
    items: newItems,
    updatedAt: new Date(),
    sessionId
  })
  
  console.log('🔍 Cart replaced with new items:', newItems)
}

// Load cart from Firestore
export const loadCartFromFirestore = async () => {
  try {
    const cart = await getOrCreateCart()
    return cart.items || []
  } catch (error) {
    console.error('Error loading cart from Firestore:', error)
    return []
  }
}

// Load cart for current session
export const loadCart = async () => {
  const cart = await getOrCreateCart()
  return cart.items || []
}

// Subscribe to cart changes
export const subscribeToCart = (callback) => {
  const sessionId = getSessionId()
  const cartRef = doc(db, CARTS_COLLECTION, sessionId)
  
  return onSnapshot(cartRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().items || [])
    } else {
      callback([])
    }
  })
}
