import React, { useState, useEffect } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'
import { uploadProductImage } from '../services/productService'
import './ProductForm.css'

const ProductForm = ({ product, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    stock: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        image: product.image || '',
        stock: product.stock || ''
      })
      setImagePreview(product.image || '')
    }
  }, [product])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async () => {
    if (!imageFile) return formData.image
    setUploadingImage(true)
    try {
      const downloadURL = await uploadProductImage(imageFile)
      return downloadURL
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error // Re-throw to be caught in handleSubmit
    } finally {
      setUploadingImage(false)
    }
  }



  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required'
    }

    if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors)
      return
    }

    setIsSubmitting(true)

    try {
      // Upload image if a new one was selected
      let imageUrl = formData.image
      if (imageFile) {
        imageUrl = await uploadImage()
      }
      
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        image: imageUrl
      }
      
      // If editing, pass the product ID as first argument
      if (product && product.id) {
        await onSubmit(product.id, submitData)
      } else {
        await onSubmit(submitData)
      }
      
      onClose() // Close the form after successful submission
      
    } catch (error) {
      console.error('Error submitting form:', error)
      alert(`Failed to ${product ? 'update' : 'add'} product: ${error.message}`)
      throw error // Re-throw to be handled by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="form-overlay" onClick={handleOverlayClick}>
      <div className="product-form-modal">
        <div className="form-header">
          <div className="header-content">
            <div className="header-icon">
              {product ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              )}
            </div>
            <div className="header-text">
              <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="header-subtitle">
                {product ? 'Update product information and inventory' : 'Create a new product for your store'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-content">
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter product name"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={errors.description ? 'error' : ''}
                  placeholder="Enter product description"
                  rows="3"
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price ($) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={errors.price ? 'error' : ''}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.price && <span className="error-message">{errors.price}</span>}
                </div>
              </div>



              <div className="form-group">
                <label htmlFor="image">Product Image</label>
                <div className="image-upload-section">
                  <div className="image-preview">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Product preview" />
                    ) : (
                      <div className="no-image">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21,15 16,10 5,21"></polyline>
                        </svg>
                        <span>No image selected</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="image-upload-controls">
                    <input
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="imageFile" className="upload-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </label>
                    
                    <div className="url-input-section">
                      <span>Or enter image URL:</span>
                      <input
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={(e) => {
                          handleInputChange(e)
                          setImagePreview(e.target.value)
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group stock-input-group">
                <label htmlFor="stock">Stock Quantity *</label>
                <div className="stock-input-container">
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={`stock-input ${errors.stock ? 'error' : ''}`}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  <div className="stock-preview">
                    <span className="stock-preview-label">Stock:</span>
                    <span className={`stock-preview-number ${
                      formData.stock === 0 || formData.stock === '' ? 'out-of-stock' : 
                      parseInt(formData.stock) < 5 ? 'low-stock' : 'in-stock'
                    }`}>
                      {formData.stock || '0'}
                    </span>
                  </div>
                </div>
                {errors.stock && <span className="error-message">{errors.stock}</span>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  {product ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17,21 17,13 7,13 7,21"></polyline>
                    <polyline points="7,3 7,8 15,8"></polyline>
                  </svg>
                  {product ? 'Update Product' : 'Add Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm
