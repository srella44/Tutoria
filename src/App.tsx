import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Cerradura } from './components/Cerradura'
import { StoreProvider } from './data/store'
import { GoogleCalendarProvider } from './lib/GoogleCalendarProvider'
import { I18nProvider } from './lib/i18n'
import { FichaConLista } from './pages/FichaConLista'
import { Alumnado } from './pages/Alumnado'
import { Agenda } from './pages/Agenda'
import { InformesPrivados } from './pages/InformesPrivados'
import { Inicio } from './pages/Inicio'
import { Reunion } from './pages/Reunion'
import { PaginaAjustes } from './components/Ajustes'
import { Autorizaciones } from './pages/Autorizaciones'
import { ImportarAutorizaciones } from './pages/ImportarAutorizaciones'
import { Cursos } from './pages/Cursos'
import { Frases } from './pages/Frases'
import { Horario } from './pages/Horario'
import { Importar } from './pages/Importar'
import { Profesionales } from './pages/Profesionales'
import { Reuniones } from './pages/Reuniones'

// En la vista previa de una sola página (build:artifact) la URL no se puede usar para navegar.
const Router = import.meta.env.VITE_SINGLEFILE ? MemoryRouter : BrowserRouter

export default function App() {
  return (
    <I18nProvider>
      <GoogleCalendarProvider>
        <Cerradura>
      <StoreProvider>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Inicio />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="uei" element={<Navigate to="/agenda" replace />} />
                <Route path="alumnado" element={<Alumnado />} />
                <Route path="alumnado/:id" element={<FichaConLista />} />
                <Route path="profesionales" element={<Profesionales />} />
                <Route path="importar" element={<Importar />} />
                <Route path="cursos" element={<Cursos />} />
                <Route path="frases" element={<Frases />} />
                <Route path="ajustes" element={<PaginaAjustes />} />
                <Route path="autorizaciones" element={<Autorizaciones />} />
                <Route path="autorizaciones/importar" element={<ImportarAutorizaciones />} />
                <Route path="reuniones" element={<Reuniones key="amassades" />} />
                <Route path="claustre" element={<Reuniones key="claustre" claustre />} />
                <Route path="horario" element={<Horario />} />
                <Route path="seguimiento" element={<Navigate to="/agenda" replace />} />
                {import.meta.env.VITE_SINGLEFILE && <Route path="informes" element={<InformesPrivados />} />}
              </Route>
              <Route path="reunion/:id" element={<Reunion />} />
            </Routes>
          </Router>
        </StoreProvider>
      </Cerradura>
      </GoogleCalendarProvider>
    </I18nProvider>
  )
}
