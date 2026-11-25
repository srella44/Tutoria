import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './data/store'
import { I18nProvider } from './lib/i18n'
import { AlumnoFicha } from './pages/AlumnoFicha'
import { Alumnado } from './pages/Alumnado'
import { Hoy } from './pages/Hoy'
import { Reunion } from './pages/Reunion'
import { Reuniones } from './pages/Reuniones'
import { Seguimiento } from './pages/Seguimiento'

// En la vista previa de una sola página (build:artifact) la URL no se puede usar para navegar.
const Router = import.meta.env.VITE_SINGLEFILE ? MemoryRouter : BrowserRouter

export default function App() {
  return (
    <I18nProvider>
      <StoreProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Hoy />} />
              <Route path="alumnado" element={<Alumnado />} />
              <Route path="alumnado/:id" element={<AlumnoFicha />} />
              <Route path="reuniones" element={<Reuniones />} />
              <Route path="seguimiento" element={<Seguimiento />} />
            </Route>
            <Route path="reunion/:id" element={<Reunion />} />
          </Routes>
        </Router>
      </StoreProvider>
    </I18nProvider>
  )
}
