// MassageSessionConfigurator.js
import React, { useState } from 'react';
import { 
  MASSAGE_TYPES, 
  MASSAGE_ADDONS, 
  DURATION_OPTIONS,
  calculateBasePrice,
  calculateAddonsPrice,
  calculateTotalPrice,
  calculateExtraTime
} from '../../shared/constants/massageOptions';

/**
 * MassageSessionConfigurator
 * 
 * Handles single-session configuration:
 * - Massage type
 * - Duration (via props from parent)
 * - Add-ons (via props from parent)
 * - Pricing calculations
 *
 * Props:
 * - selectedDuration (string)    => e.g. '60'
 * - setSelectedDuration (func)   => callback to update duration in parent
 * - selectedAddons (array)       => e.g. ['hotstone', 'theragun']
 * - setSelectedAddons (func)     => callback to update addons in parent
 * - selectedMassageType (string) => e.g. 'focused'
 * - setSelectedMassageType (func)=> callback to update massage type in parent
 */
const MassageSessionConfigurator = ({
  selectedDuration,
  setSelectedDuration,
  selectedAddons,
  setSelectedAddons,
  selectedMassageType,
  setSelectedMassageType
}) => {
  // Local state
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [showAddonsPanel, setShowAddonsPanel] = useState(false);
  
  // Toggle description expansion
  const toggleDescription = (typeId) => {
    setExpandedDescriptions({
      ...expandedDescriptions,
      [typeId]: !expandedDescriptions[typeId]
    });
  };
  
  // Handle massage type selection
  const handleMassageTypeSelect = (typeId) => {
    setSelectedMassageType(typeId);
  };
  
  // Handle duration selection
  const handleDurationSelect = (durationId) => {
    setSelectedDuration(durationId);
  };
  
  // Toggle add-on selection
  const toggleAddon = (addonId) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter((id) => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };
  
  // Get selected duration object
  const getSelectedDurationObj = () => {
    return DURATION_OPTIONS.find((d) => d.id === selectedDuration);
  };
  
  // Get selected massage type object
  const getSelectedMassageType = () => {
    return MASSAGE_TYPES.find((type) => type.id === selectedMassageType) || MASSAGE_TYPES[0];
  };
  
  // Get total session time
  const getTotalTime = () => {
    const durationMinutes = parseInt(selectedDuration || '60', 10);
    return durationMinutes + calculateExtraTime(selectedAddons);
  };

  // Inline CSS styles for demonstration (you can convert to Tailwind or your existing style approach)
  const styles = {
    container: {
      backgroundColor: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '10px',
      padding: '20px',
      marginTop: '10px'
    },
    sectionTitle: {
      fontSize: '18px',
      marginBottom: '12px',
      color: '#333'
    },
    // ... (Add any additional styling from your previous version if needed)
  };

  return (
    <div style={styles.container}>
      {/* Massage Type Selection */}
      <h3 style={styles.sectionTitle}>Select Massage Type</h3>
      {MASSAGE_TYPES.map((type) => (
        <div
          key={type.id}
          onClick={() => handleMassageTypeSelect(type.id)}
          style={{
            border: '2px solid',
            borderColor: selectedMassageType === type.id ? '#2e8b57' : '#e0e0e0',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '10px',
            cursor: 'pointer'
          }}
        >
          <h4 style={{ margin: 0, color: selectedMassageType === type.id ? '#2e8b57' : '#333' }}>
            {type.name}
          </h4>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            {type.shortDescription}
          </p>
          {!expandedDescriptions[type.id] ? (
            <button
              style={{ color: '#2e8b57', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleDescription(type.id);
              }}
            >
              Read more
            </button>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#444' }}>{type.description}</p>
              <button
                style={{ color: '#2e8b57', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDescription(type.id);
                }}
              >
                Show less
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Duration Selection */}
      <h3 style={styles.sectionTitle}>Select Session Duration</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {DURATION_OPTIONS.map((duration) => (
          <div
            key={duration.id}
            onClick={() => handleDurationSelect(duration.id)}
            style={{
              flex: 1,
              border: '2px solid',
              borderColor: selectedDuration === duration.id ? '#2e8b57' : '#e0e0e0',
              borderRadius: '10px',
              padding: '10px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>{duration.label}</p>
            <p style={{ margin: 0, color: '#2e8b57' }}>${duration.price}</p>
          </div>
        ))}
      </div>

      {/* Add-ons Toggle */}
      <button
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#f5f9f7',
          color: '#2e8b57',
          border: '2px solid #2e8b57',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setShowAddonsPanel(!showAddonsPanel)}
      >
        {showAddonsPanel ? 'Hide Enhancement Options' : 'Enhancement Options (Optional)'}
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
          {showAddonsPanel ? '−' : '+'}
        </span>
      </button>

      {/* Add-ons Panel */}
      {showAddonsPanel && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.sectionTitle}>Select Optional Add-ons</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {MASSAGE_ADDONS.map((addon) => (
              <div
                key={addon.id}
                onClick={() => toggleAddon(addon.id)}
                style={{
                  border: '2px solid',
                  borderColor: selectedAddons.includes(addon.id) ? '#2e8b57' : '#e0e0e0',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: selectedAddons.includes(addon.id) ? '#f5f9f7' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{addon.name}</h4>
                  <span style={{ color: '#2e8b57' }}>+${addon.price}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                  {addon.description}
                </p>
                {addon.extra && (
                  <p style={{ fontSize: '12px', color: '#ffb74d', fontWeight: 500 }}>
                    {addon.extra}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The "Your Selection" summary section has been removed as it's now handled by the BookingSummaryCard component */}
    </div>
  );
};

export default MassageSessionConfigurator;
