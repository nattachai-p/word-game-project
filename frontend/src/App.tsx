import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GamePage from './pages/GamePage'; // 1. Import หน้าเกมเข้ามา
import AdminUsers from './pages/AdminUsers'; // 2. Import หน้า Admin Settings เข้ามา
import AdminWordDB from './pages/AdminWordDB'; // 3. Import หน้า Admin Word Database เข้ามา
import Dashboard from './pages/Dashboard';
import VocabularyPage from './pages/VocabularyPage';
import PracticePage from './pages/PracticePage'; // 5. Import หน้า Practice เข้ามา
import LogPage from './pages/LogPage';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';



function App() {
  return (
    <Router>
      <Routes>
        {/* หน้าแรกให้วิ่งไป Login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* เส้นทางสาธารณะ (ไม่ต้อง Login) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* หน้าที่ต้อง Login ก่อน */}
        <Route path="/game" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/vocabulary" element={<ProtectedRoute><VocabularyPage /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
        {/* หน้าฐานข้อมูลคำศัพท์ (ต้อง Login) */}
        <Route path="/admin/word-db" element={<ProtectedRoute><AdminWordDB /></ProtectedRoute>} />

        {/* หน้าเฉพาะ Admin เท่านั้น */}
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/log" element={<AdminRoute><LogPage /></AdminRoute>} />

        {/* กันหลงทาง: path แปลก ๆ เด้งกลับ login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;