# Despliegue repetible de SAFE-VG en UTalca DEV

Este flujo despliega directamente desde
`feature/screaming-architecture-migration`. No necesita tags, releases ni un
número de versión. Cada ejecución registra el commit desplegado y puede volver
a ejecutar el mismo commit sin duplicar migraciones.

## 1. Preparación única de la VM

Conectado a la VPN:

```bash
ssh usuario_vm@ip_privada_vm
sudo apt update
sudo apt install git nginx python3-venv python3-dev build-essential nodejs npm
git clone --branch feature/screaming-architecture-migration --single-branch \
  https://github.com/Francisco-q/SIGDDES.git ~/safevg
cd ~/safevg
cp backend/.env.utalca.example backend/.env.utalca
chmod 600 backend/.env.utalca
```

Completar `backend/.env.utalca` con las credenciales enviadas por Ilian. No
copiar esas credenciales al repositorio ni al historial de la terminal.

Instalar el servicio y Nginx una sola vez:

```bash
cd ~/safevg
sudo ./deploy/install-service.sh
```

## 2. Despliegue normal

```bash
cd ~/safevg
./deploy/deploy.sh
```

El script:

1. exige la rama correcta y un checkout sin cambios locales;
2. actualiza solo mediante fast-forward;
3. instala las dependencias Python;
4. comprueba Django y aplica únicamente migraciones pendientes;
5. reconstruye el frontend con `npm ci`;
6. reinicia Gunicorn y recarga Nginx;
7. valida la respuesta y guarda el commit desplegado.

## 3. Prueba de redespliegue sin una versión nueva

Este comando ejecuta dos despliegues consecutivos del mismo commit:

```bash
cd ~/safevg
./deploy/verify-repeatable.sh
```

La prueba aprueba solamente si ambos servicios siguen activos, el backend
responde y el commit registrado después de ambas ejecuciones es el mismo.

## 4. Verificación y diagnóstico

```bash
cat .last-deployed-commit
sudo systemctl status safevg --no-pager
sudo journalctl -u safevg -n 100 --no-pager
sudo nginx -t
curl -I http://127.0.0.1/
```

Antes del primer `migrate` contra Oracle se debe comprobar conectividad y que
el esquema esté vacío o autorizado para recibir las tablas de Django.
