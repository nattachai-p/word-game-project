import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

// ─────────────────────────────────────────────
// ProtectedRoute: ต้อง Login (มี token) ถึงจะเข้าได้
// ไม่มี token → เด้งไปหน้า /login
// ─────────────────────────────────────────────
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─────────────────────────────────────────────
// AdminRoute: ต้องเป็น admin เท่านั้น
// ไม่มี token → /login ; ไม่ใช่ admin → /game
// ─────────────────────────────────────────────
export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/game" replace />;
  return <>{children}</>;
};
