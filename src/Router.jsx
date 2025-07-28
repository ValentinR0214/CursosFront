import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- COMPONENTES ---
// Públicos y de Autenticación
// (Recomendación: Mueve CourseCatalog y CoursePreview a una carpeta "Public")
import CourseCatalog from './components/Public/CourseCatalog.jsx';
import CoursePreview from './components/Public/CoursePreview.jsx';
import Login from './components/Auth/Login.jsx';
import Register from './components/Auth/Register.jsx';

// NavBars
import NavBar from './components/NavBar.jsx';
import PublicNavBar from './components/PublicNavbar.jsx'; // Corregida posible capitalización

// Privados (importaciones de todas tus páginas)
import UserProfile from './components/Profile/UserProfile.jsx';
import RegisterTeacher from './components/Auth/RegisterTeacher.jsx';
import UserManagement from './components/Admin/UserManagement.jsx';
import CategoryManagement from './components/Admin/CategoryManagement.jsx';
import CourseManagement from './components/Teacher/CourseManagement.jsx';
import CourseContentEditor from './components/Teacher/CourseContentEditor.jsx';
import MyCourses from './components/Student/MyCourses.jsx';
import CourseViewer from './components/Student/CourseViewer.jsx';
import Test from './components/Test/Test.jsx';
import EnrolledStudents from './components/Teacher/EnrolledStudents.jsx';

// Utilidades
import { decryptData } from './utils/security.js';

// --- COMPONENTE DE AYUDA PARA LA RUTA RAÍZ ---
const LandingRedirect = () => {
  const encryptedSessionData = localStorage.getItem('user');
  const session = encryptedSessionData ? decryptData(encryptedSessionData) : null;
  const role = session?.user?.rol?.roleEnum || '';

  if (!session) {
    return <CourseCatalog />;
  }

  switch (role) {
    case 'ADMIN':
      return <Navigate to="/admin/users" replace />;
    case 'TEACHER':
      return <Navigate to="/teacher/courses" replace />;
    case 'STUDENT':
      return <Navigate to="/student/my-courses" replace />;
    default:
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
  }
};

function Router() {
  const encryptedSessionData = localStorage.getItem('user');
  const session = encryptedSessionData ? decryptData(encryptedSessionData) : null;
  const role = session?.user?.rol?.roleEnum || '';

  return (
    <>
      {session ? <NavBar /> : <PublicNavBar />}
      
      <Routes>
        {/* --- RUTA RAÍZ --- */}
        <Route path="/" element={<LandingRedirect />} />
        
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/course/:courseId/preview" element={<CoursePreview />} />

        {/* --- RUTAS DE AUTENTICACIÓN (SOLO SIN SESIÓN) --- */}
        {!session && (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </>
        )}

        {/* --- RUTAS PRIVADAS (SOLO CON SESIÓN) --- */}
        {session && (
          <>
            <Route path="/profile" element={<UserProfile />} />
            
            {role === 'ADMIN' && (
              <>
                <Route path="/registerteacher" element={<RegisterTeacher />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/categories" element={<CategoryManagement />} />
              </>
            )}

            {role === 'TEACHER' && (
              <>
                <Route path="/teacher/courses" element={<CourseManagement />} />
                <Route path="/teacher/course/:courseId/content" element={<CourseContentEditor />} />
                <Route path="/teacher/course/:courseId/students" element={<EnrolledStudents />} />
              </>
            )}

            {role === 'STUDENT' && (
              <>
                <Route path="/student/my-courses" element={<MyCourses />} />
                <Route path="/student/course/:courseId/view" element={<CourseViewer />} />
                <Route path="/test" element={<Test />} />
              </>
            )}
          </>
        )}

        {/* Redirección final para cualquier ruta no encontrada */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default Router;