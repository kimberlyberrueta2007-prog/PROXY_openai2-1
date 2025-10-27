DisenaArte_IA v10 — Corregido con proxy
---------------------------------------

Contenido del ZIP:
- index.html (cliente, mismo diseño que antes)
- style.css
- app.js (cliente mejorado para proxy)
- server.js (proxy Express que llama a OpenAI)
- package.json (dependencias para correr el proxy)
- .env.example (ejemplo de variables de entorno)
- README.md (este archivo)

Instrucciones rápidas:
1. Copia todo el contenido a un carpeta en tu máquina o repo GitHub.
2. Crea un archivo `.env` en la raíz con tu clave: `OPENAI_API_KEY=tu_clave_aqui`.
3. Instala dependencias: `npm install`
4. Levanta el proxy: `npm start` (por defecto en http://localhost:3000)
5. Abre `index.html` en tu navegador. El cliente hará peticiones a `/api/proxy` (mismo host) — si pruebas en local abre `index.html` vía servidor local (por ejemplo `npx serve .` o usa Live Server) para evitar problemas CORS/archivo://

Seguridad:
- Mantén tu clave en el archivo `.env` y **no** la pongas en el cliente.
- Para producción, sirve el cliente y el proxy desde el mismo dominio y usa HTTPS.
