import React, { useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';

const StateDebugger = () => {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    console.log('StateDebugger: User state changed:', user);
    console.log('StateDebugger: Loading state:', loading);
  }, [user, loading]);

  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, background: 'white', padding: '10px', border: '1px solid black' }}>
      <h3>Auth State:</h3>
      <pre>{JSON.stringify({ user, loading }, null, 2)}</pre>
    </div>
  );
};

export default StateDebugger;