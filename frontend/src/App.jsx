import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import BillingScreen from "./billing/BillingScreen";
import Dashboard from "./admin/Dashboard";
import Products from "./admin/Products";
import Orders from "./admin/Orders";
import ProductAnalysis from "./admin/ProductAnalysis";
import Purchase from "./admin/Purchase";
import Customers from "./admin/Customers";
import StaffExpenses from "./admin/StaffExpenses";
import Categories from "./admin/Categories";
import ShopExpenses from "./admin/ShopExpenses";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<BillingScreen />}
        />

        <Route
          path="/admin"
          element={<Dashboard />}
        />

        <Route
          path="/admin/products"
          element={<Products />}
        />

        <Route
          path="/admin/orders"
          element={<Orders />}
        />

        <Route
          path="/admin/product-analysis"
          element={<ProductAnalysis />}
        />

        <Route
          path="/admin/purchase"
          element={<Purchase />}
        />

        <Route
          path="/admin/customers"
          element={<Customers />}
        />

        <Route
          path="/admin/staff"
          element={<StaffExpenses />}
        />

        <Route
          path="/admin/shop-expenses"
          element={<ShopExpenses />}
        />

        <Route
          path="/admin/categories"
          element={<Categories />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;