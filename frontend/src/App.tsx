import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/orkut/RequireAuth";
import Login from "@/pages/Login";
import Inicio from "@/pages/Inicio";
import Perfil from "@/pages/Perfil";
import Recados from "@/pages/Recados";
import Depoimentos from "@/pages/Depoimentos";
import Amigos from "@/pages/Amigos";
import Comunidades from "@/pages/Comunidades";
import ComunidadeDetalhe from "@/pages/ComunidadeDetalhe";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/perfil" element={<Navigate to="/perfil/me" replace />} />
          <Route path="/perfil/:id" element={<Perfil />} />
          <Route path="/recados" element={<Recados />} />
          <Route path="/recados/:userId" element={<Recados />} />
          <Route path="/depoimentos" element={<Depoimentos />} />
          <Route path="/amigos" element={<Amigos />} />
          <Route path="/comunidades" element={<Comunidades />} />
          <Route path="/comunidades/:id" element={<ComunidadeDetalhe />} />
        </Route>
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
