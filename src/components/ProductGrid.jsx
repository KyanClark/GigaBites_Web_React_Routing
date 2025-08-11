import React from 'react'
import './ProductGrid.css'

const ProductGrid = ({ 
  products = [], 
  onProductClick, 
  onAddProductClick,
  hasProducts,
  sortBy,
  onSortChange,
  onAddToCart = () => {}, 
  onEditProduct = () => {}, 
  onDeleteProduct = () => {}, 
  loading = false
}) => {
  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : []
  
  if (loading) {
    return (
      <section className="product-grid-section">
        <div className="container">
          <div className="loading-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="loading-card">
                <div className="loading-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="product-grid-container">


      {/* Grid Controls */}
      <div className="grid-header">
        <div className="grid-controls">
          {/* Add Product Button - Left Side */}
          <div className="left-controls">
            <button className="add-product-btn cta-button primary" onClick={onAddProductClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Add New Product
            </button>
          </div>

          {/* Sort By - Right Side */}
          <div className="right-controls">
            <div className="sort-section">
              <label htmlFor="sort-select">Sort by:</label>
              <select 
                id="sort-select"
                value={sortBy} 
                onChange={(e) => onSortChange(e.target.value)}
                className="sort-filter enhanced"
              >
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {safeProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>No products found</h3>
          <p>Try loading sample data or add your first product</p>
        </div>
      ) : (
        <div className="products-grid">
          {safeProducts.map(product => {
            // Ensure product has required properties
            if (!product || !product.id) {
              console.warn('Invalid product found:', product)
              return null
            }
            
            return (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
              />
            )
          }).filter(Boolean)}
        </div>
      )}
    </div>
  )
}

const ProductCard = ({ 
  product = {}, 
  onProductClick = () => {}, 
  onAddToCart = () => {}, 
  onEditProduct = () => {}, 
  onDeleteProduct = () => {} 
}) => {
  // Ensure product has all required properties with defaults
  const safeProduct = {
    id: product.id || 'unknown',
    name: product.name || 'Unknown Product',
    description: product.description || 'No description available',
    price: product.price || 0,
    image: product.image || '',
    stock: product.stock || 0,
    ...product
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this product?')) {
      onDeleteProduct(safeProduct.id)
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEditProduct(safeProduct)
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    onAddToCart(safeProduct)
  }

  // Helper function to get image path
  const getImagePath = (imagePath) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
    if (imagePath.startsWith('assets/')) {
      return `/${imagePath}`
    }
    return imagePath
  }

  return (
    <div className="product-card" onClick={() => onProductClick(safeProduct)}>
      <div className="card-image">
        <img 
          src={getImagePath(safeProduct.image)} 
          alt={safeProduct.name}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
          }}
        />
        <div className="card-overlay">
          <button className="overlay-btn" onClick={handleAddToCart} title="Add to Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{safeProduct.name}</h3>
        <p className="card-description">{safeProduct.description}</p>
        <div className="card-price">${safeProduct.price}</div>
        
        {/* Stock status */}
        <div className="stock-info">
          <div className="stock-display">
            <span className="stock-label">Stock:</span>
            <span className={`stock-number ${
              safeProduct.stock === 0 ? 'out-of-stock' : 
              safeProduct.stock < 5 ? 'low-stock' : 'in-stock'
            }`}>
              {safeProduct.stock}
            </span>
          </div>
          <span className={`stock-badge ${
            safeProduct.stock === 0 ? 'out-of-stock' : 
            safeProduct.stock < 5 ? 'low-stock' : 'in-stock'
          }`}>
            {safeProduct.stock === 0 ? 'Out of Stock' : 
             safeProduct.stock < 5 ? `${safeProduct.stock} left` : 'In Stock'}
          </span>
        </div>

        <div className="card-actions">
          <button 
            className={`action-btn primary ${safeProduct.stock === 0 ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={safeProduct.stock === 0}
          >
            {safeProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <div className="admin-actions">
            <button className="action-btn icon-btn edit" onClick={handleEdit} title="Edit Product">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button className="action-btn icon-btn delete" onClick={handleDelete} title="Delete Product">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductGrid
