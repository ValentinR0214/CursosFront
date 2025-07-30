//Por si la ruta la hacemos publica

import React, { useState, useEffect, useContext } from 'react'; 
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader, decryptData } from '../../utils/security';

const API_BASE_URL = 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api`;

const CoursePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [course, setCourse] = useState(null);
  const [content, setContent] = useState({ modules: [] }); // Inicializar siempre con un array
  const [loading, setLoading] = useState(true);
  
  const session = decryptData(localStorage.getItem('user'));
  const isStudent = session?.user?.rol?.roleEnum === 'STUDENT';

  useEffect(() => {
    setLoading(true);
    // Para la vista previa, la información del curso es pública, pero el contenido puede ser privado.
    // Esta lógica asume que getAuthHeader() devuelve un objeto vacío si no hay sesión, 
    // permitiendo que el backend decida si el contenido es público.
    Promise.all([
      axios.get(`${API_URL}/courses/findOne/${courseId}`), // Asumimos que es público
      axios.get(`${API_URL}/content/get/${courseId}`, { headers: getAuthHeader() }) 
    ]).then(([courseResponse, contentResponse]) => {
      setCourse(courseResponse.data.result);
      // Leemos la estructura correcta que guarda el editor
      const loadedContent = contentResponse.data.result?.content || { modules: [] };
      setContent({
        modules: Array.isArray(loadedContent.modules) ? loadedContent.modules : []
      });
    }).catch(() => {
      showToast('error', 'Error', 'No se pudo cargar la vista previa del curso.');
      navigate('/');
    }).finally(() => {
      setLoading(false);
    });
  }, [courseId, navigate, showToast]);

  const handleEnroll = () => {
    if (!session || !isStudent) {
      showToast('info', 'Acción Requerida', 'Por favor, inicia sesión o crea una cuenta para inscribirte.');
      // Redirige a login, y tras el login exitoso, al visor del curso.
      const redirectUrl = `/student/course/${courseId}/view`;
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }
    
    // El payload debe coincidir con lo que espera el backend.
    // Si tu @RequestBody es un DTO, usa { courseId: courseId }
    axios.post(`${API_URL}/courses/enroll`, { courseId: Number(courseId) }, { headers: getAuthHeader() })
      .then(() => {
        showToast('success', '¡Inscripción Exitosa!', '¡Ahora tienes acceso completo al curso!');
        navigate(`/student/course/${courseId}/view`);
      })
      .catch(err => {
        const message = err.response?.status === 409 
          ? 'Ya estás inscrito en este curso.' 
          : 'No se pudo procesar la inscripción.';
        showToast('warn', 'Atención', message);
      });
  };

  const renderLessonContent = (lesson) => {
    // Esta función ahora solo se usa para renderizar contenido visible.
    switch (lesson.type) {
      case 'video':
        const videoIdMatch = lesson.url?.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId) {
          return (
            <div className="video-responsive">
              <iframe src={`https://www.youtube.com/embed/${videoId}`} title={lesson.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          );
        }
        return <a href={lesson.url} target="_blank" rel="noopener noreferrer">Ver recurso en nueva pestaña</a>;
      case 'text':
        return <div dangerouslySetInnerHTML={{ __html: lesson.textContent }} />;
      default:
        return <p><em>Tipo de contenido no soportado.</em></p>;
    }
  };

  // --- Renderizado del Componente ---

  if (loading) { /* ... spinner de carga ... */ }
  if (!course) { /* ... mensaje de curso no encontrado ... */ }
  
  const imageUrl = course?.imageUrl && (course.imageUrl.startsWith('http') ? course.imageUrl : `${API_BASE_URL}${course.imageUrl}`);
  const previewModules = content.modules.slice(0, 1); // Solo mostramos el primer módulo como vista previa
  const remainingModuleCount = content.modules.length - previewModules.length;

  return (
    <div style={{ padding: '2rem' }}>
        <style>{`.video-responsive{overflow:hidden;padding-bottom:56.25%;position:relative;height:0;}.video-responsive iframe{left:0;top:0;height:100%;width:100%;position:absolute;}`}</style>
        <Card>
            {/* ... Sección superior con la imagen y el botón de inscribir ... (sin cambios) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
              <div>
                <h2>{course?.name}</h2>
                <p className="p-text-secondary" style={{ marginTop: '-1rem' }}>Impartido por {course?.teacher?.name}</p>
                <img src={imageUrl || 'https://via.placeholder.com/600x300'} alt={course?.name} style={{ width: '100%', borderRadius: '8px' }} />
                <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>{course?.description}</p>
              </div>
              <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', background: '#f8f9fa', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4>Inscríbete a este curso</h4>
                <p>Obtén acceso de por vida a todas las lecciones y materiales.</p>
                <Button label="Inscribirme Ahora" icon="pi pi-check-circle" className="p-button-lg p-button-success" onClick={handleEnroll} />
                <div style={{ marginTop: '1rem' }}>
                  <Tag value={course?.category?.name || 'General'} />
                </div>
              </div>
            </div>

            {/* --- SECCIÓN DE CONTENIDO DEL CURSO (MODIFICADA) --- */}
            <div style={{ marginTop: '3rem' }}>
              <h3>Contenido del Curso (Vista Previa)</h3>
              <p className="p-text-secondary">Estás viendo el primer módulo. Inscríbete para desbloquear el resto del contenido.</p>
              
              <Accordion multiple activeIndex={[0]}>
                {previewModules.map((module) => (
                  <AccordionTab key={module.id} header={module.title}>
                    {module.lessons?.map((lesson) => (
                      <div key={lesson.id} style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center' }}>
                          <i className={`pi ${lesson.type === 'video' ? 'pi-youtube' : 'pi-file'}`} style={{ marginRight: '0.75rem' }}/>
                          {lesson.title}
                        </h4>
                        {renderLessonContent(lesson)}
                      </div>
                    ))}
                    {(!module.lessons || module.lessons.length === 0) && <p>Este módulo no tiene lecciones.</p>}
                  </AccordionTab>
                ))}
              </Accordion>

              {/* --- BLOQUE DE LLAMADA A LA ACCIÓN (NUEVO) --- */}
              {remainingModuleCount > 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '2rem', 
                  textAlign: 'center', 
                  background: 'linear-gradient(to top, #e9ecef, #f8f9fa)', 
                  border: '1px solid #dee2e6',
                  borderRadius: '8px'
                }}>
                  <i className="pi pi-lock" style={{ fontSize: '2.5rem', color: 'var(--blue-500)' }}></i>
                  <h3 style={{ marginTop: '1rem' }}>¿Te gustó la muestra?</h3>
                  <p className="p-text-secondary" style={{ fontSize: '1.1rem' }}>
                    Inscríbete ahora para desbloquear los <strong>{remainingModuleCount} módulos restantes</strong> y todo el contenido futuro.
                  </p>
                  <Button 
                    label="Desbloquear Todo el Curso" 
                    icon="pi pi-check-circle" 
                    className="p-button-success p-button-lg" 
                    onClick={handleEnroll} 
                  />
                </div>
              )}
            </div>
        </Card>
    </div>
  );
};
 
export default CoursePreview;