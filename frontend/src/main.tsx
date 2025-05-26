import React from "react";
import ReactDOM from "react-dom/client";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "@/index.css";
import "@/sass/main.scss";
import Regis from "@/components/Registration";
import AdminPage from "@/components/Admin";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Regis />} /> {/* Trang mặc định */}
        <Route path="/admin" element={<AdminPage />} /> {/* Trang admin */}
      </Routes>
    </Router>
  </React.StrictMode>
);
