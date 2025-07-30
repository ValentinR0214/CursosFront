import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Componentes de PrimeReact
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { OrderList } from 'primereact/orderlist';
import { Panel } from 'primereact/panel';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Editor } from 'primereact/editor';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; 

// Contexto y utilidades
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';

const API_URL = 'http://localhost:8080/api/content';

const CourseContentEditor = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useContext(ToastContext);

    const [courseName, setCourseName] = useState('');
    const [content, setContent] = useState({ modules: [] });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    
    const [moduleModalVisible, setModuleModalVisible] = useState(false);
    const [currentModule, setCurrentModule] = useState(null);
    const [moduleTitle, setModuleTitle] = useState('');

    const [lessonModalVisible, setLessonModalVisible] = useState(false);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [targetModuleId, setTargetModuleId] = useState(null);
    const [lessonData, setLessonData] = useState({ 
        title: '', 
        type: 'text', 
        url: '', 
        textContent: '' 
    });

    const lessonTypes = [
        { label: 'Texto Enriquecido', value: 'text' },
        { label: 'Video (URL)', value: 'video' },
        { label: 'Imagen (URL)', value: 'image' },
    ];

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                setLoading(true);
                const courseRes = await axios.get(
                    `http://localhost:8080/api/courses/findOne/${courseId}`, 
                    { headers: getAuthHeader() }
                );
                
                const courseData = courseRes.data?.result || {};
                setCourseName(courseData.name || `Curso ${courseId}`);
                
                try {
                    const contentRes = await axios.get(
                        `${API_URL}/get/${courseId}`, 
                        { headers: getAuthHeader() }
                    );
                    const contentData = contentRes.data?.result?.content || { modules: [] };
                    setContent({
                        modules: Array.isArray(contentData.modules) ? contentData.modules : []
                    });
                } catch (contentErr) {
                    if (contentErr.response?.status === 404) {
                        setContent({ modules: [] }); // Es un curso nuevo, inicializamos vacío.
                    } else {
                        throw contentErr;
                    }
                }
                
            } catch (err) {
                console.error('Error fatal al cargar los datos del curso:', err);
                setError('No se pudo cargar la configuración del editor.');
                showToast('error', 'Error', 'No se pudo cargar la configuración del editor.');
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId, showToast, navigate]);

    const openModuleModal = (module = null) => {
        setCurrentModule(module);
        setModuleTitle(module ? module.title : '');
        setModuleModalVisible(true);
    };

    const hideModuleModal = () => {
        setModuleModalVisible(false);
        setCurrentModule(null);
        setModuleTitle('');
    };

    const handleSaveModule = () => {
        if (!moduleTitle.trim()) {
            showToast('error', 'Error', 'El título del módulo no puede estar vacío.');
            return;
        }
        if (currentModule) {
            setContent(prevContent => ({
                ...prevContent,
                modules: prevContent.modules.map(mod =>
                    mod.id === currentModule.id ? { ...mod, title: moduleTitle } : mod
                )
            }));
            showToast('success', 'Éxito', 'Módulo actualizado.');
        } else {
            const newModule = { id: uuidv4(), title: moduleTitle, lessons: [] };
            setContent(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
            showToast('success', 'Éxito', 'Módulo añadido.');
        }
        hideModuleModal();
    };

    const handleDeleteModule = (moduleId) => {
        confirmDialog({
            message: '¿Estás seguro de que quieres eliminar este módulo y todas sus lecciones?',
            header: 'Confirmación de Borrado',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                setContent(currentContent => {
                    const updatedModules = currentContent.modules.filter(mod => mod.id !== moduleId);
                    return { ...currentContent, modules: updatedModules };
                });
                showToast('info', 'Eliminado', 'El módulo ha sido eliminado.');
            }
        });
    };

    const openLessonModal = (moduleId, lesson = null) => {
        setTargetModuleId(moduleId);
        setCurrentLesson(lesson);
        setLessonData(lesson 
            ? { title: lesson.title, type: lesson.type, url: lesson.url || '', textContent: lesson.textContent || '' } 
            : { title: '', type: 'text', url: '', textContent: '' }
        );
        setLessonModalVisible(true);
    };

    const hideLessonModal = () => {
        setLessonModalVisible(false);
        setTargetModuleId(null);
        setCurrentLesson(null);
    };

    const handleSaveLesson = () => {
        if (!lessonData.title.trim()) {
            showToast('error', 'Error', 'El título de la lección no puede estar vacío.');
            return;
        }
        setContent(prevContent => {
            const updatedModules = prevContent.modules.map(mod => {
                if (mod.id === targetModuleId) {
                    if (currentLesson) { // Editar lección existente
                        const updatedLessons = mod.lessons.map(les => 
                            les.id === currentLesson.id ? { ...les, ...lessonData } : les
                        );
                        return { ...mod, lessons: updatedLessons };
                    } else { // Añadir nueva lección
                        const newLesson = { ...lessonData, id: uuidv4() };
                        return { ...mod, lessons: [...(mod.lessons || []), newLesson] };
                    }
                }
                return mod;
            });
            return { ...prevContent, modules: updatedModules };
        });
        showToast('success', 'Éxito', currentLesson ? 'Lección actualizada.' : 'Lección añadida.');
        hideLessonModal();
    };

    const handleDeleteLesson = (moduleId, lessonId) => {
        confirmDialog({
            message: '¿Estás seguro de que quieres eliminar esta lección?',
            header: 'Confirmación de Borrado',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                setContent(currentContent => {
                    const updatedModules = currentContent.modules.map(mod => {
                        if (mod.id === moduleId) {
                            return { ...mod, lessons: mod.lessons.filter(les => les.id !== lessonId) };
                        }
                        return mod;
                    });
                    return { ...currentContent, modules: updatedModules };
                });
                showToast('info', 'Eliminada', 'La lección ha sido eliminada.');
            }
        });
    };

    const handleSaveContent = async () => {
        setIsSaving(true);
        try {
            await axios.post(
                `${API_URL}/saveContent/${courseId}`,
                JSON.stringify(content),
                { headers: { ...getAuthHeader(), 'Content-Type': 'application/json' } }
            );
            showToast('success', 'Éxito', 'El contenido del curso ha sido guardado.');
        } catch (err) {
            console.error('Error al guardar contenido:', err);
            showToast('error', 'Error', 'No se pudo guardar el contenido.');
        } finally {
            setIsSaving(false);
        }
    };

    const moduleTemplate = (module) => {
        const panelHeader = (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <strong>{module.title}</strong>
                <div>
                    <Button icon="pi pi-pencil" className="p-button-text" onClick={(e) => { e.stopPropagation(); openModuleModal(module); }} />
                    <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }} />
                </div>
            </div>
        );

        return (
            <Panel header={panelHeader} toggleable collapsed style={{ marginBottom: '1rem' }}>
                <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #eee' }}>
                    {module.lessons && module.lessons.map(lesson => (
                        <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                                <i className={`pi ${lesson.type === 'video' ? 'pi-youtube' : lesson.type === 'image' ? 'pi-image' : 'pi-file'}`} style={{ marginRight: '0.5rem' }} />
                                <span>{lesson.title}</span>
                            </div>
                            <div>
                                <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={(e) => { e.stopPropagation(); openLessonModal(module.id, lesson); }} />
                                <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={(e) => { e.stopPropagation(); handleDeleteLesson(module.id, lesson.id); }} />
                            </div>
                        </div>
                    ))}
                    {(!module.lessons || module.lessons.length === 0) && (
                        <p className="p-text-secondary">Este módulo aún no tiene lecciones.</p>
                    )}
                </div>
                <Button label="Añadir Lección" icon="pi pi-plus" className="p-button-sm p-button-text" onClick={(e) => { e.stopPropagation(); openLessonModal(module.id); }} style={{ marginTop: '1rem' }} />
            </Panel>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <ConfirmDialog />
            {error ? (
                <Card title="Error al Cargar">
                    <div className="p-text-center">
                        <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: 'var(--red-500)' }} />
                        <h3>{error}</h3>
                        <Button label="Volver a Cursos" icon="pi pi-arrow-left" onClick={() => navigate('/teacher/courses')} />
                    </div>
                </Card>
            ) : (
                <Card title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Editando Contenido del Curso: <strong>{courseName}</strong></span>
                        <Button label="Volver a Cursos" icon="pi pi-arrow-left" className="p-button-text" onClick={() => navigate('/teacher/courses')} />
                    </div>
                }>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <p className="p-text-secondary">Organiza los módulos de tu curso. Puedes arrastrarlos para cambiar el orden.</p>
                        <Button label="Añadir Módulo" icon="pi pi-plus" onClick={() => openModuleModal()} />
                    </div>

                    <OrderList value={content.modules} onChange={(e) => setContent({ modules: e.value })} itemTemplate={moduleTemplate} header="Módulos del Curso" dragdrop />
                    
                    <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                        <Button label={isSaving ? 'Guardando...' : 'Guardar Todo el Contenido'} icon={isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'} onClick={handleSaveContent} disabled={loading || isSaving} className="p-button-success" />
                    </div>
                </Card>
            )}
            
            <Dialog header={currentModule ? 'Editar Módulo' : 'Nuevo Módulo'} visible={moduleModalVisible} onHide={hideModuleModal} style={{ width: '30rem' }} modal footer={<div><Button label="Cancelar" className="p-button-text" onClick={hideModuleModal} /><Button label="Guardar" onClick={handleSaveModule} /></div>}>
                <div className="p-fluid"><div className="p-field"><label htmlFor="moduleTitle">Título del Módulo</label><InputText id="moduleTitle" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} autoFocus /></div></div>
            </Dialog>

            <Dialog header={currentLesson ? 'Editar Lección' : 'Nueva Lección'} visible={lessonModalVisible} onHide={hideLessonModal} style={{ width: '50vw', minWidth: '450px' }} modal footer={<div><Button label="Cancelar" className="p-button-text" onClick={hideLessonModal} /><Button label="Guardar Lección" onClick={handleSaveLesson} /></div>}>
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: '1.5rem' }}><label htmlFor="lessonTitle">Título de la Lección</label><InputText id="lessonTitle" value={lessonData.title} onChange={(e) => setLessonData({...lessonData, title: e.target.value})} /></div>
                    <div className="p-field" style={{ marginBottom: '1.5rem' }}><label htmlFor="lessonType">Tipo de Contenido</label><Dropdown id="lessonType" value={lessonData.type} options={lessonTypes} onChange={(e) => setLessonData({...lessonData, type: e.value, url: '', textContent: ''})} optionLabel="label" /></div>
                    {(lessonData.type === 'video' || lessonData.type === 'image') && (<div className="p-field" style={{ marginBottom: '1.5rem' }}><label htmlFor="lessonUrl">{lessonData.type === 'video' ? 'URL del Video' : 'URL de la Imagen'}</label><InputTextarea id="lessonUrl" value={lessonData.url} onChange={(e) => setLessonData({...lessonData, url: e.target.value})} rows={3} placeholder="Pega aquí la URL completa" /></div>)}
                    {lessonData.type === 'text' && (<div className="p-field" style={{ marginBottom: '1.5rem' }}><label>Contenido de Texto</label><Editor style={{ height: '250px' }} value={lessonData.textContent} onTextChange={(e) => setLessonData({...lessonData, textContent: e.htmlValue})} /></div>)}
                </div>
            </Dialog>
        </div>
    );
};

export default CourseContentEditor;