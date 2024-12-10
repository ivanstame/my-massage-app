// import React, { createContext, useState, useEffect } from 'react';
// import axios from 'axios';

// export const AuthContext = createContext(null);

// // Configure axios with more specific settings
// axios.defaults.withCredentials = true;
// axios.defaults.headers.common['Accept'] = 'application/json';
// axios.defaults.headers.post['Content-Type'] = 'application/json';

// // Keep track of current hostname for debugging
// const currentHost = window.location.hostname;
// const baseURL = currentHost === 'localhost' 
//   ? `http://localhost:5000`
//   : `http://192.168.1.26:5000`;  // Your computer's IP
// axios.defaults.baseURL = baseURL;

// console.log('Auth Context initialized with:', { baseURL, currentHost });

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const checkAuth = async () => {
//     try {
//       console.log('Checking auth status...');
//       const response = await axios.get('/api/auth/check-session', {
//         // Explicitly set these for the check-session request
//         withCredentials: true,
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json'
//         }
//       });
      
//       console.log('Auth check response:', response.data);
      
//       if (response.data.isAuthenticated) {
//         setUser(response.data.user);
//       }
//     } catch (error) {
//       // More detailed error logging
//       console.error('Auth check error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status,
//         headers: error.response?.headers
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   // Explicit login function for debugging
//   const login = async (email, password) => {
//     try {
//       console.log('Attempting login with:', { email, baseURL });
      
//       const response = await axios.post('/api/auth/login', 
//         { email, password },
//         {
//           withCredentials: true,
//           headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       console.log('Login response:', response.data);
      
//       if (response.data.user) {
//         setUser(response.data.user);
//         return { success: true };
//       }
//     } catch (error) {
//       console.error('Login error:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status,
//         headers: error.response?.headers
//       });
//       throw error.response?.data?.message || 'Login failed';
//     }
//     return { success: false };
//   };

//   return (
//     <AuthContext.Provider value={{ 
//       user, 
//       loading, 
//       setUser,
//       login, // Expose the login function
//       checkAuth // Expose for manual refresh if needed
//     }}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';

const currentHost = window.location.hostname;
const baseURL = currentHost === 'localhost' 
  ? `http://localhost:5000`
  : `http://192.168.1.26:5000`;

axios.defaults.baseURL = baseURL;

console.log('Auth Context initialized with:', { baseURL, currentHost });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log('Checking auth status...');
      const response = await axios.get('/api/auth/check-session', {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Auth check response:', response.data);
      
      if (response.data.isAuthenticated) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, baseURL });
      
      const response = await axios.post('/api/auth/login', 
        { email, password },
        {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data);
      
      if (response.data.user) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error.response?.data?.message || 'Login failed';
    }
    return { success: false };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      setUser,
      login,
      checkAuth
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
