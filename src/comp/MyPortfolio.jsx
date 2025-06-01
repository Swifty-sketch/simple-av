import React, { useState } from 'react';
import Sidebar from './Sidebar'; // Adjust path as needed

const MyPortfolio = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="portfolio-page">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
    </div>
  );
};

export default MyPortfolio;