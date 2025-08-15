import { db } from './firebase.js';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Sample products data with proper structure
const sampleProducts = [
  {
    name: "MacBook Pro 16-inch",
    description: "Latest MacBook Pro with M2 Pro chip, 16GB RAM, 512GB SSD. Perfect for professional work and creative tasks.",
    price: 2499.99,
    stock: 15,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop"
  },
  {
    name: "iPhone 15 Pro",
    description: "Apple's flagship smartphone with A17 Pro chip, 48MP camera, and titanium design. Available in multiple colors.",
    price: 999.99,
    stock: 25,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop"
  },
  {
    name: "Sony WH-1000XM5",
    description: "Premium noise-canceling headphones with 30-hour battery life, LDAC support, and exceptional sound quality.",
    price: 399.99,
    stock: 12,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
  },
  {
    name: "iPad Air 5th Gen",
    description: "10.9-inch iPad Air with M1 chip, 64GB storage, and support for Apple Pencil. Perfect for creativity and productivity.",
    price: 599.99,
    stock: 18,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop"
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Android flagship with S Pen, 200MP camera, and Snapdragon 8 Gen 3. Ultimate productivity and photography device.",
    price: 1199.99,
    stock: 8,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop"
  },
  {
    name: "AirPods Pro 2nd Gen",
    description: "Active noise cancellation, spatial audio, and sweat resistance. Perfect companion for iPhone and Mac users.",
    price: 249.99,
    stock: 30,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=300&fit=crop"
  },
  {
    name: "Dell XPS 13 Plus",
    description: "13.4-inch premium laptop with Intel Core i7, 16GB RAM, 512GB SSD. Sleek design with InfinityEdge display.",
    price: 1299.99,
    stock: 10,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop"
  },
  {
    name: "Nintendo Switch OLED",
    description: "7-inch OLED screen, enhanced audio, and 64GB internal storage. The ultimate portable gaming console.",
    price: 349.99,
    stock: 22,
    image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=300&fit=crop"
  },
  {
    name: "GoPro Hero 12 Black",
    description: "5.3K video recording, 27MP photos, and HyperSmooth 6.0 stabilization. Capture your adventures in stunning detail.",
    price: 399.99,
    stock: 14,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop"
  }
];

// Function to generate sample products
export const generateSampleProducts = async () => {
  try {
    console.log('Generating sample products...');
    
    const productsCollection = collection(db, 'products');
    const results = [];
    
    for (const productData of sampleProducts) {
      try {
        // Add timestamp fields
        const productWithTimestamps = {
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add to Firestore (this will auto-generate the ID)
        const docRef = await addDoc(productsCollection, productWithTimestamps);
        
        console.log(`Created product: ${productData.name} with ID: ${docRef.id}`);
        
        results.push({
          name: productData.name,
          id: docRef.id,
          success: true
        });
        
      } catch (error) {
        console.error(`Error creating product ${productData.name}:`, error);
        results.push({
          name: productData.name,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`Sample products generation completed: ${successCount} successful, ${failureCount} failed`);
    console.log('Results:', results);
    
    return {
      success: true,
      message: `Generated ${successCount} sample products successfully`,
      results: results
    };
    
  } catch (error) {
    console.error('Error generating sample products:', error);
    return {
      success: false,
      message: `Failed to generate sample products: ${error.message}`,
      error: error
    };
  }
};

// Function to check if products already exist
export const checkExistingProducts = async () => {
  try {
    const productsCollection = collection(db, 'products');
    const querySnapshot = await getDocs(productsCollection);
    
    const existingProducts = [];
    querySnapshot.forEach((doc) => {
      existingProducts.push({
        id: doc.id,
        name: doc.data().name
      });
    });
    
    return {
      count: existingProducts.length,
      products: existingProducts
    };
  } catch (error) {
    console.error('Error checking existing products:', error);
    throw error;
  }
};
