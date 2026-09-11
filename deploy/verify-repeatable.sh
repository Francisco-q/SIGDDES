#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
APP_ROOT=$(cd -- "${SCRIPT_DIR}/.." && pwd)
EXPECTED_SHA=$(git -C "${APP_ROOT}" rev-parse HEAD)

echo "Primera ejecución sobre ${EXPECTED_SHA}"
SKIP_GIT_UPDATE=1 "${SCRIPT_DIR}/deploy.sh"

echo "Segunda ejecución sobre el mismo commit"
SKIP_GIT_UPDATE=1 "${SCRIPT_DIR}/deploy.sh"

ACTUAL_SHA=$(<"${APP_ROOT}/.last-deployed-commit")
[[ "${ACTUAL_SHA}" == "${EXPECTED_SHA}" ]]

sudo systemctl is-active --quiet safevg
sudo systemctl is-active --quiet nginx
curl --fail --silent --show-error http://127.0.0.1:8000/ >/dev/null

echo "Prueba aprobada: dos despliegues consecutivos del commit ${ACTUAL_SHA}."
