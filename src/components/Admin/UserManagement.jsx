import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext'; 
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ToastContext } from '../../contexts/ToastContext';
import { getAuthHeader } from '../../utils/security';
import EditUserModal from './EditUserModal';

const API_URL = 'http://localhost:8080/api/users';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const { showToast } = useContext(ToastContext);

  const fetchUsers = () => {
    setLoading(true);
    axios.get(`${API_URL}/admin/all`, { headers: getAuthHeader() })
      .then(response => {
        setUsers(response.data.result);
      })
      .catch(err => {
        showToast('error', 'Error', 'No se pudieron cargar los usuarios.');
      })
      .finally(() => setLoading(false));
  };

  const handleSave = (userId, userData) => {
    axios.put(`${API_URL}/${userId}`, userData, { headers: getAuthHeader() })
      .then(() => {
        setIsModalVisible(false);
        fetchUsers();
        showToast('success', 'Éxito', 'Usuario actualizado correctamente.');
      })
      .catch(err => {
        showToast('error', 'Error', 'No se pudo actualizar el usuario.');
      });
  };

  const handleDeactivate = (userId) => {
    confirmDialog({
      message: '¿Estás seguro de que deseas desactivar este usuario?',
      header: 'Confirmación de Desactivación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        axios.delete(`${API_URL}/${userId}`, { headers: getAuthHeader() })
          .then(() => {
            fetchUsers();
            showToast('info', 'Confirmado', 'El usuario ha sido desactivado.');
          })
          .catch(err => {
            showToast('error', 'Error', 'No se pudo desactivar el usuario.');
          });
      },
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };
  
  const tableHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0 }}>Gestión de Usuarios</h2>
      <span className= "p-input-icon-left ">
        <i className="pi pi-search" />
        <InputText 
          type="search" 
          value={globalFilter} 
          onChange={(e) => setGlobalFilter(e.target.value)} 
          placeholder="  Buscar..." 
        />
      </span>
    </div>
  );

  const statusBodyTemplate = (rowData) => {
    return <Tag severity={rowData.statusActive ? 'success' : 'danger'} value={rowData.statusActive ? 'Activo' : 'Inactivo'} />;
  };

  const actionBodyTemplate = (rowData) => (
    <>
      <Button icon="pi pi-pencil" rounded outlined className="p-mr-2" onClick={() => handleEdit(rowData)} style={{ marginRight: '0.5rem' }} />
      <Button icon="pi pi-power-off" rounded outlined severity="danger" onClick={() => handleDeactivate(rowData.id)} disabled={!rowData.statusActive} tooltip="Desactivar Usuario" tooltipOptions={{ position: 'top' }} />
    </>
  );

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <ConfirmDialog />
      <DataTable 
        value={users} 
        loading={loading} 
        paginator rows={10} 
        emptyMessage="No se encontraron usuarios."
        globalFilter={globalFilter}
        header={tableHeader} 
      >
        <Column field="id" header="ID" sortable />
        <Column field="name" header="Nombre" sortable />
        <Column field="lastName" header="Apellido Paterno" sortable />
        <Column field="surname" header="Apellido Materno" sortable />
        <Column field="phone" header="Telefono" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="rol.roleEnum" header="Rol" sortable />
        <Column header="Estado" body={statusBodyTemplate} sortable field="statusActive" />
        <Column header="Acciones" body={actionBodyTemplate} />
      </DataTable>

      <EditUserModal 
        user={selectedUser}
        visible={isModalVisible}
        onHide={() => setIsModalVisible(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default UserManagement;