import React from 'react';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({ 
  isOpen, 
  title = 'Are you sure?', 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Yes, remove it',
  cancelText = 'Cancel',
  confirmColor = '#ef4444'
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog">
        <h3 className="confirmation-dialog-title">{title}</h3>
        {message && <p className="confirmation-dialog-message">{message}</p>}
        <div className="confirmation-dialog-actions">
          <button 
            className="confirmation-dialog-button confirm"
            onClick={onConfirm}
            style={{ backgroundColor: confirmColor }}
          >
            {confirmText}
          </button>
          <button 
            className="confirmation-dialog-button cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
