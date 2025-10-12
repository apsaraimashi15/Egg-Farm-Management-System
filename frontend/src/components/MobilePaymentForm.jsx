import React from "react";

const MobilePaymentForm = ({ mobilePayment, fieldErrors, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Mobile Payment Provider
        </label>
        <select
          name="provider"
          value={mobilePayment.provider}
          onChange={onChange}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            fieldErrors.provider ? "border-red-300" : "border-slate-300"
          }`}
          required
        >
          <option value="ezcash">eZ Cash (Dialog)</option>
          <option value="mcash">mCash (Mobitel)</option>
          <option value="genie">Genie (Airtel)</option>
          <option value="hutch">Hutch Pay (Hutch)</option>
        </select>
        {fieldErrors.provider && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.provider}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Account Holder Name
        </label>
        <input
          type="text"
          name="accountHolderName"
          value={mobilePayment.accountHolderName}
          onChange={onChange}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            fieldErrors.mobilePaymentAccountHolderName
              ? "border-red-300"
              : "border-slate-300"
          }`}
          placeholder="Name registered with mobile account"
          required
        />
        {fieldErrors.mobilePaymentAccountHolderName && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.mobilePaymentAccountHolderName}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Mobile Number
        </label>
        <input
          type="tel"
          name="mobileNumber"
          value={mobilePayment.mobileNumber}
          onChange={onChange}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            fieldErrors.mobilePaymentMobileNumber
              ? "border-red-300"
              : "border-slate-300"
          }`}
          placeholder="+94712345678 or 0712345678"
          required
        />
        {fieldErrors.mobilePaymentMobileNumber && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.mobilePaymentMobileNumber}
          </p>
        )}
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">
          Mobile Payment Instructions
        </h4>
        <p className="text-sm text-green-800">
          You will receive a payment request via SMS. Please complete the
          payment using your mobile app or by dialing the USSD code.
        </p>
      </div>
    </div>
  );
};

export default MobilePaymentForm;
