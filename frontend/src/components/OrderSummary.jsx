import React from 'react'

const OrderSummary = ({ cart, cartTotal, cartItemsCount, tax, finalTotal, error, loading, onSubmit }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Order Summary</h2>

      {/* Order Items */}
      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm">{item.image}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-900 truncate">{item.name}</h3>
              <p className="text-xs text-slate-500">{item.quantity} × LKR {item.price}</p>
            </div>
            <div className="text-sm font-medium text-slate-900">
              LKR {(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Order Totals */}
      <div className="border-t border-slate-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal ({cartItemsCount} items)</span>
          <span className="text-slate-900">LKR {cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">VAT (12%)</span>
          <span className="text-slate-900">LKR {tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold pt-2 border-t border-slate-200">
          <span className="text-slate-900">Total</span>
          <span className="text-emerald-600">LKR {finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Place Order Button */}
      <button
        type="submit"
        disabled={loading}
        onClick={onSubmit}
        className="w-full mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing Order...
          </div>
        ) : (
          `Place Order - LKR ${finalTotal.toFixed(2)}`
        )}
      </button>

      <p className="text-xs text-slate-500 text-center mt-3">
        By placing your order, you agree to our terms and conditions.
      </p>
    </div>
  )
}

export default OrderSummary