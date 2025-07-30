import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';

const API_BASE_URL = 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api`;

const CourseViewer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [course, setCourse] = useState(null);
  const [content, setContent] = useState({ modules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        // Usamos Promise.all para cargar datos en paralelo y mejorar el rendimiento
        const [courseResponse, contentResponse] = await Promise.all([
          axios.get(`${API_URL}/courses/findOne/${courseId}`, { headers: getAuthHeader() }),
          // La petición de contenido ahora apunta a la estructura correcta
          axios.get(`${API_URL}/content/get/${courseId}`, { headers: getAuthHeader() })
        ]);

        setCourse(courseResponse.data.result);

        // Leemos la estructura de contenido que guarda el editor
        const loadedContent = contentResponse.data?.result?.content || { modules: [] };
        setContent({
          modules: Array.isArray(loadedContent.modules) ? loadedContent.modules : []
        });

      } catch (err) {
        console.error('Error al cargar los datos del curso:', err);
        // Si el contenido no se encuentra (404), no es un error fatal, 
        // simplemente significa que el curso está vacío.
        if (err.response?.status === 404 && err.config.url.includes('/content/')) {
          setContent({ modules: [] }); 
        } else {
          setError('No se pudo cargar el curso o no tienes permiso para verlo.');
          showToast('error', 'Error', 'No se pudo cargar el curso o no tienes permiso.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, showToast]);

  // Función mejorada para renderizar el contenido de la lección
  const renderLessonContent = (lesson) => {
    switch (lesson.type) {
      case 'video':
        // Expresión regular robusta para extraer el ID de YouTube de varios formatos de URL
        const videoIdMatch = lesson.url?.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        
        if (videoId) {
          return (
            <div className="video-responsive">
              <iframe 
                src={`https://www.youtube.com/embed/${videoId}`} 
                title={lesson.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          );
        }
        // Fallback si la URL no es de YouTube o es inválida
        return <p><a href={lesson.url} target="_blank" rel="noopener noreferrer">Ver recurso externo</a></p>;
      
      case 'text':
        // 'dangerouslySetInnerHTML' es necesario para renderizar el HTML del Editor de PrimeReact
        return <div dangerouslySetInnerHTML={{ __html: lesson.textContent }} />;
      
      default:
        return <p><em>Tipo de contenido no soportado.</em></p>;
    }
  };

  // --- Renderizado del componente ---

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (error) {
    return (
        <Card title="Error">
            <p>{error}</p>
            <Button label="Volver a Mis Cursos" icon="pi pi-arrow-left" onClick={() => navigate('/student/my-courses')} />
        </Card>
    );
  }

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>Estás viendo: <strong>{course?.name}</strong></span>
      <Button label="Volver a Mis Cursos" icon="pi pi-arrow-left" className="p-button-text" onClick={() => navigate('/student/my-courses')} />
    </div>
  );

  return (
    <div style={{ padding: '2rem' }}>
      {/* Añade este estilo a tu CSS global para que los videos sean responsivos */}
      <style>{`
        .video-responsive {
          overflow: hidden;
          padding-bottom: 56.25%;
          position: relative;
          height: 0;
        }
        .video-responsive iframe {
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          position: absolute;
        }
      `}</style>
      <Card title={header}>
        <p className="p-text-secondary" style={{ marginBottom: '2rem' }}>{course?.description}</p>
        
        <h3>Contenido del Curso</h3>
        {content?.modules?.length > 0 ? (
          <Accordion multiple activeIndex={[0]}>
            {content.modules.map((module, moduleIndex) => (
              <AccordionTab key={module.id || moduleIndex} header={module.title}>
                {module.lessons?.length > 0 ? (
                  module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id || lessonIndex} style={{ padding: '1rem', borderBottom: lessonIndex < module.lessons.length - 1 ? '1px solid #eee' : 'none' }}>
                      <h4>
                        <i className={`pi ${lesson.type === 'video' ? 'pi-youtube' : 'pi-file'}`} style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}/>
                        {lesson.title}
                      </h4>
                      <div style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
                        {renderLessonContent(lesson)}
                      </div>
                    </div>
                  ))
                ) : <p style={{ padding: '1rem' }} className="p-text-secondary">Este módulo no tiene lecciones.</p>}
              </AccordionTab>
            ))}
          </Accordion>
        ) : (
          <p>El contenido de este curso aún no ha sido publicado por el profesor.</p>
        )}
      </Card>
    </div>
  );
};

export default CourseViewer;