import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios'; // 1. Importa axios
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security'; 
import CategoryModal from './CategoryModal';

const API_URL = 'http://localhost:8080/api/categories';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { showToast } = useContext(ToastContext);

  const fetchCategories = () => {
    setLoading(true);
    axios.get(`${API_URL}/`, { headers: getAuthHeader() })
      .then(res => setCategories(res.data.result))
      .catch(err => showToast('error', 'Error', 'No se pudieron cargar las categorías.'))
      .finally(() => setLoading(false));
  };

  const handleSave = (categoryData) => {
    setLoading(true);
    const promise = categoryData.id
      ? axios.put(`${API_URL}/update/${categoryData.id}`, categoryData, { headers: getAuthHeader() })
      : axios.post(`${API_URL}/save`, categoryData, { headers: getAuthHeader() });

    promise.then(() => {
      showToast('success', 'Éxito', `Categoría ${categoryData.id ? 'actualizada' : 'creada'}.`);
      setIsModalVisible(false);
      fetchCategories();
    }).catch(err => {
      showToast('error', 'Error', err.response?.data?.message || 'Ocurrió un error.');
      setLoading(false);
    });
  };

  const handleToggleStatus = (category) => {
    confirmDialog({
      message: `¿Estás seguro de que deseas ${category.enabled ? 'deshabilitar' : 'habilitar'} esta categoría?`,
      header: 'Confirmación de Estado',
      icon: 'pi pi-info-circle',
      acceptClassName: category.enabled ? 'p-button-danger' : 'p-button-success',
      accept: () => {
        axios.delete(`${API_URL}/delete/${category.id}`, { headers: getAuthHeader() })
          .then(() => {
            showToast('info', 'Actualizado', 'El estado de la categoría ha cambiado.');
            fetchCategories();
          })
          .catch(err => showToast('error', 'Error', 'No se pudo cambiar el estado.'));
      }
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openNew = () => {
    setSelectedCategory(null);
    setIsModalVisible(true);
  };

  const openEdit = (category) => {
    setSelectedCategory(category);
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const leftToolbarTemplate = () => (
    <Button label="Nueva Categoría" icon="pi pi-plus" onClick={openNew} />
  );

  const statusBodyTemplate = (rowData) => (
    <Tag value={rowData.enabled ? 'Habilitada' : 'Deshabilitada'} severity={rowData.enabled ? 'success' : 'danger'} />
  );

  const actionBodyTemplate = (rowData) => (
    <>
      <Button icon="pi pi-pencil" rounded outlined onClick={() => openEdit(rowData)} style={{ marginRight: '.5rem' }} />
      <Button 
        icon={rowData.enabled ? 'pi pi-eye-slash' : 'pi pi-eye'} 
        rounded 
        outlined 
        severity={rowData.enabled ? 'warning' : 'success'}
        onClick={() => handleToggleStatus(rowData)}
        tooltip={rowData.enabled ? 'Deshabilitar' : 'Habilitar'}
        tooltipOptions={{ position: 'top' }}
      />
    </>
  );

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <ConfirmDialog />
      <Toolbar className="p-mb-4" left={leftToolbarTemplate}></Toolbar>
      <DataTable value={categories} loading={loading} paginator rows={10} emptyMessage="No se encontraron categorías.">
        <Column field="id" header="ID" sortable />
        <Column field="name" header="Nombre" sortable />
        <Column field="description" header="Descripción" />
        <Column header="Estado" body={statusBodyTemplate} sortable field="enabled" />
        <Column header="Acciones" body={actionBodyTemplate} />
      </DataTable>

      <CategoryModal
        category={selectedCategory}
        visible={isModalVisible}
        onHide={hideModal}
        onSave={handleSave}
      />
    </div>
  );
};

export default CategoryManagement;