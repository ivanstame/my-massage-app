import React from 'react';

const RecipientSection = ({ 
  recipientType, 
  setRecipientType, 
  recipientInfo, 
  setRecipientInfo,
  isComplete 
}) => {
  // Custom styles
  const styles = {
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      maxWidth: '100%',
      margin: '0 auto'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '15px'
    },
    cardIcon: {
      width: '24px',
      height: '24px',
      marginRight: '10px',
      color: '#2e8b57'
    },
    cardTitle: {
      fontSize: '18px',
      marginBottom: 0
    },
    recipientOptions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    recipientOption: {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '15px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    recipientOptionSelected: {
      borderColor: '#2e8b57',
      backgroundColor: '#f5f9f7'
    },
    recipientDetails: {
      flexGrow: 1,
      marginLeft: '10px'
    },
    recipientTitle: {
      fontWeight: 600,
      marginBottom: '3px'
    },
    recipientDesc: {
      fontSize: '14px',
      color: '#666666'
    },
    guestForm: {
      marginTop: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    formLabel: {
      fontSize: '14px',
      fontWeight: 500
    },
    formInput: {
      padding: '10px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '14px'
    },
    completionIndicator: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 'auto',
      backgroundColor: isComplete ? '#4CAF50' : '#E0E0E0',
      color: 'white',
      fontSize: '14px'
    }
  };

  return (
    <div style={styles.card} className={`transition-all duration-300 ${isComplete ? 'border-green-500' : 'border-gray-200'}`}>
      <div style={styles.cardHeader}>
        <div style={styles.cardIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h2 style={styles.cardTitle}>Who is this massage for?</h2>
        <div style={styles.completionIndicator}>
          {isComplete ? '✓' : ''}
        </div>
      </div>
      
      <div style={styles.recipientOptions}>
        <div 
          style={{
            ...styles.recipientOption,
            ...(recipientType === 'self' ? styles.recipientOptionSelected : {})
          }}
          onClick={() => setRecipientType('self')}
        >
          <input
            type="radio"
            id="for-me"
            name="recipient"
            checked={recipientType === 'self'}
            onChange={() => setRecipientType('self')}
          />
          <div style={styles.recipientDetails}>
            <div style={styles.recipientTitle}>This massage is for me</div>
            <div style={styles.recipientDesc}>Use your account information for the booking</div>
          </div>
        </div>
        
        <div 
          style={{
            ...styles.recipientOption,
            ...(recipientType === 'other' ? styles.recipientOptionSelected : {})
          }}
          onClick={() => setRecipientType('other')}
        >
          <input
            type="radio"
            id="for-someone"
            name="recipient"
            checked={recipientType === 'other'}
            onChange={() => setRecipientType('other')}
          />
          <div style={styles.recipientDetails}>
            <div style={styles.recipientTitle}>This massage is for someone else</div>
            <div style={styles.recipientDesc}>Enter recipient's information below</div>
            
            {recipientType === 'other' && (
              <div style={styles.guestForm}>
                <div style={styles.formGroup}>
                  <label htmlFor="guest-name" style={styles.formLabel}>Recipient's Full Name</label>
                  <input
                    type="text"
                    id="guest-name"
                    placeholder="Enter full name"
                    value={recipientInfo.name}
                    onChange={(e) => setRecipientInfo({...recipientInfo, name: e.target.value})}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="guest-phone" style={styles.formLabel}>Recipient's Phone Number</label>
                  <input
                    type="tel"
                    id="guest-phone"
                    placeholder="(555) 555-5555"
                    value={recipientInfo.phone}
                    onChange={(e) => setRecipientInfo({...recipientInfo, phone: e.target.value})}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="guest-email" style={styles.formLabel}>Recipient's Email (Optional)</label>
                  <input
                    type="email"
                    id="guest-email"
                    placeholder="email@example.com"
                    value={recipientInfo.email}
                    onChange={(e) => setRecipientInfo({...recipientInfo, email: e.target.value})}
                    style={styles.formInput}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientSection;
