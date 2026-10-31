import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Calendar, Clock, Building2, Users, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const REQUEST_STATUSES = ['Open', 'Accepted', 'Fulfilled', 'Cancelled'];

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [foodItems, setFoodItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [alert, setAlert] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeRequest, setActiveRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);

  const [formData, setFormData] = useState({
    Beneficiary_id: '',
    NGO_id: '',
    Item_id: '',
    Required_by: '',
    Required_quantity: '',
    Status: 'Open'
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/requests', { params });
      setRequests(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [bRes, nRes, fRes] = await Promise.allSettled([
        api.get('/beneficiaries'),
        api.get('/ngos'),
        api.get('/food-items')
      ]);
      if (bRes.status === 'fulfilled') setBeneficiaries(bRes.value.data || []);
      if (nRes.status === 'fulfilled') setNgos(nRes.value.data || []);
      if (fRes.status === 'fulfilled') setFoodItems(fRes.value.data || []);
    } catch (err) {
      console.error('Error fetching request form options:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, selectedStatus]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleOpenCreate = () => {
    fetchOptions();
    // Tomorrow as default required_by
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 16);

    setFormData({
      Beneficiary_id: beneficiaries[0]?.Beneficiary_id || '',
      NGO_id: ngos[0]?.NGO_id || '',
      Item_id: '',
      Required_by: dateStr,
      Required_quantity: '',
      Status: 'Open'
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (req) => {
    setActiveRequest(req);
    setFormData({
      Beneficiary_id: req.Beneficiary_id || '',
      NGO_id: req.NGO_id || '',
      Item_id: req.Item_id || '',
      Required_by: req.Required_by ? req.Required_by.slice(0, 16) : '',
      Required_quantity: req.Required_quantity || '',
      Status: req.Status || 'Open'
    });
    setIsEditOpen(true);
  };

  const handleOpenView = async (req) => {
    setActiveRequest(req);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/requests/${req.Request_id}`);
      setRequestDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleOpenDelete = (req) => {
    setActiveRequest(req);
    setIsDeleteOpen(true);
  };

  const handleQuickStatus = async (id, status) => {
    try {
      await api.patch(`/requests/${id}/status`, { Status: status });
      setAlert({ type: 'success', message: `Request status changed to ${status}.` });
      fetchRequests();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', formData);
      setAlert({ type: 'success', message: 'Food request created successfully.' });
      setIsCreateOpen(false);
      fetchRequests();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/requests/${activeRequest.Request_id}`, formData);
      setAlert({ type: 'success', message: 'Food request updated.' });
      setIsEditOpen(false);
      fetchRequests();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/requests/${activeRequest.Request_id}`);
      setAlert({ type: 'success', message: 'Request deleted from database.' });
      setIsDeleteOpen(false);
      fetchRequests();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'ID & Beneficiary',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">{row.beneficiaryName}</div>
          <div className="text-slate-400 text-xs">
            <span className="font-mono">#{row.Request_id}</span> • {row.headCount} headcount ({row.verifiedStatus})
          </div>
        </div>
      )
    },
    {
      header: 'Requested Food',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">{row.itemName}</div>
          <span className="text-[11px] text-slate-500">{row.category || 'Any Category'}</span>
        </div>
      )
    },
    {
      header: 'Required Quantity',
      render: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">{row.Required_quantity} {row.unit}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Fulfilled: <span className="font-semibold text-emerald-600">{row.fulfilledQuantity}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Required By',
      render: (row) => (
        <div className="text-xs text-slate-600 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.Required_by?.slice(0, 16)}</span>
        </div>
      )
    },
    {
      header: 'Assigned NGO',
      render: (row) => (
        <div className="text-xs text-slate-700 font-medium">
          {row.ngoName}
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.Status} />
          {row.Status === 'Open' && (
            <div>
              <button
                onClick={() => handleQuickStatus(row.Request_id, 'Accepted')}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Mark Accepted
              </button>
            </div>
          )}
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
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Request"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete Request"
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
        data={requests}
        loading={loading}
        searchPlaceholder="Search requests by beneficiary, NGO, item..."
        searchValue={search}
        onSearch={setSearch}
        filters={
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
          >
            <option value="">All Statuses</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Food Request
          </button>
        }
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Submit Beneficiary Food Request"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Beneficiary Group * {beneficiaries.length > 0 ? `(${beneficiaries.length} available)` : '(Loading...)'}
              </label>
              <select
                required
                value={formData.Beneficiary_id}
                onChange={(e) => setFormData({ ...formData, Beneficiary_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">
                  {beneficiaries.length === 0 ? '-- Loading Beneficiaries from MySQL --' : 'Select Beneficiary'}
                </option>
                {beneficiaries.map((b) => (
                  <option key={b.Beneficiary_id} value={b.Beneficiary_id}>
                    {b.Name} ({b.Head_count} persons)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coordinating NGO * {ngos.length > 0 ? `(${ngos.length} available)` : '(Loading...)'}
              </label>
              <select
                required
                value={formData.NGO_id}
                onChange={(e) => setFormData({ ...formData, NGO_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">
                  {ngos.length === 0 ? '-- Loading NGOs from MySQL --' : 'Select NGO'}
                </option>
                {ngos.map((n) => (
                  <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Food Item (Optional)</label>
              <select
                value={formData.Item_id}
                onChange={(e) => setFormData({ ...formData, Item_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Any Food (General Surplus)</option>
                {foodItems.map((fi) => (
                  <option key={fi.Item_id} value={fi.Item_id}>
                    {fi.Item_name} ({fi.Unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Required_quantity}
                onChange={(e) => setFormData({ ...formData, Required_quantity: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[11px] text-slate-400">MySQL CHECK constraint requires Required_quantity &gt; 0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required By DateTime *</label>
              <input
                type="datetime-local"
                required
                value={formData.Required_by}
                onChange={(e) => setFormData({ ...formData, Required_by: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.Status}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
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
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Food Request #${activeRequest?.Request_id}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Beneficiary *</label>
              <select
                required
                value={formData.Beneficiary_id}
                onChange={(e) => setFormData({ ...formData, Beneficiary_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {beneficiaries.map((b) => (
                  <option key={b.Beneficiary_id} value={b.Beneficiary_id}>{b.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NGO *</label>
              <select
                required
                value={formData.NGO_id}
                onChange={(e) => setFormData({ ...formData, NGO_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {ngos.map((n) => (
                  <option key={n.NGO_id} value={n.NGO_id}>{n.Name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Food Item</label>
              <select
                value={formData.Item_id}
                onChange={(e) => setFormData({ ...formData, Item_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="">Any Food</option>
                {foodItems.map((fi) => (
                  <option key={fi.Item_id} value={fi.Item_id}>{fi.Item_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Required_quantity}
                onChange={(e) => setFormData({ ...formData, Required_quantity: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required By *</label>
              <input
                type="datetime-local"
                required
                value={formData.Required_by}
                onChange={(e) => setFormData({ ...formData, Required_by: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.Status}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
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
              Update Request
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setRequestDetails(null);
        }}
        title={`Request Details #${activeRequest?.Request_id}`}
        maxWidth="max-w-2xl"
      >
        {requestDetails ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-500">Beneficiary:</strong> {requestDetails.beneficiaryName}</div>
              <div><strong className="text-slate-500">Status:</strong> <StatusBadge status={requestDetails.Status} /></div>
              <div><strong className="text-slate-500">Requested Item:</strong> {requestDetails.itemName}</div>
              <div><strong className="text-slate-500">Quantity:</strong> {requestDetails.Required_quantity} {requestDetails.unit}</div>
              <div><strong className="text-slate-500">Request Date:</strong> {requestDetails.Request_DateTime?.slice(0, 16)}</div>
              <div><strong className="text-slate-500">Needed By:</strong> {requestDetails.Required_by?.slice(0, 16)}</div>
              <div><strong className="text-slate-500">Managing NGO:</strong> {requestDetails.ngoName}</div>
              <div><strong className="text-slate-500">Contact:</strong> {requestDetails.beneficiaryPhone}</div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">
                Fulfilling Deliveries ({requestDetails.deliveries?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Delivery ID</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Partner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requestDetails.deliveries?.length > 0 ? (
                      requestDetails.deliveries.map((del) => (
                        <tr key={del.Delivery_id}>
                          <td className="p-2 font-mono">#{del.Delivery_id}</td>
                          <td className="p-2 font-semibold">{del.Quantity}</td>
                          <td className="p-2"><StatusBadge status={del.Status} /></td>
                          <td className="p-2">{del.partnerName} ({del.vehicleNo || 'Fleet'})</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          No deliveries mapped to this food request yet.
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
        title="Confirm Request Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete request{' '}
            <strong className="text-slate-800">#{activeRequest?.Request_id}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Deliveries fulfilling this request (`fk_delivery_request`) reference this record. Delete or reassign those deliveries first.
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
