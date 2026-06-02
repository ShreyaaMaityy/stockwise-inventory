import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  Minus,
  CheckCircle
} from 'lucide-react';
import dashboardService from '../services/dashboardService';
import DashboardCard from '../components/DashboardCard';
import Spinner from '../components/Spinner';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/formatters';

// Animation configs
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
      addNotification(err.message || 'Failed to fetch dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format today's date
  const getTodayString = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date());
  };

  // Render Skeleton Loaders
  const renderSkeletons = () => (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-850 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-slate-800 rounded-lg animate-pulse" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-slate-800 rounded" />
              <div className="h-10 w-10 bg-slate-800 rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-slate-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="h-[300px] bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
          <div className="h-[350px] bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-8">
          <div className="h-[350px] bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
          <div className="h-[300px] bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (loading && !stats) {
    return renderSkeletons();
  }

  // Calculate highest quantities sold for relative progress bar widths
  const maxSold = stats?.top_products?.length > 0 
    ? Math.max(...stats.top_products.map(p => p.total_sold)) 
    : 1;

  // Stock categories mapping for Recharts Pie Chart
  const chartData = stats?.stock_distribution?.filter(c => c.value > 0) || [];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <motion.h1 
            variants={itemVariants}
            className="text-3xl font-black tracking-tight text-white md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent"
          >
            Dashboard
          </motion.h1>
          <motion.div 
            variants={itemVariants}
            className="flex items-center gap-2 text-slate-400 mt-1.5 text-sm font-semibold"
          >
            <Calendar className="h-4 w-4 text-sky-400" />
            <span>{getTodayString()}</span>
            <span className="h-1 w-1 bg-slate-650 rounded-full" />
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
              Live Updates
            </span>
          </motion.div>
        </div>
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-sm font-bold text-slate-200 hover:text-white transition-all disabled:opacity-50 shadow-md cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </motion.button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button 
            onClick={fetchStats} 
            className="text-xs font-bold underline hover:text-rose-100 uppercase tracking-wider cursor-pointer"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Metrics Cards Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Total Revenue"
            value={formatCurrency(stats?.total_revenue ?? 0)}
            icon={DollarSign}
            color="emerald"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Catalog Items"
            value={stats?.total_products ?? 0}
            icon={Package}
            color="sky"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Total Customers"
            value={stats?.total_customers ?? 0}
            icon={Users}
            color="indigo"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DashboardCard
            title="Total Orders"
            value={stats?.total_orders ?? 0}
            icon={ShoppingCart}
            color="rose"
            loading={loading}
          />
        </motion.div>
      </motion.div>

      {/* Double Column Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column (2-wide on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stock Level Distribution Pie Chart */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between"
          >
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Stock Distribution</h2>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
                Overview of catalog products categorized by stock levels. Rose represents depleted stock.
              </p>
              
              <div className="grid grid-cols-3 gap-4 pt-2 max-w-sm">
                {stats?.stock_distribution?.map((cat) => (
                  <div key={cat.name} className="flex flex-col p-2.5 rounded-xl bg-slate-950 border border-slate-900">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cat.name}</span>
                    <span className="text-lg font-black text-white mt-1">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recharts Pie Chart representation */}
            <div className="h-52 w-full md:w-56 shrink-0 relative flex justify-center mt-6 md:mt-0">
              {chartData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-600 font-bold">
                  No Catalog Items
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">{stats?.total_products || 0}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total SKU</span>
              </div>
            </div>
          </motion.div>

          {/* Recent Orders SaaS Table */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/10">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Recent Orders</h2>
              </div>
              <button 
                onClick={() => navigate('/orders')} 
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                View Registry <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {stats?.recent_orders?.length === 0 ? (
              <div className="py-14 text-center px-4">
                <div className="p-3 rounded-full bg-slate-950 text-slate-600 border border-slate-900 mb-3 mx-auto w-fit">
                  <ShoppingCart className="h-6 w-6 stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-bold text-slate-400">No Orders Placed</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 font-semibold leading-relaxed">
                  Sales logs are currently empty. Registered customer orders will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/60 bg-slate-950/20 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                      <th className="px-6 py-3.5">Ref</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5 text-center">Items</th>
                      <th className="px-6 py-3.5 text-right">Amount</th>
                      <th className="px-6 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs font-semibold">
                    {stats?.recent_orders?.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-900/20 transition-colors group">
                        <td className="px-6 py-3.5 font-mono text-slate-400">#ORD-{String(order.id).padStart(5, '0')}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{order.customer_name}</span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{order.customer_email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center text-slate-300">{order.items_count}</td>
                        <td className="px-6 py-3.5 text-right text-emerald-400 font-bold">{formatCurrency(order.total_amount)}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex justify-center">
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/60 transition-all cursor-pointer"
                              title="Invoice Details"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

        </div>

        {/* Right column (1-wide on large screens) */}
        <div className="space-y-8">
          
          {/* Top Selling Products List with relative progress bars */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl flex flex-col h-[350px]"
          >
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800/60 mb-4 shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Top Sellers</h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {stats?.top_products?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="p-3 rounded-full bg-slate-950 text-slate-600 border border-slate-900 mb-3">
                    <TrendingUp className="h-5 w-5 stroke-[1.5]" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400">No Sales Data</h4>
                  <p className="text-[10px] text-slate-550 max-w-[180px] mt-1 font-semibold leading-relaxed">
                    Once orders are processed, your best performing items will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.top_products?.map((item) => {
                    const percentage = (item.total_sold / maxSold) * 100;
                    return (
                      <div key={item.product_id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <div className="font-bold text-slate-200 truncate max-w-[150px]">
                            {item.name}
                          </div>
                          <div className="text-slate-400 font-mono font-semibold">
                            {item.total_sold} units sold
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Low Stock Alerts Widget */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl flex flex-col h-[300px]"
          >
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800/60 mb-4 shrink-0 justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Stock Alerts</h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 font-bold">
                Low (&le; 10)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {stats?.low_stock_products?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                    <CheckCircle className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Stock Status: Normal</h4>
                  <p className="text-[10px] text-slate-500 max-w-[180px] mt-1 font-semibold leading-relaxed">
                    No catalog items are running low. All products exceed the minimum alert limit.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.low_stock_products?.map((p) => (
                    <div 
                      key={p.id} 
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-900 hover:border-slate-850 transition-colors"
                    >
                      <div className="truncate max-w-[120px]">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{p.name}</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">{p.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          p.quantity_in_stock === 0 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.quantity_in_stock} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>

      </div>

      {/* Activity Timeline (Chronological Feed of last orders/activity) */}
      <motion.div 
        variants={itemVariants}
        className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-6 shadow-xl"
      >
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800/60 mb-5">
          <Activity className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Recent Activity Timeline</h2>
        </div>

        {stats?.recent_orders?.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="p-3 rounded-full bg-slate-950 text-slate-600 border border-slate-900 mb-3">
              <Activity className="h-5 w-5 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-bold text-slate-400">No Recent Activity</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1 font-semibold leading-relaxed">
              Timeline is clean. Place orders or register catalog transactions to populate this feed.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-800 space-y-6">
            {stats?.recent_orders?.map((act, index) => (
              <div key={act.id} className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-950" />
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Order <span className="font-mono text-sky-400">#ORD-{String(act.id).padStart(5, '0')}</span> was placed by <span className="text-white font-bold">{act.customer_name}</span>.
                    </p>
                    <p className="text-xs text-slate-550 mt-0.5">
                      Purchased {act.items_count} items valued at <span className="text-emerald-400 font-bold">{formatCurrency(act.total_amount)}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold self-start sm:self-auto uppercase tracking-wide">
                    {formatDate(act.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;
