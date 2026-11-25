import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './data/store'
import { I18nProvider } from './lib/i18n'
import { Agenda } from './pages/Agenda'
import { AlumnoFicha } from './pages/AlumnoFicha'
import { Alumnado } from './pages/Alumnado'
import { Hoy } from './pages/Hoy'
import { Reunion } from './pages/Reunion'
import { Seguimiento } from './pages/Seguimiento'

export default function App() {
  return (
    <I18nProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Hoy />} />
              <Route path="alumnado" element={<Alumnado />} />
              <Route path="alumnado/:id" element={<AlumnoFicha />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="seguimiento" element={<Seguimiento />} />
            </Route>
            <Route path="reunion/:id" element={<Reunion />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </I18nProvider>
  )
}
