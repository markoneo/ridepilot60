import React, { useState } from 'react';
import DriverLogin from './DriverLogin';
import DriverDashboard from './DriverDashboard';

export default function DriverApp() {
  const [driver, setDriver] = useState<{id: string, name: string, uuid: string} | null>(null);

  const handleDriverLogin = (driverId: string, driverName: string, driverUuid: string) => {
    setDriver({ id: driverId, name: driverName, uuid: driverUuid });
  };

  const handleDriverLogout = () => {
    setDriver(null);
  };

  if (!driver) {
    return <DriverLogin onDriverLogin={handleDriverLogin} />;
  }

  return (
    <DriverDashboard 
      driverId={driver.id}
      driverName={driver.name}
      driverUuid={driver.uuid}
      onLogout={handleDriverLogout}
    />
  );
}