import React, { useState } from 'react';
import { Car, Lock, User, AlertCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface DriverLoginProps {
  onDriverLogin: (driverId: string, driverName: string, driverUuid: string) => void;
}

export default function DriverLogin({ onDriverLogin }: DriverLoginProps) {
  const [driverId, setDriverId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { drivers } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driverId.trim() || !pin.trim()) {
      setError('Please enter both Driver ID and PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find the driver by license number (Driver ID) and verify PIN
      const driver = drivers.find(d => 
        d.license.toLowerCase() === driverId.toLowerCase() && 
        (d.pin || '1234') === pin
      );

      if (driver) {
        onDriverLogin(driverId, driver.name, driver.id);
      } else {
        setError('Invalid Driver ID or PIN. Please check your credentials.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <Car className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Driver Portal</h1>
          <p className="text-blue-200">Access your assigned trips</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center text-sm">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your driver ID (license number)"
                  autoComplete="username"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use your license number as your Driver ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your PIN"
                  autoComplete="current-password"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Having trouble? Contact your dispatcher
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Demo: Use any license number from the driver list with PIN: 1234
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-200 text-sm">
            RidePilot Driver Portal v1.0
          </p>
        </div>
      </div>
    </div>
  );
}