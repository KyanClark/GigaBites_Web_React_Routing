import React from 'react'
import { Link } from 'react-router-dom'
import './CheckoutConfirmation.css'

const CheckoutConfirmation = ({ orderDetails, onClose }) => {
  const { items, subtotal, tax, shipping, total, orderNumber, timestamp } = orderDetails

  return (
    <div className="checkout-confirmation">
      <div className="confirmation-container">
        <div className="confirmation-header">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
          </div>
          <h1>Order Confirmed!</h1>
          <p className="confirmation-subtitle">
            Thank you for your purchase. Your order has been successfully processed.
          </p>
        </div>

        <div className="order-summary">
          <div className="order-info">
            <div className="order-number">
              <span className="label">Order Number:</span>
              <span className="value">#{orderNumber}</span>
            </div>
            <div className="order-date">
              <span className="label">Order Date:</span>
              <span className="value">{new Date(timestamp).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="order-items">
            <h3>Items Purchased</h3>
            <div className="items-list">
              {items.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="item-image">
                    <img 
                      src={item.image?.startsWith('assets/') ? `/${item.image}` : item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop'
                      }}
                    />
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="item-price">${item.price} × {item.quantity}</p>
                  </div>
                  <div className="item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax:</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping:</span>
              <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="total-row final-total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link to="/" className="continue-shopping-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H6m0 0l7 7m-7-7l7-7"/>
            </svg>
            Continue Shopping
          </Link>
          <button className="print-receipt-btn" onClick={() => window.print()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="6,9 6,2 18,2 18,9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <polyline points="6,14 6,22 18,22 18,14"></polyline>
            </svg>
            Print Receipt
          </button>
        </div>

        <div className="next-steps">
          <h3>What's Next?</h3>
          <div className="steps-grid">
            <div className="step">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="step-content">
                <h4>Processing</h4>
                <p>Your order is being prepared for shipment</p>
              </div>
            </div>
            <div className="step">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M16 16l2-2 4 4"></path>
                  <polyline points="22,6 12,16 2,10"></polyline>
                </svg>
              </div>
              <div className="step-content">
                <h4>Quality Check</h4>
                <p>Items undergo final quality inspection</p>
              </div>
            </div>
            <div className="step">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <div className="step-content">
                <h4>Shipping</h4>
                <p>Your order will be shipped within 2-3 business days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutConfirmation
