import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorContext = createContext();

export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};

export const ErrorProvider = ({ children }) => {
    const [error, setError] = useState(null);
    const [errorCode, setErrorCode] = useState(null);
    const navigate = useNavigate();

    const showError = (message, code = null) => {
        setError(String(message || 'An error occurred'));
        setErrorCode(code ? String(code) : null);
    };

    const clearError = () => {
        setError(null);
        setErrorCode(null);
    };

    const handleClose = () => {
        clearError();
        navigate("/");
    };
    return (
        <ErrorContext.Provider value={{ showError, clearError }}>
            {children}
            {error && (
                <div className="modal-overlay">
                    <div className="modal-content error-box">
                        <h3>Error occurred</h3>
                        {errorCode && <p>Error code: {errorCode}</p>}
                        <p>{error}</p>
                        <button onClick={clearError}>Close</button>
                        <button onClick={handleClose}>Home</button>
                    </div>
                </div>
            )}
        </ErrorContext.Provider>
    );
};