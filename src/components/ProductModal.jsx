import React, { useReducer, useEffect } from 'react';
import './ProductModal.css';
import { FaShoppingCart, FaTimes, FaMinus, FaPlus, FaCheck } from 'react-icons/fa';

// useReducer for product interaction state
const productInteractionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_QUANTITY':
      return { 
        ...state, 
        selectedQuantity: Math.max(1, Math.min(action.payload, state.maxStock)),
        lastAction: 'set',
        showSuccess: false
      }
    case 'INCREMENT_QUANTITY':
      return { 
        ...state, 
        selectedQuantity: Math.min(state.selectedQuantity + 1, state.maxStock),
        lastAction: 'increment',
        showSuccess: false
      }
    case 'DECREMENT_QUANTITY':
      return { 
        ...state, 
        selectedQuantity: Math.max(1, state.selectedQuantity - 1),
        lastAction: 'decrement',
        showSuccess: false
      }
    case 'RESET_STATE':
      return {
        selectedQuantity: 1,
        maxStock: action.payload || 0,
        lastAction: null,
        showSuccess: false
      }
    case 'SHOW_SUCCESS':
      return {
        ...state,
        showSuccess: true
      }
    default:
      return state
  }
}

const ProductModal = ({ product, onClose = () => {}, onAddToCart = () => {} }) => {
  if (!product) return null

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

  // Initialize useReducer for product interaction state
  const [interactionState, dispatch] = useReducer(productInteractionReducer, {
    selectedQuantity: 1,
    maxStock: safeProduct.stock,
    lastAction: null,
    showSuccess: false
  })

  // Reset state when product changes
  useEffect(() => {
    dispatch({ type: 'RESET_STATE', payload: safeProduct.stock })
  }, [safeProduct.id, safeProduct.stock])

  const handleAddToCart = async () => {
    if (safeProduct.stock > 0 && interactionState.selectedQuantity > 0) {
      try {
        // Call onAddToCart with the product and selected quantity
        await onAddToCart(safeProduct, interactionState.selectedQuantity)
        dispatch({ type: 'SHOW_SUCCESS' })
        
        // Auto-close after success
        setTimeout(() => {
          onClose()
        }, 1500)
      } catch (error) {
        console.error('Error adding to cart:', error)
      }
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Helper function to get image path
  const getImagePath = (imagePath) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'
    if (imagePath.startsWith('assets/')) {
      return `/${imagePath}`
    }
    if (imagePath.startsWith('data:image/')) {
      return imagePath // Return data URL as-is
    }
    return imagePath
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="product-modal">
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="modal-content">
          {/* Left Side - Product Image */}
          <div className="modal-left">
            <div className="product-image-container">
              <img 
                src={getImagePath(safeProduct.image)} 
                alt={safeProduct.name}
                className="product-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
                }}
              />
              <div className="image-overlay">
                <div className={`stock-badge ${
                  safeProduct.stock === 0 ? 'out-of-stock' : 
                  safeProduct.stock < 5 ? 'low-stock' : 'in-stock'
                }`}>
                  {safeProduct.stock === 0 ? 'Out of Stock' : 
                   safeProduct.stock < 5 ? `${safeProduct.stock} Left` : 'In Stock'}
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Right Side - Product Details */}
          <div className="modal-right">
            <div className="product-header">
              <h2 className="product-title">{safeProduct.name}</h2>
              <div className="product-price">${safeProduct.price.toFixed(2)}</div>
            </div>
            
            <p className="product-description">{safeProduct.description}</p>
            
            {/* Stock and Quantity Controls */}
            <div className="stock-info">
              <span className="stock-label">Available Stock:</span>
              <span className={`stock-amount ${safeProduct.stock < 5 ? 'low-stock' : ''}`}>
                {safeProduct.stock} {safeProduct.stock === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            {/* Quantity Selector */}
            <div className="quantity-selector">
              <span className="quantity-label">Quantity:</span>
              <div className="quantity-controls">
                <button 
                  className={`quantity-btn ${interactionState.selectedQuantity <= 1 ? 'disabled' : ''}`} 
                  onClick={() => dispatch({ type: 'DECREMENT_QUANTITY' })}
                  disabled={interactionState.selectedQuantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <FaMinus />
                </button> 
                <span className="quantity-display">
                  {interactionState.selectedQuantity}
                </span>
                <button 
                  className={`quantity-btn ${interactionState.selectedQuantity >= safeProduct.stock ? 'disabled' : ''}`}
                  onClick={() => dispatch({ type: 'INCREMENT_QUANTITY' })}
                  disabled={interactionState.selectedQuantity >= safeProduct.stock}
                  aria-label="Increase quantity"
                >
                  <FaPlus />
                </button>
              </div>
              
              {/* Stock remaining after selection */}
              {interactionState.selectedQuantity > 0 && safeProduct.stock > 0 && (
                <div className="stock-remaining">
                  {safeProduct.stock - interactionState.selectedQuantity} remaining after adding to cart
                </div>
              )}
            </div>
              
              {/* Add to Cart Button */}
            <button 
              className={`add-to-cart-btn ${safeProduct.stock === 0 ? 'disabled' : ''} ${
                interactionState.showSuccess ? 'success' : ''
              }`}
              onClick={handleAddToCart}
              disabled={safeProduct.stock === 0}
            >
              {interactionState.showSuccess ? (
                <>
                  <FaCheck className="btn-icon" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <FaShoppingCart className="btn-icon" />
                  {safeProduct.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </>
              )}
            </button>
            
            {/* Success Message */}
            {interactionState.showSuccess && (
              <div className="success-message">
                Added {interactionState.selectedQuantity} {interactionState.selectedQuantity === 1 ? 'item' : 'items'} to your cart
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
