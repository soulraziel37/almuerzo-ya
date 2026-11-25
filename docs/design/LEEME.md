# Diseño de referencia – Almuerzo Ya

Copiar esta carpeta a `docs/design/` del repo.

Cada `*.dc.html` es una pantalla de iPhone (390×844) exportada del canvas de diseño.
El marcado (`<x-dc>…</x-dc>`) tiene los estilos inline exactos: colores, radios, tamaños de
fuente, espaciados y estados (lógica en el `<script type="text/x-dc">` de cada archivo).
Son referencia visual y de comportamiento, NO código a copiar: la app se implementa en
React Native + Expo con componentes nativos (ver docs/PROYECTO.md §8).

| Archivo | Pantalla |
|---|---|
| Main.dc.html | Login (Estudiante: "Iniciar con Microsoft" / Operador: ID + contraseña) |
| Menu.dc.html | Menú del día |
| Carrito.dc.html | Carrito |
| Checkout.dc.html | Hora de retiro y método de pago |
| PagoApple.dc.html | Pago · Apple Pay (sheet) |
| PagoWebpay.dc.html | Pago · Webpay (vista web) |
| PagoExitoso.dc.html | Resultado del pago |
| QR.dc.html | Mis pedidos / código QR |
| Escanear.dc.html | Operador · Escanear |
| Verificado.dc.html | Operador · Validar y entregar |
| Stock.dc.html | Operador · Control de stock |
| MenuGestion.dc.html | Operador · Menús de la semana |
| MenuNuevo.dc.html | Operador · Agregar menú |

`canvas.json` tiene el orden de los flujos (fila 1 estudiante, fila 2 operador).
