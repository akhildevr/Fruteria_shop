import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import BillingScreen from "./billing/BillingScreen";
import Dashboard from "./admin/Dashboard";
import Products from "./admin/Products";
import Orders from "./admin/Orders";

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

      </Routes>

    </BrowserRouter>
  );
}

export default App;