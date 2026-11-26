-- Sincronización (Fase 2). El servidor solo guarda filas cifradas: no puede leer su contenido.
CREATE TABLE IF NOT EXISTS filas (
  tabla TEXT NOT NULL,
  id TEXT NOT NULL,
  iv TEXT NOT NULL,         -- base64
  c TEXT NOT NULL,          -- contenido cifrado (AES-GCM), base64
  t INTEGER NOT NULL,       -- momento del cambio en el dispositivo (ms): gana el más reciente
  borrado INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL, -- contador del servidor: los dispositivos piden «lo posterior a N»
  PRIMARY KEY (tabla, id)
);
CREATE INDEX IF NOT EXISTS filas_version ON filas (version);

CREATE TABLE IF NOT EXISTS meta (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
