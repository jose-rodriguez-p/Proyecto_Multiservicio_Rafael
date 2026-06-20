# Despliegue con Docker

## Build local o en VPS

```bash
docker compose build
```

## Levantar la aplicacion

```bash
docker compose up -d
```

La aplicacion queda disponible en:

```text
http://IP_DEL_VPS:4000
```

## Ver logs

```bash
docker compose logs -f
```

## Actualizar despues de subir cambios

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Nota importante del backend

El frontend tiene URLs de API apuntando a `http://localhost:8080`. En un navegador, `localhost` es la PC del usuario, no el VPS. Para produccion conviene cambiar esas URLs por el dominio/IP del backend o usar un proxy reverso en el VPS.
