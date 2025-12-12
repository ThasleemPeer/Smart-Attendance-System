
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import './index.css'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;