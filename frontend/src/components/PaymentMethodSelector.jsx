import React from 'react'

const PaymentMethodSelector = ({ paymentMethod, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <label className="relative">
        <input
          type="radio"
          name="paymentMethod"
          value="cash"
          checked={paymentMethod === 'cash'}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="p-4 border-2 border-slate-200 rounded-xl cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:border-slate-300 transition-colors">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-slate-200 rounded-full mr-3 peer-checked:bg-emerald-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <div className="font-medium text-slate-900">Cash on Delivery</div>
              <div className="text-sm text-slate-500">Pay when you receive your order</div>
            </div>
          </div>
        </div>
      </label>

      <label className="relative">
        <input
          type="radio"
          name="paymentMethod"
          value="card"
          checked={paymentMethod === 'card'}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="p-4 border-2 border-slate-200 rounded-xl cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:border-slate-300 transition-colors">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-slate-200 rounded-full mr-3 peer-checked:bg-emerald-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <div className="font-medium text-slate-900">Credit/Debit Card</div>
              <div className="text-sm text-slate-500">Visa, MasterCard, AMEX</div>
            </div>
          </div>
        </div>
      </label>

      <label className="relative">
        <input
          type="radio"
          name="paymentMethod"
          value="bank_transfer"
          checked={paymentMethod === 'bank_transfer'}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="p-4 border-2 border-slate-200 rounded-xl cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:border-slate-300 transition-colors">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-slate-200 rounded-full mr-3 peer-checked:bg-emerald-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <div className="font-medium text-slate-900">Bank Transfer</div>
              <div className="text-sm text-slate-500">BOC, Peoples Bank, Commercial Bank</div>
            </div>
          </div>
        </div>
      </label>

      <label className="relative">
        <input
          type="radio"
          name="paymentMethod"
          value="mobile"
          checked={paymentMethod === 'mobile'}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="p-4 border-2 border-slate-200 rounded-xl cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:border-slate-300 transition-colors">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-slate-200 rounded-full mr-3 peer-checked:bg-emerald-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <div className="font-medium text-slate-900">Mobile Payment</div>
              <div className="text-sm text-slate-500">eZ Cash, mCash, Genie</div>
            </div>
          </div>
        </div>
      </label>
    </div>
  )
}

export default PaymentMethodSelector