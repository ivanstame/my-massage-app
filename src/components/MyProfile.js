import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import ProfileSection from './ProfileSection';
import { EditModeTransition } from './transitions/TransitionComponents';
import TreatmentCard from './TreatmentCard';
import TreatmentPreferences from './TreatmentPreferences';

const STATES = [
  ['AK', 'Alaska'], ['AL', 'Alabama'], ['AR', 'Arkansas'], ['AZ', 'Arizona'], 
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], 
  ['DC', 'District of Columbia'], ['DE', 'Delaware'], ['FL', 'Florida'], 
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['IA', 'Iowa'], ['ID', 'Idaho'], 
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['KS', 'Kansas'], ['KY', 'Kentucky'], 
  ['LA', 'Louisiana'], ['MA', 'Massachusetts'], ['MD', 'Maryland'], 
  ['ME', 'Maine'], ['MI', 'Michigan'], ['MN', 'Minnesota'], 
  ['MO', 'Missouri'], ['MS', 'Mississippi'], ['MT', 'Montana'], 
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['NE', 'Nebraska'], 
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], 
  ['NV', 'Nevada'], ['NY', 'New York'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], 
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], 
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], 
  ['TX', 'Texas'], ['UT', 'Utah'], ['VA', 'Virginia'], ['VT', 'Vermont'], 
  ['WA', 'Washington'], ['WI', 'Wisconsin'], ['WV', 'West Virginia'], 
  ['WY', 'Wyoming']
];

