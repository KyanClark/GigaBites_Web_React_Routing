// Sample data for GigaBites e-commerce store
export const sampleProducts = [
  {
    id: '1',
    name: 'MacBook Pro 16-inch',
    description: 'Powerful laptop with M2 Pro chip, perfect for professionals and creatives.',
    price: 2499.99,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=400&fit=crop',
    stock: 15
  },
  {
    id: '2',
    name: "iPhone 15 Pro",
    description: "The most advanced iPhone ever with titanium design, A17 Pro chip, and revolutionary camera system.",
    price: 1199.99,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
    stock: 8
  },
  {
    id: '8',
    name: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling headphones with exceptional sound quality and 30-hour battery life.",
    price: 329.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    stock: 18
  },
  {
    id: '3',
    name: "Samsung Galaxy S24 Ultra",
    description: "Ultimate Android flagship with S Pen, 200MP camera, and AI-powered features.",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop",
    stock: 12
  },
  {
    id: '5',
    name: "iPad Pro 12.9-inch",
    description: "Most advanced iPad with M2 chip, Liquid Retina XDR display, and support for Apple Pencil.",
    price: 1099.99,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
    stock: 20
  },
  {
    id: '9',
    name: "AirPods Pro (2nd generation)",
    description: "Apple's most advanced earbuds with Active Noise Cancellation, Adaptive Transparency, and spatial audio.",
    price: 229.99,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop",
    stock: 30
  },
  {
    id: '4',
    name: "Dell XPS 13 Plus",
    description: "Premium ultrabook with 12th Gen Intel processors and stunning InfinityEdge display.",
    price: 1399.99,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
    stock: 6
  },
  {
    id: '7',
    name: "Apple Watch Series 9",
    description: "Most advanced Apple Watch with S9 chip, Double Tap gesture, and comprehensive health tracking.",
    price: 429.99,
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=300&fit=crop",
    stock: 25
  },
  {
    id: '6',
    name: "PlayStation 5",
    description: "Next-generation gaming console with lightning-fast SSD, ray tracing, and immersive 3D audio.",
    price: 499.99,
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=300&fit=crop",
    stock: 0
  },
  {
    id: '10',
    name: "Magic Mouse",
    description: "Apple's sleek wireless mouse with Multi-Touch surface and rechargeable battery.",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop",
    stock: 0
  }
]

// Function to add sample data to Firebase
export const addSampleDataToFirebase = async (firestore, addDoc, collection) => {
  try {
    console.log('Adding sample data to Firebase...')
    
    for (const product of sampleProducts) {
      await addDoc(collection(firestore, 'products'), {
        ...product,
        createdAt: new Date()
      })
    }
    
    console.log('Sample data added successfully!')
    return true
  } catch (error) {
    console.error('Error adding sample data:', error)
    return false
  }
}
