#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
    echo "Ejecuta este instalador con sudo." >&2
    exit 1
fi

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
APP_ROOT=$(cd -- "${SCRIPT_DIR}/.." && pwd)
APP_USER=${SUDO_USER:-safevgdev}
APP_GROUP=$(id -gn "${APP_USER}")
SERVER_NAME=${SERVER_NAME:-_}

command -v nginx >/dev/null || {
    echo "Falta nginx. Instálalo antes de continuar: sudo apt install nginx" >&2
    exit 1
}

sed \
    -e "s|__APP_ROOT__|${APP_ROOT}|g" \
    -e "s|__APP_USER__|${APP_USER}|g" \
    -e "s|__APP_GROUP__|${APP_GROUP}|g" \
    "${SCRIPT_DIR}/safevg.service" >/etc/systemd/system/safevg.service

sed \
    -e "s|__APP_ROOT__|${APP_ROOT}|g" \
    -e "s|__SERVER_NAME__|${SERVER_NAME}|g" \
    "${SCRIPT_DIR}/safevg-nginx.conf" >/etc/nginx/sites-available/safevg

ln -sfn /etc/nginx/sites-available/safevg /etc/nginx/sites-enabled/safevg
rm -f /etc/nginx/sites-enabled/default

systemctl daemon-reload
systemctl enable safevg nginx
nginx -t

echo "Servicio instalado. Completa backend/.env.utalca y ejecuta deploy/deploy.sh."
