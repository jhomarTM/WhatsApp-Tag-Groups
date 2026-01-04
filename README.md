# WhatsApp Tag Groups

Extensión de Chrome para etiquetar múltiples personas en WhatsApp Web con un solo clic.

## Características

- **Grupos de etiquetas**: Crea grupos predefinidos de personas (ej: "Marketing", "Coordinadores")
- **Un solo clic**: Inserta todas las menciones de un grupo automáticamente
- **Captura fácil**: Agrega contactos a grupos directamente desde WhatsApp Web
- **Interfaz integrada**: Botón discreto junto al campo de mensaje

## Instalación

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el **Modo desarrollador** (esquina superior derecha)
3. Haz clic en **Cargar descomprimida**
4. Selecciona la carpeta del proyecto

Abre [WhatsApp Web](https://web.whatsapp.com) y verás el botón de tag junto al campo de mensaje.

## Uso

### Crear un grupo de etiquetas

1. Haz clic en el ícono de la extensión en la barra de Chrome
2. Clic en **"Nuevo grupo"**
3. Escribe un nombre (ej: "Equipo Marketing")
4. Guarda el grupo

### Agregar personas a un grupo

1. Abre un chat en WhatsApp Web
2. En el header del chat verás el botón **"Agregar a grupo"**
3. Selecciona el grupo al que quieres agregar el contacto

### Insertar menciones

1. Haz clic en el botón de tag junto al campo de mensaje
2. Selecciona el grupo que quieres mencionar
3. Las menciones se insertarán automáticamente

## Estructura del proyecto

```
extensionTagPeople/
├── manifest.json           # Configuración de la extensión
├── popup/
│   ├── popup.html          # UI del popup
│   ├── popup.css           # Estilos del popup
│   └── popup.js            # Lógica del popup
├── content/
│   ├── content.js          # Script inyectado en WhatsApp Web
│   └── content.css         # Estilos inyectados
├── background/
│   └── background.js       # Service worker
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Notas

- Los datos se guardan localmente en tu navegador usando `chrome.storage.local`
- Si WhatsApp actualiza su interfaz, los selectores pueden requerir actualización
- Las menciones se insertan simulando interacción del usuario

## Solución de problemas

**El botón no aparece:**
- Recarga WhatsApp Web después de instalar la extensión
- Verifica que la extensión esté habilitada en `chrome://extensions/`

**Los contactos no se encuentran:**
- El nombre guardado debe coincidir con el nombre en WhatsApp
- La extensión normaliza acentos y ñ para mejor búsqueda

## Licencia

MIT
