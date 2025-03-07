import React from 'react';
import { DateTime } from 'luxon';
import { DEFAULT_TZ } from '../../utils/timeConstants';
import { 
  MASSAGE_TYPES, 
  MASSAGE_ADDONS, 
  calculateBasePrice, 
  calculateAddonsPrice, 
  calculateTotalPrice 
} from '../../shared/constants/massageOptions';

const BookingSummaryCard = ({
  selectedMassageType,
  selectedDuration,
  selectedDate,
  selectedTime,
  fullAddress,
  selectedAddons = [],
  recipientType,
  recipientInfo
}) => {
  // Only show the summary card if all required fields are filled
  if (!selectedMassageType || !selectedDuration || !selectedDate || !selectedTime || !fullAddress) {
    return null;
  }

  // Format date for display
  const formattedDate = DateTime.fromJSDate(selectedDate)
    .setZone(DEFAULT_TZ)
    .toFormat('cccc, MMMM d, yyyy');

  // Get massage type name
  const massageType = MASSAGE_TYPES.find(type => type.id === selectedMassageType);
  const massageTypeName = massageType ? massageType.name : 'Standard';

  // Get formatted time
  const formattedTime = selectedTime.display || selectedTime.local;

  // Convert selectedDuration from string to number for price calculations
  const durationMinutes = parseInt(selectedDuration, 10);
  
  // Calculate prices
  const basePrice = calculateBasePrice(durationMinutes);
  const addonsPrice = calculateAddonsPrice(selectedAddons);
  const totalPrice = calculateTotalPrice(durationMinutes, selectedAddons);

  // Get add-ons with details
  const addonsWithDetails = selectedAddons.map(addonId => {
    return MASSAGE_ADDONS.find(addon => addon.id === addonId);
  }).filter(Boolean);

  return (
    <div className="bg-green-50 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-green-800 mb-4">Booking Summary</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="font-semibold">Service:</span>
          <span>{massageTypeName}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-semibold">Duration:</span>
          <span>{selectedDuration} min</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-semibold">Date:</span>
          <span>{formattedDate}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-semibold">Time:</span>
          <span>{formattedTime}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-semibold">Location:</span>
          <span className="text-right max-w-[60%]">{fullAddress}</span>
        </div>
        
        {/* Recipient information */}
        <div className="flex justify-between">
          <span className="font-semibold">Recipient:</span>
          <span className="text-right">
            {recipientType === 'self' ? 'You' : recipientInfo?.name}
          </span>
        </div>
        
        {/* Only show recipient details if it's for someone else */}
        {recipientType === 'other' && recipientInfo && (
          <div className="flex justify-between">
            <span className="font-semibold">Contact:</span>
            <span className="text-right">
              {recipientInfo.phone}
              {recipientInfo.email && <span className="block text-sm">{recipientInfo.email}</span>}
            </span>
          </div>
        )}
        
        {/* Add-ons section */}
        {addonsWithDetails.length > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold">Add-ons:</span>
            <div className="text-right">
              {addonsWithDetails.map(addon => (
                <div key={addon.id}>
                  {addon.name} (+${addon.price})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Divider */}
      <div className="border-t border-green-200 my-4"></div>
      
      {/* Total */}
      <div className="flex justify-between text-lg font-bold">
        <span>Total:</span>
        <span>${totalPrice}</span>
      </div>
    </div>
  );
};

export default BookingSummaryCard;
