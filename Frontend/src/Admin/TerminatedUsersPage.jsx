import React, { useState, useEffect } from 'react';
import { getAllUsers, getSuccessfulPayments } from '../utils/api';
import TerminatedUsers from './TerminatedUsers';

const TerminatedUsersPage = () => {
  const [terminatedUsers, setTerminatedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTerminatedUsers = async () => {
    try {
      setIsLoading(true);
      const usersRes = await getAllUsers();
      const users = usersRes.users || [];
      
      // Filter terminated users
      const terminated = users.filter(user => 
        (user.accountStatus || '').toLowerCase() === 'terminated'
      );
      
      setTerminatedUsers(terminated);
    } catch (error) {
      console.error('Failed to fetch terminated users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminatedUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        <TerminatedUsers users={terminatedUsers} onReinstate={fetchTerminatedUsers} />
      </div>
    </div>
  );
};

export default TerminatedUsersPage;
