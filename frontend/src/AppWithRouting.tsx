import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import App from './App';
import { Dashboard } from './pages/Dashboard';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="bg-gray-800 text-white p-2">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              location.pathname === '/' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            💬 Agentic Chat
          </Link>
          <Link 
            to="/dashboard" 
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              location.pathname === '/dashboard' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            🛡️ Scudo Dashboard
          </Link>
        </div>
        <div className="text-xs text-gray-400">
          {location.pathname === '/' ? 'Promotion Engine' : 'Customer Intelligence'}
        </div>
      </div>
    </nav>
  );
};

function AppWithRouting() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default AppWithRouting;
