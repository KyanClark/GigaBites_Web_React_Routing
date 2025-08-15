import React, { useState, useEffect } from 'react'
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
  const [isFormInitialized, setIsFormInitialized] = useState(false)

  useEffect(() => {
    if (product) {
      console.log('🔍 Initializing form with product:', product);
      console.log('🔍 Product data types:', {
        name: typeof product.name,
        description: typeof product.description,
        price: typeof product.price,
        stock: typeof product.stock,
        image: typeof product.image
      });
      const initialData = {
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        image: product.image || '',
        stock: product.stock || ''
      };
      console.log('🔍 Setting form data:', initialData);
      console.log('🔍 Initial data types:', {
        name: typeof initialData.name,
        description: typeof initialData.description,
        price: typeof initialData.price,
        stock: typeof initialData.stock,
        image: typeof initialData.image
      });
      setFormData(initialData);
      setImagePreview(product.image || '');
      setIsFormInitialized(true);
    } else {
      // Reset form when adding new product
      console.log('🔍 Resetting form for new product');
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        stock: ''
      });
      setImagePreview('');
      setImageFile(null);
      setIsFormInitialized(true);
    }
  }, [product])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    console.log('🔍 Input change:', { name, value, currentFormData: formData });
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('🔍 Updated form data:', newData);
      return newData;
    });
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
      
      // Create preview and update form data
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        setImagePreview(dataUrl)
        setFormData(prev => ({ ...prev, image: dataUrl }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Image processing is now handled directly in handleImageChange

  const validateForm = () => {
    const newErrors = {}
    
    console.log('🔍 Validating form data:', formData)

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Product name is required'
      console.log('❌ Name validation failed:', { name: formData.name, trimmed: formData.name?.trim() })
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description is required'
      console.log('❌ Description validation failed:', { description: formData.description, trimmed: formData.description?.trim() })
    }

    if (!formData.price || formData.price === '' || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required'
      console.log('❌ Price validation failed:', { price: formData.price, parsed: parseFloat(formData.price), isNaN: isNaN(parseFloat(formData.price)) })
    }

    if (!formData.stock || formData.stock === '' || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required'
      console.log('❌ Stock validation failed:', { stock: formData.stock, parsed: parseInt(formData.stock), isNaN: isNaN(parseInt(formData.stock)) })
    }

    console.log('🔍 Validation errors:', newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('🔍 Form data before validation:', formData)
    console.log('🔍 Form initialization status:', isFormInitialized)
    
    // Check if form is properly initialized
    if (!isFormInitialized) {
      console.error('❌ Form not yet initialized');
      alert('Form is still loading. Please wait a moment and try again.');
      return;
    }
    
    // Small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('🔍 Form initialization check:', {
        isFormInitialized,
        hasName: !!formData.name,
        hasDescription: !!formData.description,
        hasPrice: !!formData.price,
        hasStock: !!formData.stock,
        formData
      })
      
      // More detailed validation
      // Use the validateForm function instead of duplicate validation
      if (!validateForm()) {
        console.log('❌ Form validation failed:', errors)
        return
      }

    setIsSubmitting(true)

    try {
      // Image is already processed and stored in formData.image
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        image: formData.image || ''
      }
      
      console.log('🔍 Form data before submission:', formData);
      console.log('🔍 Submit data after processing:', submitData);
      console.log('🔍 Data types:', {
        name: typeof submitData.name,
        description: typeof submitData.description,
        price: typeof submitData.price,
        stock: typeof submitData.stock,
        image: typeof submitData.image
      });
      
      // Ensure numeric values are valid
      if (isNaN(submitData.price) || submitData.price <= 0) {
        console.error('❌ Invalid price after parsing:', submitData.price);
        alert('Price must be a valid positive number');
        return;
      }
      
      if (isNaN(submitData.stock) || submitData.stock < 0) {
        console.error('❌ Invalid stock after parsing:', submitData.stock);
        alert('Stock must be a valid non-negative number');
        return;
      }
      
      console.log('🔍 Submitting product data:', submitData)
      console.log('🔍 Form data state at submission:', formData)
      console.log('🔍 Parsed values:', {
        name: submitData.name,
        description: submitData.description,
        price: submitData.price,
        stock: submitData.stock,
        priceType: typeof submitData.price,
        stockType: typeof submitData.stock
      })
      console.log('🔍 Raw form values:', {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock
      })
      
      // Validate that we have the required data
      if (!submitData.name || !submitData.description || isNaN(submitData.price) || isNaN(submitData.stock)) {
        console.error('❌ Invalid submit data:', submitData);
        throw new Error('Form data is invalid. Please check all required fields.');
      }
      
      // If editing, pass the product ID as first argument
      if (product && product.id) {
        console.log('🔍 Submitting update with ID:', product.id);
        console.log('🔍 Submit data for update:', submitData);
        console.log('🔍 Final data types before submission:', {
          name: typeof submitData.name,
          description: typeof submitData.description,
          price: typeof submitData.price,
          stock: typeof submitData.stock,
          image: typeof submitData.image
        });
        
        // Ensure all required fields are present and valid
        if (!submitData.name || !submitData.description || !submitData.price || !submitData.stock) {
          console.error('❌ Final validation failed:', submitData);
          throw new Error('All required fields must be filled');
        }
        
        console.log('🔍 About to call onSubmit with:', { id: product.id, data: submitData });
        await onSubmit(product.id, submitData)
      } else {
        console.log('🔍 Submitting new product:', submitData);
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

        <form className="product-form" onSubmit={handleSubmit} noValidate>
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
                
                <div className="form-group">
                  <label htmlFor="stock">Stock Quantity *</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={errors.stock ? 'error' : ''}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  {errors.stock && <span className="error-message">{errors.stock}</span>}
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
                      {uploadingImage ? 'Processing...' : 'Select Image'}
                    </label>
                    
                    {/* URL input removed - image upload is sufficient */}
                    
                    {/* Show clear button if image is selected */}
                    {imageFile && (
                      <button
                        type="button"
                        className="clear-image-btn"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview('')
                          setFormData(prev => ({ ...prev, image: '' }))
                        }}
                      >
                        Clear Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting || !isFormInitialized}>
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  {product ? 'Updating...' : 'Adding...'}
                </>
              ) : !isFormInitialized ? (
                <>
                  <div className="spinner"></div>
                  Loading...
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
