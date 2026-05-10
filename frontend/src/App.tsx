import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* หน้าแรกให้วิ่งไป Login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* เส้นทางคุมหน้าตา */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* หน้าเกมในอนาคต */}
        <Route path="/game" element={<div className="text-white text-center mt-20 text-4xl font-bold">GAME STAGE COMING SOON...</div>} />
      </Routes>
    </Router>
  );
}

export default App;