import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, CheckCircle, ChefHat, Package, XCircle,
  Check, Truck, ChevronDown, ChevronUp, Receipt, Printer, X
} from 'lucide-react'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import { useSelector } from 'react-redux'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const OrderManagement = () => {
  const navigate = useNavigateWithParams()
  const restaurant = useSelector(state => state.restaurant?.currentRestaurant)
  const restaurantName = restaurant?.name || 'Restaurant'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('active')

  // Bill modal
  const [billModal, setBillModal] = useState(null) // order object
  const [billOrders, setBillOrders] = useState([]) // all orders of same session

  useEffect(() => {
    fetchOrders()
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      fetchOrders()
    }, 15000)
    return () => clearInterval(intervalId)
  }, [filterStatus])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let endpoint = '/admin/orders/active'
      if (filterStatus === 'all') endpoint = '/admin/orders'
      else if (filterStatus === 'today') endpoint = '/admin/orders/today'
      else if (filterStatus === 'completed') endpoint = '/admin/orders?status=served'
      else if (filterStatus === 'cancelled') endpoint = '/admin/orders?status=cancelled'

      const response = await apiClient.get(endpoint)
      if (response.data.success) setOrders(response.data.data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // Open bill — fetch orders for this specific user at this table today
  const openBill = async (order) => {
    setBillModal(order)
    setBillOrders([])
    try {
      const params = new URLSearchParams()
      if (order.user_id) params.set('userId', order.user_id)
      else if (order.session_id) params.set('sessionId', order.session_id)

      const res = await apiClient.get(`/admin/orders/table/${order.table_number}?${params.toString()}`)
      if (res.data.success) {
        const allOrders = res.data.data?.orders || []
        // No fallback — empty means all orders already billed
        setBillOrders(allOrders)
      }
    } catch (e) {
      setBillOrders([order])
    }
  }

  const closeBill = () => { setBillModal(null); setBillOrders([]) }

  // Mark all bill orders as paid/billed
  const markAsPaid = async () => {
    const orderIds = billOrders.map(o => o.id)
    try {
      await apiClient.patch('/admin/orders/mark-billed', { orderIds })
      toast.success('Bill marked as paid ✅')
      closeBill()
      fetchOrders()
    } catch (e) {
      toast.error('Failed to mark as paid')
    }
  }

  // Print bill — thermal receipt style using window.open()
  const printBill = () => {
    const itemsHTML = billAllItems.map(item => `
      <tr>
        <td style="padding:5px 0;border-bottom:1px solid #eee;font-size:12px">${item.product_name}</td>
        <td style="padding:5px 0;border-bottom:1px solid #eee;text-align:center;color:#555;font-size:12px">${item.quantity}</td>
        <td style="padding:5px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;font-size:12px">&#8377;${(item.subtotal || (item.product_price || item.price_at_time || 0) * item.quantity).toFixed(0)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Bill - Table ${billModal.table_number}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    html, body { width: 80mm; height: auto; margin: 0; padding: 0; overflow: hidden; }
    body { font-family: 'Courier New', monospace; width: 72mm; padding: 4mm; font-size: 12px; }
    * { box-sizing: border-box; }
    .restaurant-name { text-align: center; font-size: 15px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
    .divider { border: none; border-top: 1px dashed #999; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; color: #888; text-transform: uppercase; padding-bottom: 3px; border-bottom: 1px solid #ccc; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3) { text-align: right; }
    td { padding: 4px 0; border-bottom: 1px solid #eee; font-size: 12px; }
    td:nth-child(2) { text-align: center; color: #555; }
    td:nth-child(3) { text-align: right; font-weight: 600; }
    .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 5px; border-top: 2px solid #111; }
    .total-label { font-size: 13px; font-weight: bold; }
    .total-amount { font-size: 17px; font-weight: bold; }
    .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 8px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="restaurant-name">&#127374; ${restaurantName}</div>
  <hr class="divider"/>
  <div style="margin-bottom:5px">
    <div style="font-size:13px;font-weight:bold">Table ${billModal.table_number}</div>
    <div style="font-size:10px;color:#555;margin-top:2px">
      ${billModal.user_name || 'Guest'} &bull;
      ${new Date(billModal.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})} &bull;
      ${new Date(billModal.created_at).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}
    </div>
    <div style="font-size:10px;color:#aaa;margin-top:1px">${billOrders.length} order${billOrders.length > 1 ? 's' : ''}</div>
  </div>
  <hr class="divider"/>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Amt</th></tr></thead>
    <tbody>${itemsHTML}</tbody>
  </table>
  <div class="total-row">
    <span class="total-label">Grand Total</span>
    <span class="total-amount">&#8377;${billTotal.toFixed(0)}</span>
  </div>
  <div class="footer">
    - - - - - - - - - - - - - - -<br/>
    Thank you for dining with us!<br/>
    Please visit again &#128591;
  </div>
</body>
</html>`

    const printWindow = window.open('', '_blank', 'width=350,height=500')
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site.')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId)
      const response = await apiClient.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
      if (response.data.success) {
        if (newStatus === 'confirmed') toast.success('Order accepted!')
        else if (newStatus === 'served') toast.success('Order delivered!')
        else if (newStatus === 'cancelled') toast.success('Order cancelled!')
        await fetchOrders()
        // Refresh bill if open
        if (billModal) {
          const updated = orders.find(o => o.id === billModal.id) || billModal
          await openBill(updated)
        }
      }
    } catch (error) {
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'preparing': return 'bg-orange-100 text-orange-700'
      case 'ready': return 'bg-green-100 text-green-700'
      case 'served': return 'bg-purple-100 text-purple-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock
      case 'confirmed': return CheckCircle
      case 'preparing': return ChefHat
      case 'ready': return Package
      case 'served': return CheckCircle
      case 'completed': return CheckCircle
      case 'cancelled': return XCircle
      default: return Clock
    }
  }

  // Bill grand total
  const billTotal = billOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const billAllItems = billOrders.flatMap(o => (o.items || []).map(i => ({ ...i, orderUUID: o.uuid })))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold">All Orders</h1>
                <p className="text-sm text-gray-400">Manage all restaurant orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-gray-400">Orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Tabs — Bill button is here alongside other tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2 overflow-x-auto">
          {[
            { key: 'active', label: 'Active Orders' },
            { key: 'today', label: "Today's Orders" },
            { key: 'all', label: 'All Orders' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterStatus === tab.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500">No orders match the selected filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              const isExpanded = expandedOrder === order.id
              const isUpdating = updatingOrder === order.id

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">#{order.uuid?.slice(-6)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.user_name || 'Guest'} • Table {order.table_number || 'N/A'}
                        </p>
                      </div>
                      {/* Bill button — next to status icon */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openBill(order)}
                          title="View Bill"
                          className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors"
                        >
                          <Receipt size={16} />
                        </button>
                        <StatusIcon size={20} className="text-gray-400" />
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
                            <span className="font-medium">{item.quantity}x</span>
                            <span>{item.product_name}</span>
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <span className="text-lg font-bold text-gray-900">₹{order.total_amount}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            disabled={isUpdating}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Check size={16} />
                            {isUpdating ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            disabled={isUpdating}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {['confirmed', 'preparing', 'ready'].includes(order.status) && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                            disabled={isUpdating}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Truck size={16} />
                            {isUpdating ? 'Delivering...' : 'Deliver'}
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            disabled={isUpdating}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {['served', 'cancelled'].includes(order.status) && (
                        <div className="flex-1 text-center py-2 text-sm text-gray-500">
                          Order {order.status === 'served' ? 'completed' : order.status}
                        </div>
                      )}
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                      <div className="pt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Order Details:</p>
                        {order.items?.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-1">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                  {item.quantity}
                                </span>
                                <span className="text-gray-900">{item.product_name || 'Unknown Item'}</span>
                              </div>
                              <span className="text-gray-600 font-medium">
                                ₹{(item.product_price || item.price_at_time || 0) * item.quantity}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No items found</p>
                        )}
                        {order.special_instructions && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Special Instructions:</p>
                            <p className="text-sm text-gray-600">{order.special_instructions}</p>
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Total:</span>
                          <span className="text-lg font-bold text-gray-900">₹{order.total_amount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── BILL MODAL ── */}
      <AnimatePresence>
        {billModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 print:hidden"
              onClick={closeBill}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden"
                onClick={e => e.stopPropagation()}
                id="bill-print-area"
              >
                {/* Bill Header */}
                <div className="bg-gray-900 text-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Customer Bill</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={printBill}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="Print Bill"
                      >
                        <Printer size={18} />
                      </button>
                      <button onClick={closeBill} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">Table {billModal.table_number}</p>
                    <p className="text-gray-300 text-sm mt-0.5 bill-meta">
                      {billModal.user_name || 'Guest'} •{' '}
                      {new Date(billModal.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {billOrders.length} order{billOrders.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Items — visible in modal */}
                <div className="p-5 max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left pb-2 text-gray-500 font-medium">Item</th>
                        <th className="text-center pb-2 text-gray-500 font-medium w-10">Qty</th>
                        <th className="text-right pb-2 text-gray-500 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billAllItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="py-2 text-gray-900">{item.product_name}</td>
                          <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-right font-medium text-gray-900">
                            ₹{(item.subtotal || (item.product_price || item.price_at_time || 0) * item.quantity).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total + Actions */}
                <div className="px-5 pb-5 border-t-2 border-gray-900">
                  <div className="flex justify-between items-center pt-4 mb-4">
                    <span className="text-lg font-bold text-gray-900">Grand Total</span>
                    <span className="text-2xl font-bold text-gray-900">₹{billTotal.toFixed(0)}</span>
                  </div>
                  <div className="flex gap-3">
                    {billOrders.length > 0 ? (
                      <>
                        <button
                          onClick={markAsPaid}
                          className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          ✅ Mark as Paid
                        </button>
                        <button
                          onClick={printBill}
                          className="flex-1 py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <Printer size={16} /> Print Bill
                        </button>
                      </>
                    ) : (
                      <div className="w-full space-y-2">
                        <div className="py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm text-center font-medium">
                          ✅ Bill already cleared
                        </div>
                        <button
                          onClick={printBill}
                          className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <Printer size={16} /> Print Receipt
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Marking as paid will clear this bill</p>
                  <p className="text-xs text-gray-400 mt-2 text-center">Marking as paid will clear this bill</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
