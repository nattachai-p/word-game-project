import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GamePage from './pages/GamePage'; // 1. Import หน้าเกมเข้ามา

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
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

export default App;