// import React, { useState, useContext, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { AuthContext } from '../AuthContext';

// const MobileMenu = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const { user, logout } = useContext(AuthContext);
//   const navigate = useNavigate();

//   useEffect(() => {
//     console.log('User state in MobileMenu:', user);
//   }, [user]);

//   const toggleMenu = () => {
//     setIsOpen(!isOpen);
//   };

//   const handleLogout = () => {
//     console.log('Logout initiated');
//     logout();
//     toggleMenu();
//     navigate('/login');
//   };

//   return (
//     <>
//       <button
//         onClick={toggleMenu}
//         className="fixed top-4 left-4 z-50 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
//       >
//         Menu
//       </button>
//       <div className={`fixed top-0 left-0 w-64 h-full bg-gray-800 z-40 transform transition-transform duration-300 ease-in-out ${
//         isOpen ? 'translate-x-0' : '-translate-x-full'
//       }`}>
//         <nav className="mt-16">
//           <ul className="space-y-4 p-4">
//             <li>
//               <Link to="/" onClick={toggleMenu} className="text-white hover:text-gray-300">Home</Link>
//             </li>
//             {user ? (
//               <>
//                 <li>
//                   <Link to="/my-profile" onClick={toggleMenu} className="text-white hover:text-gray-300">My Profile</Link>
//                 </li>
//                 <li>
//                   <Link to="/book" onClick={toggleMenu} className="text-white hover:text-gray-300">Book Massage</Link>
//                 </li>
//                 <li>
//                   <Link to="/bookings" onClick={toggleMenu} className="text-white hover:text-gray-300">My Bookings</Link>
//                 </li>
//                 <li>
//                   <button onClick={handleLogout} className="text-white hover:text-gray-300">Logout</button>
//                 </li>
//               </>
//             ) : (
//               <>
//                 <li>
//                   <Link to="/signup" onClick={toggleMenu} className="text-white hover:text-gray-300">Sign Up</Link>
//                 </li>
//                 <li>
//                   <Link to="/login" onClick={toggleMenu} className="text-white hover:text-gray-300">Login</Link>
//                 </li>
//               </>
//             )}
//           </ul>
//         </nav>
//       </div>
//     </>
//   );
// };

// export default MobileMenu;

import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Add the following useEffect block here for debugging the user state
  useEffect(() => {
    console.log('User state in MobileMenu:', user); // Log user state for debugging
  }, [user]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    toggleMenu();
    navigate('/login');
  };

  return (
    <>
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
      >
        <span className="sr-only">Open main menu</span>
        <div className="w-6 h-6 relative">
          <span 
            className={`block absolute h-0.5 w-6 bg-gray-800 transform transition duration-300 ease-in-out ${
              isOpen ? 'rotate-45' : '-translate-y-2'
            }`}
          />
          <span 
            className={`block absolute h-0.5 w-6 bg-gray-800 transform transition duration-300 ease-in-out ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span 
            className={`block absolute h-0.5 w-6 bg-gray-800 transform transition duration-300 ease-in-out ${
              isOpen ? '-rotate-45' : 'translate-y-2'
            }`}
          />
        </div>
      </button>
      <div 
        className={`fixed top-0 left-0 w-64 h-full bg-gray-800 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="mt-16">
          <ul className="space-y-4 p-4">
            <li>
              <Link to="/" onClick={toggleMenu} className="text-white hover:text-gray-300">Home</Link>
            </li>
            {user ? (
              user.isAdmin ? (
                <>
                  <li>
                    <Link to="/admin" onClick={toggleMenu} className="text-white hover:text-gray-300">Admin Dashboard</Link>
                  </li>
                  <li>
                    <Link to="/admin/appointments" onClick={toggleMenu} className="text-white hover:text-gray-300">Manage Appointments</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/my-profile" onClick={toggleMenu} className="text-white hover:text-gray-300">My Profile</Link>
                  </li>
                  <li>
                    <Link to="/book" onClick={toggleMenu} className="text-white hover:text-gray-300">Book Massage</Link>
                  </li>
                  <li>
                    <Link to="/bookings" onClick={toggleMenu} className="text-white hover:text-gray-300">My Bookings</Link>
                  </li>
                </>
              )
            ) : (
              <>
                <li>
                  <Link to="/signup" onClick={toggleMenu} className="text-white hover:text-gray-300">Sign Up</Link>
                </li>
                <li>
                  <Link to="/login" onClick={toggleMenu} className="text-white hover:text-gray-300">Login</Link>
                </li>
              </>
            )}
            {user && (
              <li>
                <button onClick={handleLogout} className="text-white hover:text-gray-300">Logout</button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileMenu;