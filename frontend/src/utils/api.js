import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Products
export const fetchProducts = () => API.get("/products");
export const addProduct = (data) => API.post("/products", data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);
// Categories
export const fetchCategories = () => API.get("/categories");
export const addCategory = (data) => API.post("/categories", data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Orders
export const fetchOrders = () => API.get("/orders");
export const createOrder = (data) => API.post("/orders", data);
export const updateOrder = (id, data) => API.put(`/orders/${id}`, data);
export const deleteOrder = (id) => API.delete(`/orders/${id}`);

// Purchases
export const fetchPurchases = () => API.get("/purchases");
export const addPurchase = (data) => API.post("/purchases", data);
export const deletePurchase = (id) => API.delete(`/purchases/${id}`);

// Credit/Purchase Entries
export const fetchCreditPurchases = () => API.get("/credit-purchases");
export const addCreditPurchase = (data) => API.post("/credit-purchases", data);
export const updateCreditPurchase = (id, data) => API.put(`/credit-purchases/${id}`, data);
export const deleteCreditPurchase = (id) => API.delete(`/credit-purchases/${id}`);


// Customers
export const fetchCustomer = (mobile) => API.get(`/customers/${mobile}`);


// Staff Expenses
export const fetchStaffExpenses = () => API.get("/staffexpenses");
export const addStaffExpense = (data) => API.post("/staffexpenses", data);
export const deleteStaffExpense = (id) => API.delete(`/staffexpenses/${id}`);

// Shop Expenses (EMI / Rent / Room Rent)
export const fetchShopExpenses = () => API.get("/shopexpenses");
export const addShopExpense = (data) => API.post("/shopexpenses", data);
export const deleteShopExpense = (id) => API.delete(`/shopexpenses/${id}`);

// Analytics
export const fetchTodaySales = () => API.get("/analytics/today-sales");

// Settings
export const getMobileFieldSetting = () => API.get("/settings/mobile-field");
export const setMobileFieldSetting = (showMobileField) =>
  API.post("/settings/mobile-field", { showMobileField });

export const getOffersInBillingSetting = () => API.get("/settings/offers-in-billing");
export const setOffersInBillingSetting = (showOffersInBilling) =>
  API.post("/settings/offers-in-billing", { showOffersInBilling });

export default API;


