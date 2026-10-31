import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Building2,
  Users,
  PackagePlus,
  Inbox,
  Truck,
  TrendingUp,
  PieChart as PieIcon,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-base font-semibold text-slate-700">Connecting to MySQL Database...</h3>
        <p className="text-sm text-slate-400">Executing SQL aggregation queries</p>
      </div>
    );
  }

  const summary = stats?.summary || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live DBMS Telemetry
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Food Rescue Network Dashboard
          </h2>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Reducing food wastage across Surat by connecting food donors, partner NGOs, volunteer fleets, and verified beneficiaries in real time.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {error && (
        <Alert
          type="error"
          message={`Failed to query database: ${error}. Please verify MySQL service is running and credentials in backend/.env are configured.`}
        />
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Donors"
          value={summary.totalDonors}
          subtitle="Restaurants, Hotels & Individuals"
          icon={HeartHandshake}
          color="emerald"
        />
        <StatCard
          title="Partner NGOs"
          value={summary.totalNGOs}
          subtitle="Managing hubs & relief"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Beneficiaries"
          value={summary.totalBeneficiaries}
          subtitle="Shelters & communities"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Donations"
          value={summary.totalFoodDonations}
          badgeText={`${summary.pendingDonations || 0} Pending`}
          subtitle="Total donation entries"
          icon={PackagePlus}
          color="amber"
        />
        <StatCard
          title="Food Requests"
          value={summary.totalFoodRequests}
          badgeText={`${summary.openRequests || 0} Open`}
          subtitle="Community requests"
          icon={Inbox}
          color="rose"
        />
        <StatCard
          title="Deliveries"
          value={summary.totalDeliveries}
          badgeText={`${summary.completedDeliveries || 0} Done`}
          subtitle="Dispatched food units"
          icon={Truck}
          color="emerald"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Food Category Volume</h3>
              <p className="text-xs text-slate-500">Total donated food volume grouped by item category</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="h-64">
            {stats?.categoryDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryDistribution}>
                  <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="totalQuantity" fill="#10b981" radius={[6, 6, 0, 0]} name="Total Quantity" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No donation category data available.
              </div>
            )}
          </div>
        </div>

        {/* Donation Status Pie Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Donation Status Pipeline</h3>
              <p className="text-xs text-slate-500">Breakdown of donations across life cycle</p>
            </div>
            <PieIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="h-64">
            {stats?.donationsByStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.donationsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {stats.donationsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Rescue Trends */}
      {stats?.monthlyTrends?.length > 0 && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Monthly Donation Activity Trend</h3>
              <p className="text-xs text-slate-500">Timeline of rescued food volume recorded in MySQL</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyTrends}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="totalDonations"
                  stroke="#059669"
                  fillOpacity={1}
                  fill="url(#colorTrend)"
                  name="Total Donations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Donations */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Recent Food Donations
              </h3>
              <Link
                to="/donations"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.recentDonations?.length > 0 ? (
                stats.recentDonations.map((d) => (
                  <div
                    key={d.Donation_id}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">
                        {d.itemName} ({d.Quantity} {d.unit})
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        By <span className="font-medium text-slate-700">{d.donorName}</span> • {d.Donation_DateTime?.slice(0, 16)}
                      </div>
                    </div>
                    <StatusBadge status={d.Status} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No donations recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Latest Deliveries */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Recent Deliveries
              </h3>
              <Link
                to="/deliveries"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.recentDeliveries?.length > 0 ? (
                stats.recentDeliveries.map((del) => (
                  <div
                    key={del.Delivery_id}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">
                        #{del.Delivery_id} → {del.destination}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {del.itemName} ({del.Quantity} {del.unit}) • Partner: {del.partnerName}
                      </div>
                    </div>
                    <StatusBadge status={del.Status} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No deliveries assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
