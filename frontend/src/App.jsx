import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import BillingScreen from "./billing/BillingScreen";
import Dashboard from "./admin/Dashboard";
import Products from "./admin/Products";

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

      </Routes>

    </BrowserRouter>
  );
}

export default App;