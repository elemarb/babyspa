---
name: baby-spa-landing-design
description: "Sistema completo para construir la landing page de un spa para bebés (hidroterapia, masaje infantil, estimulación temprana, spa post vacuna) en HTML/CSS/Tailwind con un calendario de reservas en PHP que simula traer horarios desde base de datos. Usar SIEMPRE que se pida crear, editar, estilizar o revisar la web de Baby Spa Paraguay, cualquier spa/centro de estimulación para bebés, o un calendario/widget de reserva de turnos con horarios disponibles — incluso si el usuario no menciona explícitamente 'diseño', 'paleta' o 'landing page'. Consultar antes de elegir secciones, colores, tipografía, iconos, animaciones o la lógica del calendario de turnos."
---

# Baby Spa Landing Design

Esta landing tiene un solo objetivo: que una mamá o papá que llega desde Instagram
reserve un turno de hidroterapia/spa para su bebé. Todo en la página empuja hacia
el calendario de reservas.

**Marca de referencia:** Baby Spa Paraguay — Lic. Rocío Vicente, Asunción. Primer
spa y centro de hidroestimulación y cuidados exclusivos para bebés. Instagram:
@babyspaparaguay.

El skill tiene tres partes: **Parte A** (contenido y estructura), **Parte B**
(sistema visual pastel) y **Parte C** (el calendario de reservas, el componente
más importante de la página).

---

# PARTE A — Estrategia y estructura

## A1. Intake

Preguntar solo lo que falte, en un solo bloque:

- ¿Servicios a ofrecer? (por defecto: Hidroterapia, Masaje infantil, Estimulación
  temprana, Spa post vacuna)
- ¿Rango de edad de bebés que atiende? (por defecto: 15 días a 3 años)
- ¿Ubicación y horario de atención en Asunción?
- ¿Precios por sesión o por paquete, en guaraníes?
- ¿Tiene fotos/video propios o hay que dejar placeholders marcados claramente
  como tal? (nunca inventar fotos reales de bebés — ver B8)
- ¿El WhatsApp de contacto se muestra además del calendario, o el calendario
  reemplaza el WhatsApp como CTA principal?

Si no hay respuesta, asumir el default y seguir sin frenar el trabajo.

## A2. Estructura de la página (orden obligatorio)

