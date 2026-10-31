import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Phone, Mail, MapPin, Users, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [alert, setAlert] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeBeneficiary, setActiveBeneficiary] = useState(null);
  const [beneficiaryDetails, setBeneficiaryDetails] = useState(null);

  const [formData, setFormData] = useState({
    Name: '',
    Phone: '',
    Email: '',
    Address: '',
    Head_count: 25,
    Verified_status: 'Pending'
  });

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/beneficiaries', { params });
      setBeneficiaries(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, [search, selectedStatus]);

  const handleOpenCreate = () => {
    setFormData({
      Name: '',
      Phone: '',
      Email: '',
      Address: '',
      Head_count: 25,
      Verified_status: 'Pending'
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (b) => {
    setActiveBeneficiary(b);
    setFormData({
      Name: b.Name || '',
      Phone: b.Phone || '',
      Email: b.Email || '',
      Address: b.Address || '',
      Head_count: b.Head_count || 1,
      Verified_status: b.Verified_status || 'Pending'
    });
    setIsEditOpen(true);
  };

  const handleOpenView = async (b) => {
    setActiveBeneficiary(b);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/beneficiaries/${b.Beneficiary_id}`);
      setBeneficiaryDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleOpenDelete = (b) => {
    setActiveBeneficiary(b);
    setIsDeleteOpen(true);
  };

  const handleQuickStatusChange = async (id, status) => {
    try {
      await api.patch(`/beneficiaries/${id}/status`, { Verified_status: status });
      setAlert({ type: 'success', message: `Verification status updated to ${status}.` });
      fetchBeneficiaries();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/beneficiaries', formData);
      setAlert({ type: 'success', message: 'Beneficiary registered successfully.' });
      setIsCreateOpen(false);
      fetchBeneficiaries();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/beneficiaries/${activeBeneficiary.Beneficiary_id}`, formData);
      setAlert({ type: 'success', message: 'Beneficiary details updated successfully.' });
      setIsEditOpen(false);
      fetchBeneficiaries();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/beneficiaries/${activeBeneficiary.Beneficiary_id}`);
      setAlert({ type: 'success', message: 'Beneficiary removed from database.' });
      setIsDeleteOpen(false);
      fetchBeneficiaries();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'Beneficiary Name & Headcount',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{row.Name}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-700">{row.Head_count}</span> individuals
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
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
      header: 'Location / Address',
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
      header: 'Verification Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.Verified_status} />
          {row.Verified_status === 'Pending' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleQuickStatusChange(row.Beneficiary_id, 'Verified')}
                className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                title="Mark Verified"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleQuickStatusChange(row.Beneficiary_id, 'Rejected')}
                className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100"
                title="Mark Rejected"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Requests History',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{row.totalRequests}</span> requests
          <div className="text-slate-400 text-[11px]">{row.totalRequestedQuantity} qty needed</div>
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
            title="View Requests History"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Beneficiary"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete Beneficiary"
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
        data={beneficiaries}
        loading={loading}
        searchPlaceholder="Search beneficiaries by name, address, contact..."
        searchValue={search}
        onSearch={setSearch}
        filters={
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
          >
            <option value="">All Verification Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Register Beneficiary
          </button>
        }
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Beneficiary Organization / Group"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Group Name *</label>
              <input
                type="text"
                required
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                placeholder="e.g. Surat Community Shelter"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Head Count *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.Head_count}
                onChange={(e) => setFormData({ ...formData, Head_count: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[11px] text-slate-400">MySQL CHECK constraint requires Head_count &gt; 0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="text"
                required
                value={formData.Phone}
                onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                placeholder="+91 91234 56789"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                placeholder="shelter@community.org"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Verification Status</label>
            <select
              value={formData.Verified_status}
              onChange={(e) => setFormData({ ...formData, Verified_status: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery / Residence Address *</label>
            <textarea
              required
              rows={2}
              value={formData.Address}
              onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
              placeholder="Exact delivery location where rescued food will be served"
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
              Save Beneficiary
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Beneficiary: ${activeBeneficiary?.Name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Head Count *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.Head_count}
                onChange={(e) => setFormData({ ...formData, Head_count: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Status</label>
            <select
              value={formData.Verified_status}
              onChange={(e) => setFormData({ ...formData, Verified_status: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
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

      {/* VIEW DETAILS & REQUEST HISTORY */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setBeneficiaryDetails(null);
        }}
        title={`Beneficiary Profile: ${activeBeneficiary?.Name}`}
        maxWidth="max-w-3xl"
      >
        {beneficiaryDetails ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-500">Head Count:</strong> {beneficiaryDetails.Head_count} persons</div>
              <div><strong className="text-slate-500">Status:</strong> <StatusBadge status={beneficiaryDetails.Verified_status} /></div>
              <div><strong className="text-slate-500">Phone:</strong> {beneficiaryDetails.Phone}</div>
              <div><strong className="text-slate-500">Email:</strong> {beneficiaryDetails.Email || 'N/A'}</div>
              <div className="col-span-2"><strong className="text-slate-500">Address:</strong> {beneficiaryDetails.Address}</div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">
                Food Requests History ({beneficiaryDetails.requests?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Request ID</th>
                      <th className="p-2.5">Required Food</th>
                      <th className="p-2.5">Qty Required</th>
                      <th className="p-2.5">Fulfilled Qty</th>
                      <th className="p-2.5">Required By</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Assigned NGO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {beneficiaryDetails.requests?.length > 0 ? (
                      beneficiaryDetails.requests.map((r) => (
                        <tr key={r.Request_id}>
                          <td className="p-2.5 font-mono">#{r.Request_id}</td>
                          <td className="p-2.5 font-medium">{r.Item_name || 'Any Food'}</td>
                          <td className="p-2.5">{r.Required_quantity} {r.Unit || ''}</td>
                          <td className="p-2.5 text-emerald-600 font-semibold">{r.fulfilledQuantity}</td>
                          <td className="p-2.5">{r.Required_by?.slice(0, 16)}</td>
                          <td className="p-2.5"><StatusBadge status={r.Status} /></td>
                          <td className="p-2.5">{r.ngoName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400">
                          No food requests created for this beneficiary.
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
        title="Confirm Beneficiary Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete beneficiary{' '}
            <strong className="text-slate-800">{activeBeneficiary?.Name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Note: Beneficiary records linked to existing food requests (`fk_request_beneficiary`) cannot be deleted without deleting or reassigning those requests first.
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
