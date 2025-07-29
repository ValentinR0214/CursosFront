import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';
import { ProgressSpinner } from 'primereact/progressspinner';

const API_URL = 'http://localhost:8080/api/courses';

const EnrolledStudents = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [students, setStudents] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const fetchCourseDetails = axios.get(`${API_URL}/findOne/${courseId}`, { headers: getAuthHeader() });
    const fetchStudents = axios.post(`${API_URL}/view-students`, { courseId }, { headers: getAuthHeader() });

    Promise.all([fetchCourseDetails, fetchStudents])
      .then(([courseResponse, studentsResponse]) => {
        setCourseName(courseResponse.data.result.name);
        setStudents(studentsResponse.data.result || []);
      })
      .catch(err => {
        showToast('error', 'Error', 'No se pudieron cargar los datos de los estudiantes.');
        navigate('/teacher/courses');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId, navigate, showToast]);
  
  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>Estudiantes Inscritos en: <strong>{courseName}</strong></span>
      <Button label="Volver a Mis Cursos" icon="pi pi-arrow-left" className="p-button-text" onClick={() => navigate('/teacher/courses')} />
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <Card title={header}>
        <DataTable value={students} paginator rows={10} emptyMessage="Aún no hay estudiantes inscritos en este curso.">
          <Column field="id" header="ID Estudiante" sortable />
          <Column field="name" header="Nombre" sortable />
          <Column field="lastName" header="Apellido" sortable />
          <Column field="email" header="Correo Electrónico" sortable />
        </DataTable>
      </Card>
    </div>
  );
};

export default EnrolledStudents;