1. **Hero** — headline cálido, subheadline, CTA "Reservar turno" que ancla al
   calendario (#reservas), foto/video en loop suave de agua/bebé.
2. **Barra de confianza** — Lic. Rocío Vicente, años de experiencia, protocolo
   de higiene y agua tratada, cantidad de bebés atendidos. Sin esto, un padre
   no confía en meter a su bebé al agua.
3. **Servicios** — tarjetas: nombre, edad recomendada, duración, beneficio
   principal, precio. Cada tarjeta enlaza al calendario con el servicio
   preseleccionado.
4. **Cómo funciona** — 3 pasos: Elegí el servicio → Reservá tu horario → Vení
   con tu bebé.
5. **Beneficios para el bebé** — sueño, digestión, vínculo afectivo, desarrollo
   motor. Beneficio primero, no característica técnica.
6. **Galería** — grilla de fotos/reels estilo Instagram, con nota de consentimiento
   de los padres si son bebés reales (ver B8).
7. **Calendario de reservas** (sección `#reservas`, ver Parte C) — el corazón
   de la página, nunca un simple formulario de contacto.
8. **Testimonios** — de padres, con nombre y edad del bebé al momento de la
   sesión, no genéricos.
9. **Preguntas frecuentes** — temperatura del agua, seguridad, qué llevar,
   primera vez, bebés prematuros.
10. **Ubicación y horario** — mapa embebido, dirección, franja horaria.
11. **CTA final** — igual al del hero, ancla al calendario.

Botón flotante de WhatsApp persistente en todas las secciones, además del
calendario — para la mamá que prefiere preguntar antes de reservar.

## A3. Copywriting

**Tono:** cálido, tranquilizador, profesional — nunca infantil-payaso ni
corporativo-frío. Le habla a un padre ansioso por primera vez.

**Fórmulas de headline:**
- "{Beneficio} para tu bebé, en manos expertas"
- "El primer spa para bebés de {ciudad}"
- "Hidroterapia y cuidado para los primeros {rango de edad}"

**CTA:** siempre un verbo + beneficio concreto: "Reservar turno", "Ver
horarios disponibles" — nunca "Enviar" o "Más información".

**Sin clichés:** nada de "la mejor experiencia", "un mundo de bienestar".
Preferir datos concretos: "Agua a 36 °C", "Sesiones de 30 minutos",
"Protocolo de higiene entre cada bebé".

## A4. Pitfalls específicos del rubro

- Calendario enterrado al fondo de la página en vez de accesible desde el hero
- Sin mención de higiene/seguridad del agua → rompe confianza
- Fotos de bebés genéricas de banco de imágenes que no matchean el tono real
- Precios ocultos hasta el final del funnel
- Sin opción de WhatsApp para quien no quiere reservar online directo

---

# PARTE B — Sistema visual pastel

## B1. Paleta (fija, no inventar tonos nuevos)

| Uso | Color | Hex |
|---|---|---|
| Fondo base | Crema cálido | `#FFF8F0` |
| Fondo alterno | Rosa pastel | `#FADCE2` |
| Fondo alterno | Celeste pastel | `#D9EDF6` |
| Acento / CTA | Rosa profundo | `#F09CB0` |
| Acento hover | Rosa profundo oscuro | `#E37F98` |
| Texto principal | Marrón cálido (nunca negro puro) | `#5B4B47` |
| Texto secundario | Marrón suave | `#8A7A75` |
| Líneas / bordes | Beige claro | `#EFE1D8` |

**Gradientes permitidos, con moderación:** a diferencia de un SaaS, acá el
gradiente pastel suave (rosa → celeste, o crema → rosa) en fondos de sección
es parte de la identidad de marca. Usar como transición entre secciones, nunca
detrás de texto largo ni en botones (los botones son de color sólido).

## B2. Tipografía

**Usar:** Fredoka, Baloo 2, Quicksand, o Nunito para títulos y cuerpo — fuentes
redondeadas, cálidas, legibles. Para un detalle de acento (una palabra en el
hero, una firma), se permite **una** fuente script suave como Caveat o
Pacifico — nunca más de una palabra ni en botones o cuerpo de texto.

**Nunca:** Inter, Roboto, Arial, tipografías corporativas angulosas, ni más de
dos familias tipográficas en toda la página.

**Escala:** igual que la escala estándar de Tailwind (text-sm a text-7xl).
Títulos de sección en `text-4xl`/`text-5xl`, hero en `text-5xl`/`text-6xl`.

**Copy:** sin guiones sueltos en el texto, sin palabras huérfanas al final de
línea (`text-wrap: balance` en títulos).

## B3. Espaciado y radios

Mismos tokens Tailwind que cualquier landing (4/8/12/16/24/32/40/48/64/80/96px).

**Radio de esquina — regla especial de este skill:** todo elemento contenedor
(tarjetas de servicio, imágenes, inputs del calendario, botones) usa radios
grandes, `rounded-2xl` como mínimo, `rounded-3xl` o `rounded-full` para
botones y avatares. Nada de esquinas rectas — es lo primero que comunica
"seguro y suave" en este rubro.

**Divisores de sección:** usar curvas SVG tipo ola (wave divider) entre
secciones de distinto fondo, en vez de líneas rectas. Refuerza el tema
acuático de la hidroterapia.

## B4. Imágenes e iconos

- Fotografía real y cálida, luz natural, nunca fotos de stock genéricas de
  bebés sonriendo a cámara sin contexto de agua/spa.
- Si no hay fotos reales disponibles, usar placeholders ilustrados
  (blob shapes, ilustración plana) — nunca simular una foto real de un bebé
  que no existe.
- Iconos redondeados y suaves: Phosphor (weight "duotone" o "fill"), nunca
  iconografía angulosa tipo Material Icons.

## B5. Motion

Animaciones lentas y suaves — el sitio no vende velocidad, vende calma.

```
transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]
```

- Burbujas o gotas flotando sutilmente en el fondo del hero (CSS puro,
  `@keyframes float` con desplazamiento vertical de pocos px, 4-6s de loop).
- Reveals de sección: fade + translate-y suave al entrar en viewport
  (`IntersectionObserver`, nunca `scroll` listener sin throttle).
- Nunca animaciones bruscas, rebotes fuertes ni parallax agresivo — un bebé
  no está en pantalla, pero el tono debe sentirse igual de calmo.

## B6. Contenido realista

- Sin Lorem Ipsum, sin "Bebé Ejemplo" ni "Spa Genérico".
- Precios en guaraníes con formato real: `₲ 150.000`, no números redondos
  sospechosos en todos los servicios (variar: `₲ 145.000`, `₲ 180.000`).
- Testimonios con nombre de la mamá/papá + edad del bebé en meses, nunca
  "Cliente satisfecho".
- Nunca prometer resultados médicos ("cura", "elimina cólicos") — usar
  lenguaje de bienestar y desarrollo ("favorece la relajación", "acompaña el
  desarrollo motor"), por responsabilidad legal en salud infantil.

---

# PARTE C — Calendario de reservas (componente central)

Es HTML/Tailwind en el front y PHP en el back simulando lectura de base de
datos (aunque hoy sea data mock, la estructura debe ser la misma que si
consultara MySQL).

## C1. Flujo

1. El usuario elige un **servicio** (chip/tab arriba del calendario).
2. Elige un **día** en una grilla de los próximos 14 días.
3. El día seleccionado carga (via `fetch`) los **horarios disponibles** desde
   `api/horarios.php?servicio=X&fecha=YYYY-MM-DD`.
4. Elige un **horario** disponible → se habilita el formulario de datos del
   bebé (nombre, edad en meses, nombre del contacto, teléfono).
5. Confirmar → `POST api/reservar.php` → mensaje de confirmación, nunca un
   `alert()` del navegador.

## C2. Contrato del endpoint simulado

`api/horarios.php` debe responder siempre en este formato, aunque los datos
estén hardcodeados en el PHP por ahora — así el día que se conecte a MySQL no
cambia nada del front:

```json
{
  "fecha": "2026-09-20",
  "servicio": "hidroterapia",
  "horarios": [
    { "hora": "09:00", "disponible": true },
    { "hora": "09:45", "disponible": false },
    { "hora": "10:30", "disponible": true }
  ]
}
```

Simular la data con un array asociativo en PHP y aplicar alguna regla simple
(ej. horarios ya pasados si es hoy, o un set fijo de "ocupados" por fecha)
para que se sienta real, en vez de devolver siempre todo disponible.

## C3. Estados visuales de cada horario

- **Disponible:** fondo celeste pastel, borde suave, cursor pointer, hover
  con leve scale.
- **Seleccionado:** fondo rosa profundo (`#F09CB0`), texto blanco.
- **No disponible:** fondo beige apagado, texto tachado suave, sin cursor
  pointer, `aria-disabled="true"`.
- **Cargando horarios del día:** skeleton con la forma de la grilla, nunca
  un spinner circular genérico (consistente con B4/B5 de calma).
- **Sin horarios ese día:** mensaje ilustrado ("No hay turnos este día, probá
  otra fecha 🌊"), nunca una grilla vacía sin explicación.
- **Confirmado:** pantalla de éxito con resumen (servicio, fecha, hora, datos
  del bebé) y opción de agregar a Google Calendar o compartir por WhatsApp.

## C4. Accesibilidad y validación

- Días y horarios navegables por teclado, `aria-selected` en el horario
  elegido.
- Validación de formulario en el cliente (nombre y teléfono requeridos, edad
  numérica) antes de habilitar "Confirmar reserva".
- Errores inline junto al campo, nunca solo un mensaje genérico arriba del
  formulario.

---

# Formato de salida

Al generar la landing desde cero, entregar en este orden antes de escribir
código:

1. **Outline de secciones** (según A2)
2. **Copy del hero** — headline, subheadline, CTA
3. **Servicios** — lista con nombre, edad, duración, precio, beneficio
4. **FAQ** — 6 a 10 preguntas reales del rubro
5. **Estructura del calendario** — servicios disponibles, rango de días, regla
   de disponibilidad simulada a usar en `horarios.php`

Después, construir sección por sección, dejando el calendario de reservas
(Parte C) para el final, ya que depende de que existan los servicios de la
sección 3.

---

# Checklist rápido

**Estrategia**
- [ ] Calendario accesible desde el hero, no solo al final
- [ ] Barra de confianza (credenciales, higiene) presente
- [ ] Precios visibles, en guaraníes, con formato real
- [ ] WhatsApp flotante además del calendario

**Visual**
- [ ] Paleta exacta de B1, sin colores nuevos inventados
- [ ] Tipografía redondeada de B2, máximo una fuente script como acento
- [ ] Radios grandes (`rounded-2xl`+) en todo contenedor
- [ ] Divisores tipo ola entre secciones
- [ ] Animaciones lentas, sin scroll listener sin throttle

**Calendario**
- [ ] `horarios.php` responde el contrato JSON de C2, con disponibilidad
      simulada realista (no todo disponible)
- [ ] Los 6 estados de horario de C3 están todos implementados
- [ ] Formulario con validación y errores inline, sin `alert()`
- [ ] Pantalla de confirmación con resumen de la reserva

**Contenido**
- [ ] Sin Lorem Ipsum ni nombres/marcas genéricas
- [ ] Sin promesas médicas, lenguaje de bienestar y desarrollo
- [ ] Fotos reales o placeholders ilustrados, nunca fotos falsas de bebés
