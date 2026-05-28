## Primer release

### Novedades

- **Cálculo de antigüedad docente** en modo Comercial (360d) y Natural (365d)
- **Procesamiento de PDFs** GEDO/DIEGEP y archivos Excel
- **Interfaz suiza minimalista** con tipografía Inter
- **Buscador de docentes** por DNI y listado de todos los registrados
- **Panel de configuración** para cambiar entre modos de cálculo

### Instalación

**Opción 1 — Docker (recomendada):**
```
git clone git@github.com:santymrk2/calculo-antiguedad.git
cd calculo-antiguedad
docker compose up -d
# Abrir http://localhost:3000
```

**Opción 2 — Sin Docker:**
```
git clone git@github.com:santymrk2/calculo-antiguedad.git
cd calculo-antiguedad
./run.sh
```

### Soporte multiplataforma
Este release dispara la build automática de ejecutables para macOS (ARM + Intel), Linux y Windows.

> ⚠️ Los ejecutables no pueden procesar PDFs. Usá Docker para funcionalidad completa.
