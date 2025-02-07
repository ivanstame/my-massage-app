import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';

const AddressForm = ({ onAddressConfirmed, googleMapsLoaded }) => {
  const [address, setAddress] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [addressDetails, setAddressDetails] = useState(null);
  const [showUnitPrompt, setShowUnitPrompt] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const initializeAutocomplete = useCallback(() => {
    if (!googleMapsLoaded || !inputRef.current) return;

    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'geometry', 'formatted_address'],
        types: ['address']
      }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      handlePlaceSelect(place);
    });
  }, [googleMapsLoaded]);

  useEffect(() => {
    if (googleMapsLoaded) {
      initializeAutocomplete();
    }
  }, [googleMapsLoaded, initializeAutocomplete]);

  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = (place) => {
    if (!place.geometry) {
      console.warn('No details available for this address');
      return;
    }

    const addressComponents = {
      street_number: '',
      route: '',
      locality: '',
      administrative_area_level_1: '',
      postal_code: ''
    };

    place.address_components.forEach(component => {
      const type = component.types[0];
      if (addressComponents.hasOwnProperty(type)) {
        addressComponents[type] = component.long_name;
      }
    });

    setAddressDetails({
      formatted_address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      components: addressComponents
    });
    setShowUnitPrompt(true);
  };

  const handleUnitSubmit = () => {
    const fullAddress = unitNumber 
      ? `${addressDetails.formatted_address}, Unit ${unitNumber}`
      : addressDetails.formatted_address;

    const finalAddress = {
      fullAddress,
      lat: addressDetails.lat,
      lng: addressDetails.lng,
      unit: unitNumber,
      street: `${addressDetails.components.street_number} ${addressDetails.components.route}`.trim(),
      city: addressDetails.components.locality,
      state: addressDetails.components.administrative_area_level_1,
      zip: addressDetails.components.postal_code
    };

    onAddressConfirmed(finalAddress);
    setShowUnitPrompt(false);
    setIsConfirmed(true);
    setAddress(fullAddress);
  };

  if (!googleMapsLoaded) {
    return (
      <div className="p-4 text-center text-slate-500 animate-pulse">
        <MapPin className="w-8 h-8 mx-auto mb-2" />
        Loading address services...
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
        {!isConfirmed ? (
          <div className="relative">
            <input
              ref={inputRef}
              id="address-input"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Start typing your address..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Address Confirmed</h3>
                <p className="mt-1 text-sm text-green-700">
                  {addressDetails.fullAddress}
                </p>
                <button
                  onClick={() => {
                    setIsConfirmed(false);
                    setAddress('');
                    setUnitNumber('');
                    setAddressDetails(null);
                  }}
                  className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                >
                  Edit Address
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUnitPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-blue-100 p-6 max-w-md w-full mx-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Confirm Address</h3>
                <p className="text-slate-600 mt-1 text-sm">{addressDetails.formatted_address}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Unit/Apt/Suite (optional)
                </label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value.replace(/[^a-zA-Z0-9\s]/g, ''))}
                  placeholder="e.g., Apt 4B"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUnitPrompt(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnitSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Confirm Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressForm;