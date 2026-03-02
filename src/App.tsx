import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { Home } from "./pages/home";
import { Prediction } from "./pages/prediction";
import { About } from "./pages/about";
import Visualizar from "./pages/visualizar";
import { PredictionProvider } from "./contexts/PredictionContext";

function App() {
  return (
    <BrowserRouter>
      <PredictionProvider>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main className="w-full flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/predicao" element={<Prediction />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/visualizar" element={<Visualizar />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </PredictionProvider>
    </BrowserRouter>
  );
}

export default App;
