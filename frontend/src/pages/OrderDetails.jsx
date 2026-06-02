import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Trash2, 
  FileText
} from 'lucide-react';
import orderService from '../services/orderService';
import Spinner from '../components/Spinner';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/formatters';
import ConfirmModal from '../components/ConfirmModal';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const { addNotification } = useNotification();

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrder(id);
      setOrder(data);
    } catch (err) {
      addNotification(err.message || 'Failed to fetch order details.', 'error');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleOpenCancel = () => {
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    try {
      await orderService.deleteOrder(order.id);
      addNotification('Order cancelled, stock restored.', 'success');
      setCancelConfirmOpen(false);
      navigate('/orders');
    } catch (err) {
      addNotification(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Registry
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <FileText className="h-7 w-7 text-sky-400" />
            Receipt Details
          </h1>
          <p className="text-slate-400 font-mono text-xs mt-1 uppercase tracking-wider">
            Order Reference: #ORD-{String(order.id).padStart(5, '0')}
          </p>
        </div>
        <button
          onClick={handleOpenCancel}
          className="flex items-center justify-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-transparent text-sm font-semibold text-rose-400 hover:text-white transition-all shadow-md shadow-rose-950/20"
        >
          <Trash2 className="h-4 w-4" />
          Cancel Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-1">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800/60 mb-4">
              Customer Profile
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{order.customer_name}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Customer ID: {order.customer_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <Mail className="h-5 w-5 text-slate-500 shrink-0" />
                <span className="truncate">{order.customer_email}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800/60 mb-4">
              Order Timeline
            </h3>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-300">{formatDate(order.created_at)}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Processed successfully</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800/60 bg-slate-900/20">
              <h2 className="text-lg font-bold text-white">Line Items</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4 text-right">Unit Price</th>
                    <th className="px-6 py-4 text-center">Quantity</th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm font-medium">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 text-white font-bold">{item.product_name}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-400 text-xs bg-slate-900 px-2 py-1 rounded border border-slate-800/60 uppercase">
                          {item.product_sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-300">{formatCurrency(item.price_at_order)}</td>
                      <td className="px-6 py-4 text-center text-slate-200">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-slate-100 font-bold">
                        {formatCurrency(parseFloat(item.price_at_order) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Balance Charged:</div>
              <div className="text-2xl font-black text-emerald-400">{formatCurrency(order.total_amount)}</div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        loading={cancelLoading}
        title="Cancel Order"
        message={`Are you sure you want to cancel Order #ORD-${String(order?.id).padStart(5, '0')} for ${order?.customer_name}? Product stock counts from this order will be automatically restored to the inventory.`}
      />
    </div>
  );
};

export default OrderDetails;
