import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import AddBrand from "./pages/AddBrand";
import { getBrands } from "./lib/api";

export default function App() {
  const [brands, setBrands] = useState([]);
  const [activeBrandId, setActiveBrandId] = useState(null);

  useEffect(() => {
    getBrands().then((data) => {
      setBrands(data);
      if (data.length > 0) setActiveBrandId(data[0].id);
    });
  }, []);

  function handleBrandAdded(newBrand) {
    setBrands((prev) => [...prev, newBrand]);
    setActiveBrandId(newBrand.id);
  }

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null;

  return (
    <div className="flex h-screen bg-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar brands={brands} activeBrandId={activeBrandId} onChangeBrand={setActiveBrandId} />
        <Routes>
          <Route path="/" element={<Dashboard activeBrand={activeBrand} />} />
          <Route path="/add-brand" element={<AddBrand onBrandAdded={handleBrandAdded} />} />
        </Routes>
      </div>
    </div>
  );
}