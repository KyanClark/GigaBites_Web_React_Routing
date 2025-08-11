import React from 'react'
import './Cart.css'

const Cart = ({ items, onClose, onUpdateQuantity, onRemoveItem }) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + tax

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleCheckout = () => {
    alert('Checkout functionality would be implemented here!')
  }

  return (
    <div className="cart-overlay" onClick={handleOverlayClick}>
      <div className="cart-modal">
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="cart-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="cart-content">
          {items.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <h3>Your cart is empty</h3>
              <p>Add some products to get started!</p>
              <button className="continue-shopping" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {items.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                  />
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                <button className="checkout-btn" onClick={handleCheckout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16,3 21,8 21,21 16,21"></polygon>
                    <line x1="9" y1="9" x2="9" y2="9"></line>
                  </svg>
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const CartItem = ({ item, onUpdateQuantity, onRemoveItem }) => {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      onRemoveItem(item.id)
    } else {
      onUpdateQuantity(item.id, newQuantity)
    }
  }

  return (
    <div className="cart-item">
      <div className="item-image">
        <img 
          src={item.image || '/api/placeholder/80/80'} 
          alt={item.name}
          onError={(e) => {
            e.target.src = '/api/placeholder/80/80'
          }}
        />
      </div>
      
      <div className="item-details">
        <h4 className="item-name">{item.name}</h4>

        <div className="item-price">${item.price}</div>
      </div>
      
      <div className="item-controls">
        <div className="quantity-controls">
          <button 
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity - 1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span className="quantity">{item.quantity}</span>
          <button 
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity + 1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        
        <div className="item-total">
          ${(item.price * item.quantity).toFixed(2)}
        </div>
        
        <button 
          className="remove-btn"
          onClick={() => onRemoveItem(item.id)}
          title="Remove item"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Cart
