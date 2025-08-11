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

// Add or update item in cart
export const updateCartItem = async (product, quantity) => {
  const sessionId = getSessionId()
  const cartRef = doc(db, CARTS_COLLECTION, sessionId)
  const cartSnap = await getDoc(cartRef)
  
  if (!cartSnap.exists()) {
    // Create cart if it doesn't exist
    await setDoc(cartRef, {
      items: [{ ...product, quantity }],
      updatedAt: new Date(),
      sessionId
    })
    return
  }
  
  const cartData = cartSnap.data()
  const existingItemIndex = cartData.items.findIndex(item => item.id === product.id)
  
  if (existingItemIndex >= 0) {
    // Update existing item
    const updatedItems = [...cartData.items]
    updatedItems[existingItemIndex] = { ...updatedItems[existingItemIndex], quantity }
    
    await updateDoc(cartRef, {
      items: updatedItems,
      updatedAt: new Date()
    })
  } else {
    // Add new item
    await updateDoc(cartRef, {
      items: [...cartData.items, { ...product, quantity }],
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
    const updatedItems = cartData.items.filter(item => item.id !== productId)
    
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
  await updateDoc(cartRef, {
    items: [],
    updatedAt: new Date()
  })
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
