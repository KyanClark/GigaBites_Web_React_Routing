import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  setDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  increment,
  where
} from 'firebase/firestore'
import { db } from '../firebase'

const PRODUCTS_COLLECTION = 'products'

// Fetch all products from Firestore
export const fetchProducts = async () => {
  try {
    const productsCollection = collection(db, PRODUCTS_COLLECTION)
    const q = query(productsCollection, orderBy('name'))
    const querySnapshot = await getDocs(q)
    
    const products = []
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

// Listen to real-time product updates
export const subscribeToProducts = (onSuccess, onError) => {
  try {
    const productsCollection = collection(db, PRODUCTS_COLLECTION)
    const q = query(productsCollection, orderBy('name'))
    
    const unsubscribe = onSnapshot(
      q, 
      (querySnapshot) => {
        try {
          const products = []
          querySnapshot.forEach((doc) => {
            try {
              products.push({
                id: doc.id,
                ...doc.data()
              })
            } catch (docError) {
              console.error('Error processing document:', docError)
              // Skip invalid documents
            }
          })
          onSuccess(products)
        } catch (processError) {
          console.error('Error processing snapshot:', processError)
          if (onError) {
            onError(processError)
          }
        }
      },
      (error) => {
        console.error('Error in products subscription:', error)
        if (onError) {
          onError(error)
        }
      }
    )
    
    return () => {
      try {
        unsubscribe()
      } catch (error) {
        console.error('Error unsubscribing from products:', error)
      }
    }
  } catch (error) {
    console.error('Error setting up products subscription:', error)
    if (onError) {
      onError(error)
    }
    // Return a no-op function if subscription fails
    return () => {}
  }
}

// Note: Image upload functionality has been moved to local storage
// Images are now stored as data URLs in the product data

// Add a new product to Firestore
export const addProduct = async (productData) => {
  try {
    console.log('addProduct called with:', productData);
    
    // Validate input data
    if (!productData || typeof productData !== 'object') {
      throw new Error('Invalid product data provided')
    }
    
    // Check if productData has the required properties
    if (productData.name === undefined || productData.name === null) {
      throw new Error('Product name is missing')
    }
    
    if (productData.description === undefined || productData.description === null) {
      throw new Error('Product description is missing')
    }
    
    if (productData.price === undefined || productData.price === null) {
      throw new Error('Product price is missing')
    }
    
    if (productData.stock === undefined || productData.stock === null) {
      throw new Error('Product stock is missing')
    }
    
    // Validate data types and values
    if (typeof productData.name !== 'string' || !productData.name.trim()) {
      throw new Error('Product name is required and must be a non-empty string')
    }
    
    if (typeof productData.description !== 'string' || !productData.description.trim()) {
      throw new Error('Product description is required and must be a non-empty string')
    }
    
    if (isNaN(parseFloat(productData.price)) || parseFloat(productData.price) <= 0) {
      throw new Error('Valid product price is required (must be a positive number)')
    }
    
    if (isNaN(parseInt(productData.stock)) || parseInt(productData.stock) < 0) {
      throw new Error('Valid stock quantity is required (must be a non-negative integer)')
    }
    
    const productsCollection = collection(db, PRODUCTS_COLLECTION)
    
    // Check if product with same name already exists
    const q = query(
      productsCollection, 
      where('name', '==', productData.name.trim())
    )
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      throw new Error('A product with this name already exists')
    }
    
    const newProduct = {
      name: productData.name.trim(),
      description: productData.description.trim(),
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock) || 0,
      image: productData.image || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const docRef = await addDoc(productsCollection, newProduct)
    
    return {
      id: docRef.id,
      ...newProduct
    }
  } catch (error) {
    console.error('Error adding product:', error)
    throw error
  }
}

// Update an existing product in Firestore
export const updateProduct = async (productId, productData) => {
  try {
    console.log('updateProduct called with:', { productId, productData });
    
    // Validate input data
    if (!productData || typeof productData !== 'object') {
      throw new Error('Invalid product data provided')
    }
    
    // Check if productData has the required properties
    if (productData.name === undefined || productData.name === null) {
      throw new Error('Product name is missing')
    }
    
    if (productData.description === undefined || productData.description === null) {
      throw new Error('Product description is missing')
    }
    
    if (productData.price === undefined || productData.price === null) {
      throw new Error('Product price is missing')
    }
    
    if (productData.stock === undefined || productData.stock === null) {
      throw new Error('Product stock is missing')
    }
    
    // Validate data types and values
    if (typeof productData.name !== 'string' || !productData.name.trim()) {
      throw new Error('Product name is required and must be a non-empty string')
    }
    
    if (typeof productData.description !== 'string' || !productData.description.trim()) {
      throw new Error('Product description is required and must be a non-empty string')
    }
    
    if (isNaN(parseFloat(productData.price)) || parseFloat(productData.price) <= 0) {
      throw new Error('Valid product price is required (must be a positive number)')
    }
    
    if (isNaN(parseInt(productData.stock)) || parseInt(productData.stock) < 0) {
      throw new Error('Valid stock quantity is required (must be a non-negative integer)')
    }
    
    // Check if product exists by ID
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(productRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Product with ID ${productId} not found in database`);
    }
    
    // Prepare update data
    const updateData = {
      name: productData.name.trim(),
      description: productData.description.trim(),
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock) || 0,
      updatedAt: new Date()
    };
    
    // Handle image update
    if (productData.image !== undefined) {
      if (productData.image && productData.image.trim()) {
        updateData.image = productData.image.trim();
      } else {
        // Keep existing image if new one is empty
        updateData.image = docSnap.data().image || '';
      }
    }
    
    console.log('Updating product with data:', { productId, updateData });
    
    // Update the document
    await updateDoc(productRef, updateData);
    
    // Get the updated document to return
    const updatedDoc = await getDoc(productRef);
    if (!updatedDoc.exists()) {
      throw new Error('Failed to verify product update');
    }
    
    return {
      id: productId,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

// Delete a product from Firestore
export const deleteProduct = async (productId) => {
  try {
    const productDoc = doc(db, PRODUCTS_COLLECTION, productId)
    await deleteDoc(productDoc)
    return productId
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

// Update product stock (for checkout functionality)
export const updateProductStock = async (productId, quantityPurchased) => {
  try {
    const productDoc = doc(db, PRODUCTS_COLLECTION, productId)
    await updateDoc(productDoc, {
      stock: increment(-quantityPurchased),
      updatedAt: new Date()
    })
    
    return true
  } catch (error) {
    console.error('Error updating product stock:', error)
    throw error
  }
}

// Batch update multiple product stocks (for checkout)
export const updateMultipleProductStocks = async (cartItems) => {
  try {
    const updatePromises = cartItems.map(item => 
      updateProductStock(item.id, item.quantity)
    )
    
    await Promise.all(updatePromises)
    return true
  } catch (error) {
    console.error('Error updating multiple product stocks:', error)
    throw error
  }
}


