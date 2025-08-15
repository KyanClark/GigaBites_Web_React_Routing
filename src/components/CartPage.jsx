import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './CartPage.css'

const CartPage = ({ 
  items = [], 
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  onCheckout = () => {}
}) => {
  // Ensure items is always an array and has safe data
  const safeItems = Array.isArray(items) ? items.filter(item => item && item.id) : []
  
  const subtotal = safeItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0
    const quantity = parseInt(item.quantity) || 1
    return sum + (price * quantity)
  }, 0)
  
  const tax = subtotal * 0.08 // 8% tax
  const shipping = subtotal > 100 ? 0 : 9.99 // Free shipping over $100
  const total = subtotal + tax + shipping

  const handleCheckout = () => {
    onCheckout()
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <Link to="/" className="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H6m0 0l7 7m-7-7l7-7"/>
            </svg>
            Continue Shopping
          </Link>
          <h1>Shopping Cart</h1>
          <div className="cart-count">
            {safeItems.length} {safeItems.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        {safeItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items to your cart.</p>
            
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              <div className="cart-items-header">
                <span>Product</span>
                <span>Price</span>
                <span>Qty</span>
                <span>Total</span>
                <span></span>
              </div>
              
              {safeItems.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-card">
                <h3>Order Summary</h3>
                
                <div className="summary-row">
                  <span>Subtotal ({items.length} items):</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                
                <div className="summary-row">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                {subtotal < 100 && (
                  <div className="shipping-notice">
                    Add ${(100 - subtotal).toFixed(2)} more for FREE shipping!
                  </div>
                )}
                
                <button className="checkout-btn" onClick={handleCheckout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16,3 21,8 21,21 16,21"></polygon>
                    <line x1="9" y1="9" x2="9" y2="9"></line>
                  </svg>
                  Proceed to Checkout
                </button>
                
                <div className="payment-methods">
                  <span>We accept:</span>
                  <div className="payment-icons">
                    <span>💳</span>
                    <span>🏦</span>
                    <span>📱</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const CartItem = ({ item, onUpdateQuantity, onRemoveItem }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await onRemoveItem(item);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity > 0) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="cart-item">
      <div className="item-info">
        <div className="item-image">
          <img 
            src={item.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop'} 
            alt={item.name}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop'
            }}
          />
        </div>
        <div className="item-details">
          <h4 className="item-name">{item.name}</h4>
          <p className="item-description">{item.description?.substring(0, 60)}...</p>
        </div>
      </div>
      
      <div className="item-price">
        ${item.price.toFixed(2)}
      </div>
      
      <div className="item-quantity">
        <span className="quantity">{item.quantity}</span>
      </div>
      
      <div className="item-total">
        ${(item.price * item.quantity).toFixed(2)}
      </div>
      
      <div className="item-actions">
        <button 
          className={`remove-btn ${isRemoving ? 'removing' : ''}`}
          onClick={handleRemoveClick}
          title="Remove item from cart"
          aria-label="Remove item"
          disabled={isRemoving}
        >
          {isRemoving ? (
            <span className="loading-spinner"></span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default CartPage
