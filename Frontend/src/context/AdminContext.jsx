import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [adminData, setAdminData] = useState({
    users: []
  });

  const updateUsers = (users) => {
    setAdminData(prev => ({ ...prev, users }));
  };

  return (
    <AdminContext.Provider value={{
      adminData,
      updateUsers
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;