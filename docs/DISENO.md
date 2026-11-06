# Diseño visual

> Rediseño del 2026-11-05: se cambió el estilo "Netflix rojo/negro" por uno inspirado en **Stremio** (captura enviada por el usuario).

## Qué se tomó de la referencia

| Elemento | Cómo quedó en Estante |
|---|---|
| Fondo azul noche con brillo violeta | Degradado `#17143a → #0d0b1f` con dos halos violeta (`src/index.css`) |
| Barra lateral de iconos a la izquierda | Inicio, Biblioteca, Historial, Recordatorios; el activo se marca con una línea violeta y el nombre aparece al pasar el mouse |
| Buscador en forma de píldora, centrado arriba | Busca por título o autor desde cualquier pantalla |
| Filas con título a la izquierda y "See All ›" a la derecha | Filas con **"Ver todo ›"**, que abre la página Biblioteca ya filtrada |
| Portadas verticales con el título centrado debajo | Tarjeta con portada redondeada, título centrado y "Pág. X de Y" si lo estás leyendo |
| Sin un banner gigante arriba | Se quitó el destacado estilo Netflix; la primera fila es "Continuar leyendo" |

## Paleta ("noche violeta")

Definida una sola vez como variables de Tailwind en `src/index.css` (`@theme`). Cambiar ahí un color cambia toda la app.

| Token | Color | Uso |
|---|---|---|
| `bg` | `#0d0b1f` | Fondo base |
| `bg-2` | `#17143a` | Inicio del degradado del fondo |
| `surface` | `#1d1946` | Tarjetas, paneles, campos |
| `surface-2` | `#29245c` | Hover, elementos activos |
| `line` | blanco 8 % | Bordes sutiles |
| `accent` | `#7b5bf5` | Botones principales, barras de progreso, selección |
| `accent-2` | `#9b82ff` | Hover del acento, íconos destacados |
| `muted` | `#a29fc4` | Texto secundario |

Las portadas generadas (libros sin portada) usan solo tonos entre azul y magenta para combinar con la paleta.

## Celular

- La barra lateral se convierte en **pestañas inferiores** con iconos.
- El botón "Agregar libros" queda como un **+** redondo.
- Las filas se deslizan horizontalmente con el dedo.

## Iconos

[lucide-react](https://lucide.dev) (licencia ISC, uso comercial permitido).

## Logo e identidad (Readora)

- Nombre: **Readora** (en inglés, fácil de pronunciar en cualquier idioma). Se define en [`src/brand.ts`](../src/brand.ts).
- Logo: [`public/logo.svg`](../public/logo.svg) — cuadrado redondeado con degradado violeta (`#a48cff` → `#6c47f2` → `#2f1b8f`), un libro abierto blanco y una **cinta marcapáginas dorada** (`#ffd76a` → `#ffab3d`) que representa "seguir donde quedaste".
- Se usa como favicon, en la barra lateral, en Ajustes y como ícono de Android (ver [ANDROID.md](ANDROID.md)).
- Pantalla de inicio de Android: fondo `#0d0b1f` con el logo al centro.
