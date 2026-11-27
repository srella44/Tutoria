# Despliegue en Cloudflare

TUTOR-ia se publica en **Cloudflare Pages** (app + API de sincronización) con una base **D1** y
**Cloudflare Access** delante. Todo cabe en el plan gratuito.

## 1. Base de datos D1

1. Panel de Cloudflare › **Storage & Databases › D1** › *Create database* › nombre `tutoria`.
2. Abre la base › pestaña **Console** › pega el contenido de `migrations/0001_sync.sql` › *Execute*.

## 2. Proyecto de Pages

1. **Workers & Pages › Create › Pages › Connect to Git** › repositorio `Tutoria`.
2. Rama de producción: `main` (o la rama que se use). Framework: *None*.
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Tras el primer despliegue: **Settings › Bindings › Add › D1 database** › nombre de variable `DB` ›
   base `tutoria`. Vuelve a desplegar.
4. **Custom domains** › `tutoria.pretzhet.app`.

## 3. Cloudflare Access (solo entra el tutor)

1. **Zero Trust › Access › Applications › Add › Self-hosted** › dominio `tutoria.pretzhet.app`
   (y el `*.pages.dev` del proyecto).
2. Política: *Allow* › *Emails* › el correo del tutor. Método: código por correo o Google.
3. Copia el **Application Audience (AUD) Tag**.
4. En Pages › **Settings › Variables**: `ACCESS_TEAM_DOMAIN` = `<equipo>.cloudflareaccess.com` y
   `ACCESS_AUD` = el AUD copiado. Vuelve a desplegar.

## 4. Primer uso

1. En el aparato principal: crear el PIN (6 cifras recomendado) y guardar la clave de emergencia en papel.
2. Ajustes › **Activar era sincronizacion** › escribir el PIN.
3. En cada aparato nuevo: código del correo de Cloudflare › **Ja utilizi TUTOR-ia en un aute dispositiu** ›
   el mismo PIN. (Si el aparato ya tenía su propio PIN, Ajustes › Activar lo lleva a esa pantalla.)

## Empezar de cero (solo sin datos reales)

Si el servidor queda con una cuenta a la que ningún aparato puede entrar: consola de D1 ›
`DELETE FROM filas; DELETE FROM meta;` y repetir el primer uso.

## Desarrollo local

```
npm run build
npx wrangler d1 migrations apply tutoria --local
npx wrangler pages dev dist --binding MODO_DESARROLLO=1
```
