import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { Home, Preditor, Simulador, WitOficial, Visualizar } from "./pages";
import { PredictionProvider } from "./contexts/PredictionContext";
import { ROUTES } from "./constants/navigation";

function App() {
  return (
    <BrowserRouter>
      <PredictionProvider>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main className="w-full flex-grow">
            <Routes>
              <Route path={ROUTES.root} element={<Navigate to={ROUTES.home} replace />} />
              <Route path={ROUTES.home} element={<Home />} />
              <Route path={ROUTES.preditor} element={<Preditor />} />
              <Route path={ROUTES.simulador} element={<Simulador mode="conduta" />} />
              <Route path={ROUTES.witOficial} element={<WitOficial />} />
              <Route path={ROUTES.visualizar} element={<Visualizar />} />
              <Route path={ROUTES.legacySobre} element={<Navigate to={ROUTES.home} replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </PredictionProvider>
    </BrowserRouter>
  );
}

export default App;
