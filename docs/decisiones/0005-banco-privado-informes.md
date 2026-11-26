# Banco privado de informes

El banco está disponible en la edición HTML local, que restringe conexiones, scripts externos y envíos de formularios con una política CSP. La versión web con integraciones externas carece de acceso al banco.

IndexedDB almacena por separado los metadatos y el archivo, ambos cifrados con AES-GCM. La frase de acceso deriva una clave no extraíble mediante PBKDF2-SHA-256. Solo se conservan la sal y un verificador cifrado. Importar y borrar un documento modifica los dos almacenes en una transacción.

La lista de alumnado también se cifra y la asociación se guarda en la ficha cifrada. Solo se asigna automáticamente si el nombre del archivo contiene un único nombre completo de la lista, comparado por palabras sin distinción de mayúsculas o acentos.

El banco no implementa sincronización, extracción de texto ni solicitudes a IA. Una integración futura deberá trabajar con fragmentos revisados y anonimizados.
