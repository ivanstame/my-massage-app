import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios'; 
import ProviderConfirmationModal from './ProviderConfirmationModal';

const ProgressIndicator = ({ currentStep }) => (
  <div className="mb-8 w-full max-w-md">
    <div className="flex justify-between mb-2">
      <div className={`text-sm font-medium ${currentStep >= 1 ? 'text-[#387c7e]' : 'text-slate-400'}`}>
        Account
      </div>
      <div className={`text-sm font-medium ${currentStep >= 2 ? 'text-[#387c7e]' : 'text-slate-400'}`}>
        Profile
      </div>
      <div className={`text-sm font-medium ${currentStep >= 3 ? 'text-[#387c7e]' : 'text-slate-400'}`}>
        Preferences
      </div>
    </div>
    <div className="h-1 bg-slate-100 rounded-full">
      <div 
        className="h-full bg-[#387c7e] rounded-full transition-all duration-500"
        style={{ width: `${(currentStep / 3) * 100}%` }}
      />
    </div>
  </div>
);

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    accountType: '',  // 'PROVIDER' or 'CLIENT'
    invitationToken: ''  // for invited clients
  });

  const [step, setStep] = useState(1);  // 1: Type Selection, 2: Details
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProviderConfirmation, setShowProviderConfirmation] = useState(false);
  const [verifiedProvider, setVerifiedProvider] = useState(null);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/register', 
        {
          email: formData.email,
          password: formData.password,
          accountType: formData.accountType,
          invitationToken: formData.invitationToken,
        },
        {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Registration response:', response.data);

      if (response.data.user) {
        localStorage.setItem('registrationStep', '1');
        if (response.data.user.accountType === 'CLIENT') {
          setVerifiedProvider(response.data.provider);
          setShowProviderConfirmation(true);
        } else {
          setUser({ ...response.data.user, registrationStep: 1 });
          navigate('/profile-setup');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-medium text-slate-900">Choose Account Type</h3>
        <p className="mt-2 text-slate-500">How will you be using our platform?</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => {
            setFormData(prev => ({ ...prev, accountType: 'PROVIDER' }));
            setStep(2);
          }}
          className="p-6 border-2 rounded-lg hover:border-[#387c7e] 
            hover:bg-[#387c7e]/5 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
        >
          <h4 className="text-lg font-medium text-slate-900">Massage Provider</h4>
          <p className="mt-2 text-slate-600">
            I provide massage services and want to manage my client bookings
          </p>
        </button>

        <button
          onClick={() => {
            setFormData(prev => ({ ...prev, accountType: 'CLIENT' }));
            setStep(2);
          }}
          className="p-6 border-2 rounded-lg hover:border-[#387c7e] 
            hover:bg-[#387c7e]/5 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
        >
          <h4 className="text-lg font-medium text-slate-900">Client</h4>
          <p className="mt-2 text-slate-600">
            I have an invitation from my massage therapist
          </p>
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-2">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-200 rounded-md 
            focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
          placeholder="Enter your email"
        />
      </div>


      {formData.accountType === 'CLIENT' && (
        <div>
          <label htmlFor="invitationToken" className="block text-sm font-medium text-slate-600 mb-2">
            Invitation Code
          </label>
          <input
            id="invitationToken"
            name="invitationToken"
            type="text"
            required
            value={formData.invitationToken}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-md 
              focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
            placeholder="Enter your invitation code"
          />
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-200 rounded-md 
            focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
          placeholder="Create a password"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-200 rounded-md 
            focus:outline-none focus:ring-2 focus:ring-[#387c7e]"
          placeholder="Confirm your password"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-md bg-[#387c7e] hover:bg-[#2c5f60] 
          text-white font-medium transition duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#387c7e]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating Account...' : 'Continue'}
      </button>
    </form>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-8">
        <img 
          src="/imgs/logo.png"
          alt="Massage by Ivan" 
          className="h-32 w-auto"
        />
      </div>

      <div className="w-full max-w-md">
        {step === 1 ? (
          <div className="bg-white p-8 rounded-lg shadow-md">
            {renderTypeSelection()}
          </div>
        ) : (
          <>
            <ProgressIndicator currentStep={1} />
            
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-normal text-center text-slate-700 mb-2">
                {formData.accountType === 'PROVIDER' ? 'Create Provider Account' : 'Create Client Account'}
              </h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <p>{error}</p>
                </div>
              )}

              {renderForm()}
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <Link 
            to="/login" 
            className="text-sm text-slate-600 hover:text-slate-800 transition"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>

      {showProviderConfirmation && verifiedProvider && (
        <ProviderConfirmationModal
          provider={verifiedProvider}
          onConfirm={() => {
            setShowProviderConfirmation(false);
            setUser({ ...verifiedProvider, registrationStep: 1 });
            navigate('/profile-setup');
          }}
          onCancel={() => {
            setShowProviderConfirmation(false);
            setError('Registration cancelled. Please try again or contact support.');
          }}
        />
      )}
    </div>
  );
};

export default SignUp;
