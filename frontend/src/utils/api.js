import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Products
export const fetchProducts = () => API.get("/products");
export const addProduct = (data) => API.post("/products", data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// Orders
export const fetchOrders = () => API.get("/orders");
export const createOrder = (data) => API.post("/orders", data);
export const deleteOrder = (id) => API.delete(`/orders/${id}`);

// Purchases
export const fetchPurchases = () => API.get("/purchases");
export const addPurchase = (data) => API.post("/purchases", data);
export const deletePurchase = (id) => API.delete(`/purchases/${id}`);

// Customers
export const fetchCustomer = (mobile) => API.get(`/customers/${mobile}`);

// Staff Expenses
export const fetchStaffExpenses = () => API.get("/staffexpenses");
export const addStaffExpense = (data) => API.post("/staffexpenses", data);
export const deleteStaffExpense = (id) => API.delete(`/staffexpenses/${id}`);

// Analytics
export const fetchTodaySales = () => API.get("/analytics/today-sales");

export default API;
