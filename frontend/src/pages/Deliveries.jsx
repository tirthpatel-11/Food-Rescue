import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Truck,
  Bike,
  Building2,
  Warehouse,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const DELIVERY_STATUSES = ['Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [donations, setDonations] = useState([]);
  const [partners, setPartners] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [storageUnits, setStorageUnits] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDestType, setSelectedDestType] = useState('');
  const [alert, setAlert] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeDelivery, setActiveDelivery] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);

  // Form State
  const [destinationChoice, setDestinationChoice] = useState('Beneficiary'); // 'Beneficiary' | 'Storage Unit'
  const [formData, setFormData] = useState({
    Donation_id: '',
    Request_id: '',
    Quantity: '',
    Delivery_partner_id: '',
    NGO_id: '',
    Beneficiary_id: '',
    Unit_id: '',
    Pickup_DateTime: '',
    Delivery_DateTime: '',
    Status: 'Assigned'
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedDestType) params.destinationType = selectedDestType;

      const res = await api.get('/deliveries', { params });
      setDeliveries(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [donationsRes, partnersRes, ngosRes, bRes, uRes, reqRes] = await Promise.allSettled([
        api.get('/donations'),
        api.get('/partners'),
        api.get('/ngos'),
        api.get('/beneficiaries'),
        api.get('/storage-units'),
        api.get('/requests')
      ]);
      if (donationsRes.status === 'fulfilled') setDonations(donationsRes.value.data || []);
      if (partnersRes.status === 'fulfilled') setPartners(partnersRes.value.data || []);
      if (ngosRes.status === 'fulfilled') setNgos(ngosRes.value.data || []);
      if (bRes.status === 'fulfilled') setBeneficiaries(bRes.value.data || []);
      if (uRes.status === 'fulfilled') setStorageUnits(uRes.value.data || []);
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data || []);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [search, selectedStatus, selectedDestType]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleOpenCreate = () => {
    fetchDependencies();
    const nowStr = new Date().toISOString().slice(0, 16);
    setDestinationChoice('Beneficiary');
    const firstReq = requests[0];
    setFormData({
      Donation_id: donations[0]?.Donation_id || '',
      Request_id: firstReq?.Request_id || '',
      Quantity: '',
      Delivery_partner_id: partners[0]?.Partner_id || '',
      NGO_id: ngos[0]?.NGO_id || '',
      Beneficiary_id: firstReq?.Beneficiary_id || beneficiaries[0]?.Beneficiary_id || '',
      Unit_id: '',
      Pickup_DateTime: nowStr,
      Delivery_DateTime: '',
      Status: 'Assigned'
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (del) => {
    setActiveDelivery(del);
    const isBeneficiary = Boolean(del.Beneficiary_id);
    setDestinationChoice(isBeneficiary ? 'Beneficiary' : 'Storage Unit');
    setFormData({
      Donation_id: del.Donation_id || '',
      Request_id: del.Request_id || '',
      Quantity: del.Quantity || '',
      Delivery_partner_id: del.partnerId || '',
      NGO_id: del.NGO_id || '',
      Beneficiary_id: del.Beneficiary_id || '',
      Unit_id: del.Unit_id || '',
      Pickup_DateTime: del.Pickup_DateTime ? del.Pickup_DateTime.slice(0, 16) : '',
      Delivery_DateTime: del.Delivery_DateTime ? del.Delivery_DateTime.slice(0, 16) : '',
      Status: del.Status || 'Assigned'
    });
    setIsEditOpen(true);
  };

  const handleOpenView = async (del) => {
    setActiveDelivery(del);
    setIsViewOpen(true);
    try {
      const res = await api.get(`/deliveries/${del.Delivery_id}`);
      setDeliveryDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleOpenDelete = (del) => {
    setActiveDelivery(del);
    setIsDeleteOpen(true);
  };

  const handleQuickStatus = async (id, status) => {
    try {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const payload = { Status: status };
      if (status === 'Picked Up') payload.Pickup_DateTime = now;
      if (status === 'Delivered') payload.Delivery_DateTime = now;

      await api.patch(`/deliveries/${id}/status`, payload);
      setAlert({ type: 'success', message: `Delivery updated to ${status}.` });
      fetchDeliveries();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (destinationChoice === 'Beneficiary') {
        payload.Unit_id = null;
        if (!payload.Beneficiary_id || !payload.Request_id) {
          throw new Error('A delivery to a Beneficiary requires both a Beneficiary and an associated Request.');
        }
      } else {
        payload.Beneficiary_id = null;
        payload.Request_id = null;
        if (!payload.Unit_id) {
          throw new Error('Please select a Storage Unit as destination.');
        }
      }

      await api.post('/deliveries', payload);
      setAlert({ type: 'success', message: 'Delivery dispatched successfully in MySQL.' });
      setIsCreateOpen(false);
      fetchDeliveries();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (destinationChoice === 'Beneficiary') {
        payload.Unit_id = null;
      } else {
        payload.Beneficiary_id = null;
        payload.Request_id = null;
      }

      await api.put(`/deliveries/${activeDelivery.Delivery_id}`, payload);
      setAlert({ type: 'success', message: 'Delivery details updated.' });
      setIsEditOpen(false);
      fetchDeliveries();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/deliveries/${activeDelivery.Delivery_id}`);
      setAlert({ type: 'success', message: 'Delivery record removed from database.' });
      setIsDeleteOpen(false);
      fetchDeliveries();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'ID & Food Item',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 text-sm">
            {row.itemName}
          </div>
          <div className="text-slate-400 text-xs">
            <span className="font-mono">#{row.Delivery_id}</span> • From Donation #{row.Donation_id} ({row.donorName})
          </div>
        </div>
      )
    },
    {
      header: 'Quantity',
      render: (row) => (
        <div className="text-xs font-bold text-slate-900">
          {row.Quantity} {row.unit}
        </div>
      )
    },
    {
      header: 'Destination',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            {row.destinationType === 'Beneficiary' ? (
              <Users className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Warehouse className="w-3.5 h-3.5 text-blue-600" />
            )}
            {row.destinationName}
          </div>
          <div className="text-slate-400 text-[11px]">
            {row.destinationType} {row.Request_id ? `(Req #${row.Request_id})` : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Partner & Fleet',
      render: (row) => (
        <div className="text-xs text-slate-700">
          <div className="font-medium flex items-center gap-1">
            <Bike className="w-3.5 h-3.5 text-teal-600" />
            {row.partnerName}
          </div>
          <div className="text-slate-400 text-[11px] font-mono">
            {row.vehicleNo || 'Fleet Vehicle'} ({row.vehicleType || 'Standard'})
          </div>
        </div>
      )
    },
    {
      header: 'Delivery Status',
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.Status} />
          {row.Status === 'Assigned' && (
            <div>
              <button
                onClick={() => handleQuickStatus(row.Delivery_id, 'Picked Up')}
                className="text-[10px] font-bold text-amber-600 hover:underline"
              >
                Mark Picked Up
              </button>
            </div>
          )}
          {row.Status === 'Picked Up' && (
            <div>
              <button
                onClick={() => handleQuickStatus(row.Delivery_id, 'In Transit')}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Mark In Transit
              </button>
            </div>
          )}
          {row.Status === 'In Transit' && (
            <div>
              <button
                onClick={() => handleQuickStatus(row.Delivery_id, 'Delivered')}
                className="text-[10px] font-bold text-emerald-600 hover:underline"
              >
                Mark Delivered
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Freshness & Time',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <StatusBadge status={row.freshnessCheck} className="text-[10px]" />
          {row.transitMinutes !== null && row.transitMinutes !== undefined && (
            <div className="text-slate-500 text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> Transit: {row.transitMinutes} mins
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
            title="View Tracking Audit"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            title="Edit Delivery"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Delete Delivery"
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
        data={deliveries}
        loading={loading}
        searchPlaceholder="Search deliveries by partner, destination, food item..."
        searchValue={search}
        onSearch={setSearch}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
            >
              <option value="">All Statuses</option>
              {DELIVERY_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={selectedDestType}
              onChange={(e) => setSelectedDestType(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
            >
              <option value="">All Destinations</option>
              <option value="Beneficiary">Beneficiary</option>
              <option value="Storage Unit">Storage Unit</option>
            </select>
          </div>
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Dispatch Delivery
          </button>
        }
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Dispatch Food Delivery"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed">
            <strong>DBMS Constraint Rule:</strong> Delivery destination must be <em>either</em> a Beneficiary <em>or</em> an NGO Storage Unit. Beneficiary deliveries must link to a valid Food Request.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Food Donation *</label>
              <select
                required
                value={formData.Donation_id}
                onChange={(e) => setFormData({ ...formData, Donation_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select Donation</option>
                {donations.map((d) => (
                  <option key={d.Donation_id} value={d.Donation_id}>
                    #{d.Donation_id} - {d.itemName} ({d.remainingQuantity} {d.unit} remaining)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Quantity}
                onChange={(e) => setFormData({ ...formData, Quantity: e.target.value })}
                placeholder="Quantity to deliver"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Partner & Vehicle * {partners.length > 0 ? `(${partners.length} available)` : '(Loading...)'}
              </label>
              <select
                required
                value={formData.Delivery_partner_id}
                onChange={(e) => setFormData({ ...formData, Delivery_partner_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">
                  {partners.length === 0 ? '-- Loading Partners from MySQL --' : 'Select Partner'}
                </option>
                {partners.map((p) => (
                  <option key={p.Partner_id} value={p.Partner_id}>
                    {p.Name} ({p.Vehicle_no || 'No Vehicle'} - {p.Vehicle_type || 'Fleet'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Selector Tabs */}
          <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Destination Target *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDestinationChoice('Beneficiary')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  destinationChoice === 'Beneficiary'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" /> Beneficiary (Food Request)
              </button>
              <button
                type="button"
                onClick={() => setDestinationChoice('Storage Unit')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  destinationChoice === 'Storage Unit'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-950/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Warehouse className="w-4 h-4" /> Storage Unit (Warehouse)
              </button>
            </div>

            {destinationChoice === 'Beneficiary' ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Beneficiary * {beneficiaries.length > 0 ? `(${beneficiaries.length} available)` : '(Loading...)'}
                    </label>
                    <select
                      required
                      value={formData.Beneficiary_id}
                      onChange={(e) => {
                        const bId = e.target.value;
                        const matchingReqs = requests.filter((r) => r.Beneficiary_id == bId);
                        setFormData({
                          ...formData,
                          Beneficiary_id: bId,
                          Request_id: matchingReqs[0]?.Request_id || ''
                        });
                      }}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="">
                        {beneficiaries.length === 0 ? '-- Loading Beneficiaries --' : 'Select Beneficiary'}
                      </option>
                      {beneficiaries.map((b) => (
                        <option key={b.Beneficiary_id} value={b.Beneficiary_id}>
                          {b.Name} ({b.Head_count} headcount)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fulfilling Food Request *
                    </label>
                    <select
                      required
                      value={formData.Request_id}
                      onChange={(e) => {
                        const rId = e.target.value;
                        const selectedReq = requests.find((r) => r.Request_id == rId);
                        setFormData({
                          ...formData,
                          Request_id: rId,
                          Beneficiary_id: selectedReq ? selectedReq.Beneficiary_id : formData.Beneficiary_id
                        });
                      }}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="">
                        {requests.length === 0 ? '-- Loading Requests --' : 'Select Food Request'}
                      </option>
                      {(formData.Beneficiary_id
                        ? requests.filter((r) => r.Beneficiary_id == formData.Beneficiary_id)
                        : requests
                      ).map((r) => (
                        <option key={r.Request_id} value={r.Request_id}>
                          Req #{r.Request_id} - {r.itemName} ({r.beneficiaryName || `Beneficiary #${r.Beneficiary_id}`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.Beneficiary_id &&
                  requests.filter((r) => r.Beneficiary_id == formData.Beneficiary_id).length === 0 && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                      This beneficiary currently has no open food requests logged in MySQL. Please select another beneficiary with an open request, or select "Storage Unit" above.
                    </div>
                  )}
              </div>
            ) : (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">NGO Storage Unit *</label>
                <select
                  required
                  value={formData.Unit_id}
                  onChange={(e) => setFormData({ ...formData, Unit_id: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">Select Storage Unit</option>
                  {storageUnits.map((su) => (
                    <option key={su.Unit_id} value={su.Unit_id}>
                      {su.Unit_name} ({su.Storage_type} - {su.ngoName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Time</label>
              <input
                type="datetime-local"
                value={formData.Pickup_DateTime}
                onChange={(e) => setFormData({ ...formData, Pickup_DateTime: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Time (Optional)</label>
              <input
                type="datetime-local"
                value={formData.Delivery_DateTime}
                onChange={(e) => setFormData({ ...formData, Delivery_DateTime: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
              <span className="text-[10px] text-slate-400">Must be &gt;= Pickup Time</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.Status}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {DELIVERY_STATUSES.map((s) => (
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
              Dispatch Delivery
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Delivery #${activeDelivery?.Delivery_id}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donation ID *</label>
              <input
                type="number"
                required
                value={formData.Donation_id}
                onChange={(e) => setFormData({ ...formData, Donation_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.Quantity}
                onChange={(e) => setFormData({ ...formData, Quantity: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Partner *</label>
              <select
                required
                value={formData.Delivery_partner_id}
                onChange={(e) => setFormData({ ...formData, Delivery_partner_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {partners.map((p) => (
                  <option key={p.Partner_id} value={p.Partner_id}>{p.Name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Time</label>
              <input
                type="datetime-local"
                value={formData.Pickup_DateTime}
                onChange={(e) => setFormData({ ...formData, Pickup_DateTime: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Time</label>
              <input
                type="datetime-local"
                value={formData.Delivery_DateTime}
                onChange={(e) => setFormData({ ...formData, Delivery_DateTime: e.target.value })}
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
                {DELIVERY_STATUSES.map((s) => (
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
              Update Delivery
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setDeliveryDetails(null);
        }}
        title={`Delivery Tracking Audit #${activeDelivery?.Delivery_id}`}
        maxWidth="max-w-2xl"
      >
        {deliveryDetails ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
              <div><strong className="text-slate-500">Food Item:</strong> {deliveryDetails.itemName} ({deliveryDetails.category})</div>
              <div><strong className="text-slate-500">Quantity:</strong> {deliveryDetails.Quantity} {deliveryDetails.unit}</div>
              <div><strong className="text-slate-500">Status:</strong> <StatusBadge status={deliveryDetails.Status} /></div>
              <div><strong className="text-slate-500">Freshness Check:</strong> <StatusBadge status={deliveryDetails.freshnessCheck} /></div>
              <div><strong className="text-slate-500">Destination:</strong> {deliveryDetails.destinationName} ({deliveryDetails.destinationType})</div>
              <div><strong className="text-slate-500">Request Ref:</strong> {deliveryDetails.Request_id ? `#${deliveryDetails.Request_id}` : 'None (Warehouse)'}</div>
              <div><strong className="text-slate-500">Donor:</strong> {deliveryDetails.donorName}</div>
              <div><strong className="text-slate-500">Managing NGO:</strong> {deliveryDetails.ngoName}</div>
              <div><strong className="text-slate-500">Delivery Partner:</strong> {deliveryDetails.partnerName} ({deliveryDetails.partnerType})</div>
              <div><strong className="text-slate-500">Vehicle:</strong> {deliveryDetails.vehicleNo} ({deliveryDetails.vehicleType})</div>
              <div><strong className="text-slate-500">Pickup Time:</strong> {deliveryDetails.Pickup_DateTime || 'Pending'}</div>
              <div><strong className="text-slate-500">Delivery Time:</strong> {deliveryDetails.Delivery_DateTime || 'In Progress'}</div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">Loading delivery details...</div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Delivery Cancellation / Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete delivery{' '}
            <strong className="text-slate-800">#{activeDelivery?.Delivery_id}</strong>?
          </p>
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
