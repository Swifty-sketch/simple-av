import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button className="close-btn" onClick={toggleSidebar}>
          ×
        </button>
      </div>
      <div className="avatar">AV</div>
      <div className="nav-links">
        <Link to="/" onClick={toggleSidebar}>
          <span>Insight</span>
        </Link>
        <Link to="#" onClick={toggleSidebar}>
          <span>Search</span>
        </Link>
        <Link to="/portfolio" onClick={toggleSidebar}>
          <span>My Portfolio</span>
        </Link>
        <Link to="#" onClick={toggleSidebar}>
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;