import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Phone, Mail, MapPin, Warehouse, Bike } from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

export default function NGOs() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeNgo, setActiveNgo] = useState(null);
  const [ngoDetails, setNgoDetails] = useState(null);

  const [formData, setFormData] = useState({
    Name: '',
    Phone: '',
    Email: '',
    Address: ''
  });

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      const params = search ? { search } : {};
      const res = await api.get('/ngos', { params });
      setNgos(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNGOs();
  }, [search]);

  const handleOpenCreate = () => {
    setFormData({ Name: '', Phone: '', Email: '', Address: '' });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (ngo) => {
    setActiveNgo(ngo);
    setFormData({
      Name: ngo.Name || '',
      Phone: ngo.Phone || '',
      Email: ngo.Email || '',
      Address: ngo.Address || ''
    });
    setIsEditOpen(true);
  };

  const handleOpenView = async (ngo) => {
    setActiveNgo(ngo);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/ngos/${ngo.NGO_id}`);
      setNgoDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleOpenDelete = (ngo) => {
    setActiveNgo(ngo);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ngos', formData);
      setAlert({ type: 'success', message: 'NGO registered successfully.' });
      setIsCreateOpen(false);
      fetchNGOs();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/ngos/${activeNgo.NGO_id}`, formData);
      setAlert({ type: 'success', message: 'NGO details updated successfully.' });
      setIsEditOpen(false);
      fetchNGOs();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/ngos/${activeNgo.NGO_id}`);
      setAlert({ type: 'success', message: 'NGO removed from database.' });
      setIsDeleteOpen(false);
      fetchNGOs();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'NGO Name',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{row.Name}</div>
          <div className="text-slate-400 text-xs font-mono">ID: #{row.NGO_id}</div>
        </div>
      )
    },
    {
      header: 'Contact Details',
      render: (row) => (
        <div className="text-xs space-y-0.5 text-slate-600">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> {row.Phone}
          </div>
          {row.Email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {row.Email}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Headquarters / Address',
      render: (row) => (
        <div className="text-xs text-slate-600 max-w-xs truncate" title={row.Address}>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{row.Address}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Facilities & Logistics',
      render: (row) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
            <Warehouse className="w-3.5 h-3.5" /> {row.totalStorageUnits} Units
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-semibold border border-teal-100">
            <Bike className="w-3.5 h-3.5" /> {row.totalPartners} Fleet
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenView(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="View Associated Units & Fleet"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit NGO"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete NGO"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <DataTable
        columns={columns}
        data={ngos}
        loading={loading}
        searchPlaceholder="Search NGOs by name, address, contact..."
        searchValue={search}
        onSearch={setSearch}
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add NGO
          </button>
        }
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Partner NGO"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">NGO Name *</label>
            <input
              type="text"
              required
              value={formData.Name}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
              placeholder="e.g. Surat Food Relief Foundation"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.Phone}
                onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                placeholder="+91 99000 11223"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                placeholder="contact@ngo.org"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Office / Warehouse Address *</label>
            <textarea
              required
              rows={2}
              value={formData.Address}
              onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
              placeholder="Full address of NGO headquarters"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
            >
              Save NGO
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit NGO: ${activeNgo?.Name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">NGO Name *</label>
            <input
              type="text"
              required
              value={formData.Name}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.Phone}
                onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
            <textarea
              required
              rows={2}
              value={formData.Address}
              onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
            >
              Update Details
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setNgoDetails(null);
        }}
        title={`NGO Overview: ${activeNgo?.Name}`}
        maxWidth="max-w-3xl"
      >
        {ngoDetails ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-500">Phone:</strong> {ngoDetails.Phone}</div>
              <div><strong className="text-slate-500">Email:</strong> {ngoDetails.Email || 'N/A'}</div>
              <div className="col-span-2"><strong className="text-slate-500">Address:</strong> {ngoDetails.Address}</div>
            </div>

            {/* Storage Units */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-indigo-600" />
                Managed Storage Units ({ngoDetails.storageUnits?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Unit Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Capacity</th>
                      <th className="p-2.5">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ngoDetails.storageUnits?.length > 0 ? (
                      ngoDetails.storageUnits.map((su) => (
                        <tr key={su.Unit_id}>
                          <td className="p-2.5 font-semibold text-slate-800">{su.Unit_name}</td>
                          <td className="p-2.5">{su.Storage_type}</td>
                          <td className="p-2.5">{su.Total_capacity} units</td>
                          <td className="p-2.5 text-slate-500">{su.Location}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          No storage units configured for this NGO.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Partners & Vehicles */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Bike className="w-4 h-4 text-teal-600" />
                Associated Delivery Partners ({ngoDetails.deliveryPartners?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Partner Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Assigned Vehicle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ngoDetails.deliveryPartners?.length > 0 ? (
                      ngoDetails.deliveryPartners.map((dp) => (
                        <tr key={dp.Partner_id}>
                          <td className="p-2.5 font-semibold text-slate-800">{dp.Name}</td>
                          <td className="p-2.5">{dp.Type}</td>
                          <td className="p-2.5">{dp.Phone}</td>
                          <td className="p-2.5">
                            {dp.Vehicle_no ? (
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                {dp.Vehicle_no} ({dp.Vehicle_type})
                              </span>
                            ) : (
                              <span className="text-slate-400">No Vehicle</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          No delivery partners linked to this NGO yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">Loading details...</div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm NGO Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete NGO{' '}
            <strong className="text-slate-800">{activeNgo?.Name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            MySQL constraint: Storage units (`fk_unit_ngo`) and requests (`fk_request_ngo`) have `ON DELETE RESTRICT`. Deleting will fail if active units or requests exist.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
