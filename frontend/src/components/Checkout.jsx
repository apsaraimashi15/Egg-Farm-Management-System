import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import AddressForm from "./AddressForm";
import PaymentMethodSelector from "./PaymentMethodSelector";
import CardPaymentForm from "./CardPaymentForm";
import BankTransferForm from "./BankTransferForm";
import MobilePaymentForm from "./MobilePaymentForm";
import OrderSummary from "./OrderSummary";
import axios from "axios";

const Checkout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Sri Lankan address state
  const [address, setAddress] = useState({
    fullName: "",
    phoneNumber: "",
    street: "",
    city: "",
    district: "",
    province: "",
    postalCode: "",
    nic: "", // National Identity Card (optional)
  });

  // Validation errors state for real-time feedback
  const [fieldErrors, setFieldErrors] = useState({});

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  // Bank transfer details
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
  });

  // Mobile payment details
  const [mobilePayment, setMobilePayment] = useState({
    provider: "ezcash", // ezcash, mcash, etc.
    mobileNumber: "",
    accountHolderName: "",
  });

  useEffect(() => {
    // Get cart from localStorage or state management
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      // If no cart, redirect back to store
      navigate("/store");
    }
  }, [navigate]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(""), 5000);
  };

  // Real-time validation functions
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };

    switch (name) {
      case "fullName": {
        if (!value || value.trim().length < 2) {
          errors.fullName = "Name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s\-.'+]$/.test(value.trim())) {
          errors.fullName =
            "Name can only contain letters, spaces, hyphens, apostrophes, and periods";
        } else {
          delete errors.fullName;
        }
        break;
      }

      case "phoneNumber": {
        const phoneRegex = /^(\+94|0)[0-9]{9}$/;
        if (!value) {
          errors.phoneNumber = "Phone number is required";
        } else if (!phoneRegex.test(value)) {
          errors.phoneNumber =
            "Please enter a valid Sri Lankan phone number (+94712345678 or 0712345678)";
        } else {
          delete errors.phoneNumber;
        }
        break;
      }

      case "street": {
        if (!value || value.trim().length < 5) {
          errors.street = "Street address must be at least 5 characters";
        } else {
          delete errors.street;
        }
        break;
      }

      case "city": {
        if (!value || value.trim().length < 2) {
          errors.city = "City name is required";
        } else {
          delete errors.city;
        }
        break;
      }

      case "district": {
        if (!value) {
          errors.district = "Please select your district";
        } else {
          delete errors.district;
        }
        break;
      }

      case "province": {
        if (!value) {
          errors.province = "Please select your province";
        } else {
          delete errors.province;
        }
        break;
      }

      case "postalCode": {
        const postalRegex = /^[0-9]{5}$/;
        if (!value) {
          errors.postalCode = "Postal code is required";
        } else if (!postalRegex.test(value)) {
          errors.postalCode = "Please enter a valid 5-digit postal code";
        } else {
          delete errors.postalCode;
        }
        break;
      }

      case "nic": {
        if (value && value.trim()) {
          const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
          if (!nicRegex.test(value.trim())) {
            errors.nic =
              "Please enter a valid NIC number (9 digits + V/X or 12 digits)";
          } else {
            delete errors.nic;
          }
        } else {
          delete errors.nic;
        }
        break;
      }

      // Payment validation
      case "cardholderName": {
        // Only allow letters, spaces, and common name characters
        const nameRegex = /^[a-zA-Z\s\-.'+]$/;
        if (!value || value.trim().length < 2) {
          errors.cardholderName = "Cardholder name is required";
        } else if (value.length > 50) {
          errors.cardholderName =
            "Cardholder name must be less than 50 characters";
        } else if (!nameRegex.test(value)) {
          errors.cardholderName =
            "Cardholder name can only contain letters, spaces, hyphens, apostrophes, and periods";
        } else {
          delete errors.cardholderName;
        }
        break;
      }

      case "cardNumber": {
        // Remove spaces for validation
        const cleanNumber = value.replace(/\s/g, "");
        if (!cleanNumber) {
          errors.cardNumber = "Card number is required";
        } else if (!/^\d+$/.test(cleanNumber)) {
          errors.cardNumber = "Card number can only contain numbers";
        } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
          errors.cardNumber = "Card number must be between 13-19 digits";
        } else if (!isValidCardNumber(cleanNumber)) {
          errors.cardNumber = "Invalid card number";
        } else {
          delete errors.cardNumber;
        }
        break;
      }

      case "expiryDate": {
        // This is now handled by separate month/year validation
        // The combined expiryDate is set by the CardPaymentForm component
        break;
      }

      case "cvv": {
        if (!value) {
          errors.cvv = "CVV is required";
        } else if (!/^\d+$/.test(value)) {
          errors.cvv = "CVV can only contain numbers";
        } else if (value.length < 3 || value.length > 4) {
          errors.cvv = "CVV must be 3 or 4 digits";
        } else {
          delete errors.cvv;
        }
        break;
      }

      case "bankName": {
        if (!value) {
          errors.bankName = "Please select your bank";
        } else {
          delete errors.bankName;
        }
        break;
      }

      case "accountHolderName": {
        if (!value || value.trim().length < 2) {
          errors.accountHolderName = "Account holder name is required";
        } else {
          delete errors.accountHolderName;
        }
        break;
      }

      case "accountNumber": {
        const accountRegex = /^[0-9]{8,20}$/;
        if (!value) {
          errors.accountNumber = "Account number is required";
        } else if (!accountRegex.test(value.replace(/\s+/g, ""))) {
          errors.accountNumber =
            "Please enter a valid account number (8-20 digits)";
        } else {
          delete errors.accountNumber;
        }
        break;
      }

      case "provider": {
        if (!value) {
          errors.provider = "Please select a mobile payment provider";
        } else {
          delete errors.provider;
        }
        break;
      }

      case "mobilePaymentAccountHolderName": {
        if (!value || value.trim().length < 2) {
          errors.mobilePaymentAccountHolderName =
            "Account holder name is required";
        } else {
          delete errors.mobilePaymentAccountHolderName;
        }
        break;
      }

      case "mobilePaymentMobileNumber": {
        const mobilePhoneRegex = /^(\+94|0)[0-9]{9}$/;
        if (!value) {
          errors.mobilePaymentMobileNumber = "Mobile number is required";
        } else if (!mobilePhoneRegex.test(value)) {
          errors.mobilePaymentMobileNumber =
            "Please enter a valid mobile number";
        } else {
          delete errors.mobilePaymentMobileNumber;
        }
        break;
      }

      default:
        break;
    }

    setFieldErrors(errors);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    validateField(name, value);
  };

  const handleCardDetailsChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    validateField(name, value);
  };

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    validateField(name, value);
  };

  const handleMobilePaymentChange = (e) => {
    const { name, value } = e.target;
    setMobilePayment((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation with specific naming for mobile payment fields
    if (name === "accountHolderName") {
      validateField("mobilePaymentAccountHolderName", value);
    } else if (name === "mobileNumber") {
      validateField("mobilePaymentMobileNumber", value);
    } else {
      validateField(name, value);
    }
  };

  const handleCardValidationChange = (fieldName, isValid, errorMessage) => {
    const errors = { ...fieldErrors };

    if (isValid) {
      delete errors[fieldName];
    } else if (errorMessage) {
      errors[fieldName] = errorMessage;
    } else {
      // If not valid and no error message provided, set a default error
      switch (fieldName) {
        case "cardholderName":
          errors[fieldName] =
            "Cardholder name must be at least 2 characters and contain only letters";
          break;
        case "cardNumber":
          errors[fieldName] = "Please enter a valid card number";
          break;
        case "expiryDate":
          errors[fieldName] =
            "Please select a valid expiry date (not in the past)";
          break;
        case "cvv":
          errors[fieldName] = "CVV must be 3 or 4 digits";
          break;
        default:
          errors[fieldName] = "This field is required";
      }
    }

    setFieldErrors(errors);
  };

  const handleAddressValidationChange = (fieldName, isValid, errorMessage) => {
    const errors = { ...fieldErrors };

    if (isValid) {
      delete errors[fieldName];
    } else if (errorMessage) {
      errors[fieldName] = errorMessage;
    } else {
      // If not valid and no error message provided, set a default error
      switch (fieldName) {
        case "fullName":
          errors[fieldName] = "Name must be at least 2 characters";
          break;
        case "phoneNumber":
          errors[fieldName] =
            "Please enter a valid Sri Lankan phone number (+94712345678 or 0712345678)";
          break;
        case "street":
          errors[fieldName] = "Street address must be at least 5 characters";
          break;
        case "city":
          errors[fieldName] = "City name is required";
          break;
        case "district":
          errors[fieldName] = "Please select your district";
          break;
        case "province":
          errors[fieldName] = "Please select your province";
          break;
        case "postalCode":
          errors[fieldName] = "Please enter a valid 5-digit postal code";
          break;
        case "nic":
          errors[fieldName] =
            "Please enter a valid NIC number (9 digits + V/X or 12 digits)";
          break;
        default:
          errors[fieldName] = "This field is required";
      }
    }

    setFieldErrors(errors);
  };

  // Luhn algorithm for credit card validation
  const isValidCardNumber = (cardNumber) => {
    let sum = 0;
    let shouldDouble = false;

    // Loop through digits from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  };

  // Validate expiry date is not in the past
  const isValidExpiryDate = (expiryDate) => {
    const [month, year] = expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (
      expYear < currentYear ||
      (expYear === currentYear && expMonth < currentMonth)
    ) {
      return false;
    }

    return true;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    // Check for any field validation errors from real-time validation
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;
    if (hasFieldErrors) {
      setError("Please correct the errors in the form before submitting");
      return;
    }

    // Additional basic validation for required fields
    if (!address.fullName || address.fullName.trim().length < 2) {
      setError("Please enter a valid full name (minimum 2 characters)");
      return;
    }

    if (
      !address.phoneNumber ||
      !/^(\+94|0)[0-9]{9}$/.test(address.phoneNumber)
    ) {
      setError(
        "Please enter a valid Sri Lankan phone number (e.g., +94712345678 or 0712345678)"
      );
      return;
    }

    if (!address.street || address.street.trim().length < 5) {
      setError("Please enter a complete street address (minimum 5 characters)");
      return;
    }

    if (!address.city || address.city.trim().length < 2) {
      setError("Please enter a valid city name");
      return;
    }

    if (!address.district) {
      setError("Please select your district");
      return;
    }

    if (!address.province) {
      setError("Please select your province");
      return;
    }

    if (!address.postalCode || !/^[0-9]{5}$/.test(address.postalCode)) {
      setError("Please enter a valid 5-digit postal code");
      return;
    }

    // Validate payment method specific fields
    if (paymentMethod === "card") {
      if (
        !cardDetails.cardholderName ||
        cardDetails.cardholderName.trim().length < 2
      ) {
        setError("Please enter the cardholder name");
        return;
      }

      if (
        !cardDetails.cardNumber ||
        !isValidCardNumber(cardDetails.cardNumber.replace(/\s+/g, ""))
      ) {
        setError("Please enter a valid card number");
        return;
      }

      if (
        !cardDetails.expiryDate ||
        !isValidExpiryDate(cardDetails.expiryDate)
      ) {
        setError("Please select a valid expiry date (not in the past)");
        return;
      }

      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        setError("Please enter the CVV (3 or 4 digits)");
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      // Transform cart items to purchase format
      const items = cart.map((item) => ({
        productType: item.category,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      }));

      const purchaseData = {
        items,
        address: {
          ...address,
          country: "Sri Lanka",
        },
        paymentMethod,
        notes: `Payment method: ${paymentMethod}${
          paymentMethod === "mobile" ? ` (${mobilePayment.provider})` : ""
        }`,
      };

      const response = await axios.post(
        "http://localhost:5000/api/purchases",
        purchaseData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        // Clear cart
        localStorage.removeItem("cart");
        setCart([]);

        showNotification(
          "Order placed successfully! You will receive a confirmation email shortly.",
          "success"
        );

        // Redirect to order confirmation page or back to store
        setTimeout(() => {
          navigate("/store");
        }, 2000);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to place order. Please try again.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  // Sri Lankan tax rate (VAT is typically 15% in Sri Lanka, but let's use 12% for this system)
  const tax = cartTotal * 0.12;
  const finalTotal = cartTotal + tax;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13l1.1-5m8.9 5L17 18"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-slate-500 mb-6">
              Add some products to your cart before checking out.
            </p>
            <button
              onClick={() => navigate("/store")}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in ${
            notification.type === "error"
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                notification.type === "error"
                  ? "M6 18L18 6M6 6l12 12"
                  : "M5 13l4 4L19 7"
              }
            />
          </svg>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="lg:ml-64">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-white/20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Checkout</h1>
            <button
              onClick={() => navigate("/store")}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          </div>
        </div>

        <main className="p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Checkout
              </h1>
              <p className="text-slate-600">Complete your order</p>
            </div>

            <form
              onSubmit={handleSubmitOrder}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column - Shipping & Payment */}
              <div className="lg:col-span-2 space-y-8">
                {/* Sri Lankan Address */}
                <AddressForm
                  address={address}
                  fieldErrors={fieldErrors}
                  onChange={handleAddressChange}
                  onValidationChange={handleAddressValidationChange}
                />

                {/* Payment Method */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">
                    Payment Method
                  </h2>

                  {/* Payment Method Selection */}
                  <PaymentMethodSelector
                    paymentMethod={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />

                  {/* Card Details */}
                  {paymentMethod === "card" && (
                    <CardPaymentForm
                      cardDetails={cardDetails}
                      fieldErrors={fieldErrors}
                      onChange={handleCardDetailsChange}
                      onValidationChange={handleCardValidationChange}
                    />
                  )}

                  {/* Bank Transfer Details */}
                  {paymentMethod === "bank_transfer" && (
                    <BankTransferForm
                      bankDetails={bankDetails}
                      fieldErrors={fieldErrors}
                      onChange={handleBankDetailsChange}
                    />
                  )}

                  {/* Mobile Payment Details */}
                  {paymentMethod === "mobile" && (
                    <MobilePaymentForm
                      mobilePayment={mobilePayment}
                      fieldErrors={fieldErrors}
                      onChange={handleMobilePaymentChange}
                    />
                  )}
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <OrderSummary
                  cart={cart}
                  cartTotal={cartTotal}
                  cartItemsCount={cartItemsCount}
                  tax={tax}
                  finalTotal={finalTotal}
                  error={error}
                  loading={loading}
                  onSubmit={handleSubmitOrder}
                />
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Checkout;
