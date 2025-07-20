import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Test from './components/Test/Test';
import { decryptData } from './utils/security';
import RegisterTeacher from './components/Auth/RegisterTeacher';
import UserManagement from './components/Admin/UserManagement';
import NavBar from './components/NavBar';
import UserProfile from './components/Profile/UserProfile';

function AppRouter() {

  const encryptedSessionData = localStorage.getItem('user');
  const session = encryptedSessionData ? decryptData(encryptedSessionData) : null;
  const role = session?.user?.rol?.roleEnum || '';

  return (
    <>
      {session && <NavBar />}
      
      <Routes>
        {!session && (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />

          </>
        )}
        {session && (
          <Route path="/profile" element={<UserProfile />} />
        )}

        {session && role === 'ADMIN' && (
          <>
            <Route path="/registerteacher" element={<RegisterTeacher />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </>
        )}

        {session && role === 'STUDENT' && (
          <>
            <Route path="/test" element={<Test />} />
            <Route path="*" element={<Navigate to="/test" replace />} />
          </>
        )}

        {session && role === 'TEACHER' && (
          <>

          </>
        )}
      </Routes>
    </>
  );
}

export default AppRouter;