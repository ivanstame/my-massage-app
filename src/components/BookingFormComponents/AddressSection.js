import React, { useState, useEffect } from 'react';
import { CheckCircle, MapPin, Info } from 'lucide-react';
import AddressForm from '../AddressForm';

const AddressSection = ({ 
  savedAddress,
  currentAddress,
  onAddressChange,
  googleMapsLoaded,
  isComplete = false
}) => {
  // Internal state for the radio toggle
  const [useSavedAddr, setUseSavedAddr] = useState(true);
  
  // When the saved address option is selected and there's a saved address, use it
  useEffect(() => {
    if (useSavedAddr && savedAddress) {
      onAddressChange(savedAddress);
    }
  }, [useSavedAddr, savedAddress, onAddressChange]);
  
  // Handle address confirmation from the AddressForm
  const handleAddressConfirmed = (addressData) => {
    onAddressChange(addressData);
  };
  return (
    <>
      {!currentAddress?.fullAddress && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-400 mr-2" />
            <div>
              <h3 className="font-medium text-blue-800">Required First Step</h3>
              <p className="text-sm text-blue-700 mt-1">
                Please confirm your service location before viewing availability
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white p-4 border relative">
        <CheckCircle className={`absolute top-2 right-2 w-6 h-6 ${
          isComplete ? 'text-green-500' : 'text-slate-300'
        }`} />
        {/* The heading we want to show for ANY address option */}
        <div className="flex items-center mb-3 border-b pb-2">
          <MapPin className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="font-medium">Service Location</h2>
        </div>

        {/* The radio buttons to choose how we pick an address */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={useSavedAddr}
              onChange={() => setUseSavedAddr(true)}
            />
            <span className="text-sm">Use my saved address</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!useSavedAddr}
              onChange={() => setUseSavedAddr(false)}
            />
            <span className="text-sm">Enter a different address</span>
          </label>
        </div>

        {/* Display user's saved address OR the address form, based on radio toggle */}
        {useSavedAddr ? (
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-sm mb-2">Current Address:</p>
            {savedAddress?.fullAddress ? (
              <p className="text-sm">{savedAddress.fullAddress}</p>
            ) : (
              <p className="italic text-sm">
                No address found in profile or still loading...
              </p>
            )}
          </div>
        ) : (
          <AddressForm
            onAddressConfirmed={handleAddressConfirmed}
            googleMapsLoaded={googleMapsLoaded}
          />
        )}
      </div>
    </>
  );
};

export default AddressSection;
