import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { USERS } from '../constants';

const Login: React.FC = () => {
  const { login } = useAuth();
  // Fix: Replaced useInventory with a direct import of the USERS constant, as user data is not part of the inventory context.
  const users = USERS;
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const userToLogin = users.find(u => u.id.toString() === selectedUserId);
    if (userToLogin) {
      // Simulate network request
      setTimeout(() => {
        login(userToLogin);
        setIsLoading(false);
      }, 500);
    } else {
        alert("Could not find selected user.")
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 space-y-8 bg-card rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-text-primary">
            StockSense
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="user-select" className="sr-only">Select User</label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