const MyProfile = () => {
  const { user } = useContext(AuthContext);

  // We'll try to rely on user from AuthContext first.
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSections, setEditingSections] = useState({
    basic: false,
    contact: false,
    medical: false,
    treatment: false
  });
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: true,
    medical: true,
    treatment: true
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: {
      street: '',
      unit: '',
      city: '',
      state: '',
      zip: ''
    },
    emergencyContact: {
      name: '',
      phone: ''
    },
    allergies: '',
    medicalConditions: '',
    treatmentPreferences: {
      bodyAreas: {}
    }
  });

  // If user is available from AuthContext and we haven't set profile yet, use it
  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData({
        fullName: user.profile?.fullName || '',
        email: user.email || '',
        phoneNumber: user.profile?.phoneNumber || '',
        address: user.profile?.address || {
          street: '',
          unit: '',
          city: '',
          state: '',
          zip: ''
        },
        emergencyContact: user.profile?.emergencyContact || {
          name: '',
          phone: ''
        },
        allergies: user.profile?.allergies || '',
        medicalConditions: user.profile?.medicalConditions || '',
        treatmentPreferences: user.profile?.treatmentPreferences || {
          bodyAreas: {}
        }
      });
      setIsLoading(false);
    } else {
      // If user not available yet in AuthContext, fetch using session cookie
      const fetchProfile = async () => {
        try {
          const response = await fetch('/api/users/profile', {
            method: 'GET',
            credentials: 'include' // use session cookie, no Bearer token
          });
      
          if (response.ok) {
            const userData = await response.json();
            setProfile(userData);
            
            setFormData({
              fullName: userData.profile?.fullName || '',
              email: userData.email || '',
              phoneNumber: userData.profile?.phoneNumber || '',
              address: userData.profile?.address || {
                street: '',
                unit: '',
                city: '',
                state: '',
                zip: ''
              },
              emergencyContact: userData.profile?.emergencyContact || {
                name: '',
                phone: ''
              },
              allergies: userData.profile?.allergies || '',
              medicalConditions: userData.profile?.medicalConditions || '',
              treatmentPreferences: userData.profile?.treatmentPreferences || {
                bodyAreas: {}
              }
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    console.log('Profile updated:', profile);
    console.log('FormData updated:', formData);
  }, [profile, formData]);

  const handleSectionEdit = (section) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleSectionUpdate = async (section, data = null) => {
    try {
      let updateData = {};
      
      switch(section) {
        case 'basic':
          updateData = {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber
          };
          break;
        case 'contact':
          updateData = {
            address: formData.address
          };
          break;
        case 'medical':
          updateData = {
            allergies: formData.allergies,
            medicalConditions: formData.medicalConditions
          };
          break;
        case 'treatment':
          updateData = data ? {
            treatmentPreferences: data
          } : {
            treatmentPreferences: formData.treatmentPreferences
          };
          break;
        default:
          break;
      }
  
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // again, use session cookie, not token
        body: JSON.stringify(updateData)
      });
  
      if (response.ok) {
        const updatedData = await response.json();
        setProfile(prev => ({
          ...prev,
          ...updatedData.user
        }));
        setEditingSections(prev => ({
          ...prev,
          [section]: false
        }));

        // Re-sync formData from updatedData if needed
        const u = updatedData.user;        
        setFormData({
          fullName: u.profile?.fullName || '',
          email: u.email || '',
          phoneNumber: u.profile?.phoneNumber || '',
          address: u.profile?.address || {
            street: '',
            unit: '',
            city: '',
            state: '',
            zip: ''
          },
          emergencyContact: u.profile?.emergencyContact || {
            name: '',
            phone: ''
          },
          allergies: u.profile?.allergies || '',
          medicalConditions: u.profile?.medicalConditions || '',
          treatmentPreferences: u.profile?.treatmentPreferences || {
            bodyAreas: {}
          }
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      // You might add error feedback to the user here
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  console.log('Profile in MyProfile:', profile);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>
      
      {/* Basic Information Section */}
      <ProfileSection
        title="Basic Information"
        isEditing={editingSections.basic}
        isExpanded={expandedSections.basic}
        onEdit={() => handleSectionEdit('basic')}
        onToggle={() => handleSectionToggle('basic')}
      >
        <EditModeTransition
          isEditing={editingSections.basic}
          viewComponent={
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Full Name</span>
                <span className="text-slate-900 font-medium">{formData.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-900">{formData.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Phone Number</span>
                <span className="text-slate-900">{formData.phoneNumber}</span>
              </div>
            </div>
          }
          editComponent={
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSectionUpdate('basic');
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange(e, 'basic')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange(e, 'basic')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => handleSectionEdit('basic')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#387c7e] text-white rounded-md hover:bg-[#2c5f60]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          }
        />
      </ProfileSection>

      {/* Contact Information Section */}
      <ProfileSection
        title="Contact Information"
        isEditing={editingSections.contact}
        isExpanded={expandedSections.contact}
        onEdit={() => handleSectionEdit('contact')}
        onToggle={() => handleSectionToggle('contact')}
      >
        <EditModeTransition
          isEditing={editingSections.contact}
          viewComponent={
            <div className="space-y-4">
              <div className="py-2 border-b border-slate-100">
                <div className="text-slate-500 mb-1">Address</div>
                <div className="text-slate-900">
                  {formData.address.street ? (
                    <>
                      {formData.address.street}
                      {formData.address.unit && `, Unit ${formData.address.unit}`}
                      <br />
                      {formData.address.city && formData.address.state ? (
                        `${formData.address.city}, ${formData.address.state} ${formData.address.zip}`
                      ) : (
                        <span className="text-slate-400 italic">Incomplete address</span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 italic">No address provided</span>
                  )}
                </div>
              </div>
            </div>
          }
          editComponent={
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSectionUpdate('contact');
            }} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-600">Address</h3>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange(e, 'contact')}
                    placeholder="Street Address"
                    className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                  />
                  <input
                    type="text"
                    name="address.unit"
                    value={formData.address.unit}
                    onChange={(e) => handleInputChange(e, 'contact')}
                    placeholder="Apt, Suite, Unit (optional)"
                    className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange(e, 'contact')}
                      placeholder="City"
                      className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                    />
                    <select
                      name="address.state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange(e, 'contact')}
                      className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                    >
                      <option value="">State</option>
                      {STATES.map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="address.zip"
                      value={formData.address.zip}
                      onChange={(e) => handleInputChange(e, 'contact')}
                      placeholder="ZIP"
                      maxLength="5"
                      pattern="[0-9]{5}"
                      className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => handleSectionEdit('contact')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#387c7e] text-white rounded-md hover:bg-[#2c5f60]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          }
        />
      </ProfileSection>

      {/* Medical Information Section */}
      <ProfileSection
        title="Medical Information"
        isEditing={editingSections.medical}
        isExpanded={expandedSections.medical}
        onEdit={() => handleSectionEdit('medical')}
        onToggle={() => handleSectionToggle('medical')}
      >
        <EditModeTransition
          isEditing={editingSections.medical}
          viewComponent={
            <div className="space-y-4">
              <div className="py-2 border-b border-slate-100">
                <div className="text-slate-500 mb-1">Allergies</div>
                <div className="text-slate-900">{formData.allergies || 'None reported'}</div>
              </div>
              <div className="py-2 border-b border-slate-100">
                <div className="text-slate-500 mb-1">Medical Conditions</div>
                <div className="text-slate-900">{formData.medicalConditions || 'None reported'}</div>
              </div>
            </div>
          }
          editComponent={
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSectionUpdate('medical');
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Allergies
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange(e, 'medical')}
                  placeholder="List any allergies"
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={(e) => handleInputChange(e, 'medical')}
                  placeholder="List any medical conditions or concerns"
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => handleSectionEdit('medical')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#387c7e] text-white rounded-md hover:bg-[#2c5f60]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          }
        />
      </ProfileSection>

      {/* Treatment Preferences Section */}
      <div className="mt-8">
  <h2 className="text-xl font-bold text-slate-900 mb-4">Treatment Preferences (Debug Mode)</h2>
  {profile?.profile?.treatmentPreferences?.bodyAreas ? (
    Object.entries(profile.profile.treatmentPreferences.bodyAreas).map(([areaId, areaData]) => (
      <div key={areaId} className="border p-4 rounded mb-4">
        <h4 className="font-medium text-slate-900 capitalize">{areaId.replace(/_/g, ' ')}</h4>
        <p className="text-sm text-slate-500">Pressure: {areaData.pressure ?? 50}</p>
        <p className="text-sm text-slate-500">Note: {areaData.note ?? 'No note provided'}</p>
        <p className="text-sm text-slate-500">
          Conditions: {areaData.conditions && areaData.conditions.length > 0 ? areaData.conditions.join(', ') : 'None'}
        </p>
        <p className="text-sm text-slate-500">
          Patterns: {areaData.patterns && areaData.patterns.length > 0 ? areaData.patterns.join(', ') : 'None'}
        </p>
      </div>
    ))
  ) : (
    <p className="text-sm text-slate-500 italic">No treatment preferences set.</p>
  )}
</div>


    </div>
  );
};

export default MyProfile;