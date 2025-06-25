import React from 'react';

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    minWidth: '400px',
    maxWidth: '90%',
};

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                {children}
                <button 
                    onClick={onClose} 
                    style={{
                        position: 'absolute', top: '10px', right: '15px',
                        background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
                    }}>
                    &times;
                </button>
            </div>
        </div>
    );
};

export { Modal };