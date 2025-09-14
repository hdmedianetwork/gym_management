import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [showBranchOverlay, setShowBranchOverlay] = useState(false);
  const [adminData, setAdminData] = useState({
    users: []
  });

  const openBranchOverlay = () => setShowBranchOverlay(true);
  const closeBranchOverlay = () => setShowBranchOverlay(false);

  const updateUsers = (users) => {
    setAdminData(prev => ({ ...prev, users }));
  };

  return (
    <AdminContext.Provider value={{
      showBranchOverlay,
      openBranchOverlay,
      closeBranchOverlay,
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