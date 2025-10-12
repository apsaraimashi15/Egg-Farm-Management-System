import React, { useState } from "react";

const BankTransferForm = ({ bankDetails, fieldErrors, onChange }) => {
  const [accountHolderName, setAccountHolderName] = useState(
    bankDetails.accountHolderName || ""
  );
  const [accountNumber, setAccountNumber] = useState(
    bankDetails.accountNumber || ""
  );

  // Input handlers with validation
  const handleAccountHolderNameChange = (e) => {
    const value = e.target.value;
    // Only allow letters, spaces, hyphens, apostrophes, and periods
    const filteredValue = value.replace(/[^a-zA-Z\s\-'.]/g, "");

    setAccountHolderName(filteredValue);

    onChange({
      ...e,
      target: {
        ...e.target,
        name: "accountHolderName",
        value: filteredValue,
      },
    });
  };

  const handleAccountNumberChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and spaces, format with spaces for readability
    let filteredValue = value.replace(/[^\d]/g, "");

    // Add spaces every 4 digits for better readability
    filteredValue = filteredValue.replace(/(\d{4})(?=\d)/g, "$1 ");

    // Limit to reasonable account number length (20 digits)
    if (filteredValue.replace(/\s/g, "").length > 20) {
      filteredValue = filteredValue.substring(0, 24); // 20 digits + 4 spaces
    }

    setAccountNumber(filteredValue);

    onChange({
      ...e,
      target: {
        ...e.target,
        name: "accountNumber",
        value: filteredValue,
      },
    });
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Bank Name
        </label>
        <select
          name="bankName"
          value={bankDetails.bankName}
          onChange={onChange}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            fieldErrors.bankName ? "border-red-300" : "border-slate-300"
          }`}
          required
        >
          <option value="">Select Your Bank</option>
          <option value="Bank of Ceylon">Bank of Ceylon (BOC)</option>
          <option value="Peoples Bank">Peoples Bank</option>
          <option value="Commercial Bank">Commercial Bank of Ceylon</option>
          <option value="Hatton National Bank">
            Hatton National Bank (HNB)
          </option>
          <option value="National Savings Bank">National Savings Bank</option>
          <option value="Sampath Bank">Sampath Bank</option>
          <option value="Seylan Bank">Seylan Bank</option>
          <option value="Union Bank">Union Bank of Colombo</option>
          <option value="NTB">Nations Trust Bank (NTB)</option>
          <option value="DFCC Bank">DFCC Bank</option>
          <option value="Pan Asia Bank">Pan Asia Banking Corporation</option>
        </select>
        {fieldErrors.bankName && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.bankName}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Account Holder Name
        </label>
        <input
          type="text"
          name="accountHolderName"
          value={accountHolderName}
          onChange={handleAccountHolderNameChange}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            fieldErrors.accountHolderName
              ? "border-red-300"
              : "border-slate-300"
          }`}
          placeholder="Account holder name"
          required
        />
        {fieldErrors.accountHolderName && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.accountHolderName}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Account Number
        </label>
        <input
          type="text"
          name="accountNumber"
          value={accountNumber}
          onChange={handleAccountNumberChange}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            fieldErrors.accountNumber ? "border-red-300" : "border-slate-300"
          }`}
          placeholder="1234 5678 9012 3456"
          required
        />
        {fieldErrors.accountNumber && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.accountNumber}
          </p>
        )}
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          Bank Transfer Instructions
        </h4>
        <p className="text-sm text-blue-800">
          Please transfer the payment to our account. You will receive account
          details via SMS after placing the order.
        </p>
      </div>
    </div>
  );
};

export default BankTransferForm;
