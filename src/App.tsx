import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './data/store'
import { GoogleCalendarProvider } from './lib/GoogleCalendarProvider'
import { I18nProvider } from './lib/i18n'
import { AlumnoFicha } from './pages/AlumnoFicha'
import { Alumnado } from './pages/Alumnado'
import { Hoy } from './pages/Hoy'
import { InformesPrivados } from './pages/InformesPrivados'
import { Inicio } from './pages/Inicio'
import { Reunion } from './pages/Reunion'
import { Reuniones } from './pages/Reuniones'
import { Seguimiento } from './pages/Seguimiento'

// En la vista previa de una sola página (build:artifact) la URL no se puede usar para navegar.
const Router = import.meta.env.VITE_SINGLEFILE ? MemoryRouter : BrowserRouter

export default function App() {
  return (
    <I18nProvider>
      <GoogleCalendarProvider>
        <StoreProvider>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Inicio />} />
                <Route path="uei" element={<Hoy />} />
                <Route path="alumnado" element={<Alumnado />} />
                <Route path="alumnado/:id" element={<AlumnoFicha />} />
                <Route path="reuniones" element={<Reuniones key="amassades" />} />
                <Route path="claustre" element={<Reuniones key="claustre" claustre />} />
                <Route path="seguimiento" element={<Seguimiento />} />
                {import.meta.env.VITE_SINGLEFILE && <Route path="informes" element={<InformesPrivados />} />}
              </Route>
              <Route path="reunion/:id" element={<Reunion />} />
            </Routes>
          </Router>
        </StoreProvider>
      </GoogleCalendarProvider>
    </I18nProvider>
  )
}
