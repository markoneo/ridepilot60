import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Key, Eye, EyeOff } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import SettingsLayout from './SettingsLayout';

export default function Drivers() {
  const navigate = useNavigate();
  const { drivers, addDriver, deleteDriver, updateDriver } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<string | null>(null);
  const [showPins, setShowPins] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license: '',
    status: 'available' as const,
    pin: '1234', // Default PIN
  });

  const togglePinVisibility = (driverId: string) => {
    setShowPins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(driverId)) {
        newSet.delete(driverId);
      } else {
        newSet.add(driverId);
      }
      return newSet;
    });
  };

  const handleEdit = (driver: any) => {
    setFormData({
      name: driver.name,
      phone: driver.phone,
      license: driver.license,
      status: driver.status,
      pin: driver.pin || '1234',
    });
    setEditingDriver(driver.id);
    setShowForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDriver) {
      updateDriver(editingDriver, formData);
      setEditingDriver(null);
    }
    setFormData({ name: '', phone: '', license: '', status: 'available', pin: '1234' });
    setShowForm(false);
  };

  const handleDeleteDriver = (id: string) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      deleteDriver(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDriver(formData);
    setFormData({ name: '', phone: '', license: '', status: 'available', pin: '1234' });
    setShowForm(false);
  };

  const copyDriverId = (license: string) => {
    navigator.clipboard.writeText(license);
    // You could add a toast notification here
  };

  return (
    <SettingsLayout 
      title="Drivers" 
      onAdd={() => setShowForm(true)}
      addButtonText="Add Driver"
    >
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </h3>
            <form onSubmit={editingDriver ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number / Driver ID
                  <span className="text-xs text-gray-500 block mt-1">
                    This will be used as the Driver ID for the driver portal login
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., DRV001, LICENSE123"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Portal PIN
                  <span className="text-xs text-gray-500 block mt-1">
                    4-6 digit PIN for driver portal access
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="1234"
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'busy' | 'offline' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  {editingDriver ? 'Update Driver' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portal PIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {driver.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                        {driver.license}
                      </code>
                      <button
                        onClick={() => copyDriverId(driver.license)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        title="Copy Driver ID"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Used for driver portal login
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                        {showPins.has(driver.id) ? (driver.pin || '1234') : '••••'}
                      </code>
                      <button
                        onClick={() => togglePinVisibility(driver.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title={showPins.has(driver.id) ? "Hide PIN" : "Show PIN"}
                      >
                        {showPins.has(driver.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${driver.status === 'available' ? 'bg-green-100 text-green-800' : 
                        driver.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                    <button
                      onClick={() => handleEdit(driver)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(driver.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {drivers.length === 0 && (
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new driver.
              </p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <Key className="w-5 h-5 text-blue-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Driver Portal Access</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  Drivers can access their assigned trips at: <strong>/driver</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Driver ID: Use the license number shown above</li>
                  <li>PIN: 4-6 digit number for secure access</li>
                  <li>Each driver gets their own isolated view with only their assigned trips</li>
                  <li>Drivers can view trip details, contact clients, and mark trips as complete</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </SettingsLayout>
  );
}