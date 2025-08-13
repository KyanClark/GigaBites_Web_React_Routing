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
import { db, storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

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

// Upload image to Firebase Storage
export const uploadProductImage = async (file) => {
  try {
    // Check if file exists and is an image
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file')
    }

    // Create a unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const filename = `products/${timestamp}.${fileExt}`
    const storageRef = ref(storage, filename)
    
    // Upload the file
    await uploadBytes(storageRef, file)
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image. Please try again.')
  }
}

// Add a new product to Firestore
export const addProduct = async (productData) => {
  try {
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
    let productRef = doc(db, PRODUCTS_COLLECTION, productId);
    let docSnap = await getDoc(productRef);
    let productExists = docSnap.exists();
    
    // If product not found by ID, try to find by name
    if (!productExists) {
      console.warn(`Product with ID ${productId} not found, trying to find by name`);
      const productsCollection = collection(db, PRODUCTS_COLLECTION);
      const q = query(
        productsCollection,
        where('name', '==', productData.name.trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Use the first matching product
        const existingProduct = querySnapshot.docs[0];
        console.log(`Found product by name: ${existingProduct.id} - ${existingProduct.data().name}`);
        productRef = doc(db, PRODUCTS_COLLECTION, existingProduct.id);
        productId = existingProduct.id; // Update the productId for the return value
      } else {
        throw new Error('Product not found in database');
      }
    }
    
    // Prepare update data
    const updateData = {
      name: productData.name.trim(),
      description: productData.description.trim(),
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock) || 0,
      updatedAt: new Date()
    };
    
    // Only update image if it's a new one (not a URL and not empty)
    if (productData.image && !productData.image.startsWith('http') && !productData.image.startsWith('data:image')) {
      updateData.image = productData.image;
    } else if (productData.image === '' && docSnap.exists()) {
      // If image is being removed, keep the existing one
      updateData.image = docSnap.data().image || '';
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


