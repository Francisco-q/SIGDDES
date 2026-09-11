#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
APP_ROOT=$(cd -- "${SCRIPT_DIR}/.." && pwd)
BACKEND_DIR="${APP_ROOT}/backend"
FRONTEND_DIR="${APP_ROOT}/Frontend"
VENV_DIR="${APP_ROOT}/.venv"
ENV_FILE="${BACKEND_DIR}/.env.utalca"
DEPLOY_REF=${DEPLOY_REF:-feature/screaming-architecture-migration}

log() { printf '[SAFE-VG] %s\n' "$*"; }
fail() { printf '[SAFE-VG] ERROR: %s\n' "$*" >&2; exit 1; }

[[ -f "${ENV_FILE}" ]] || fail "Falta ${ENV_FILE}; cópialo desde .env.utalca.example."
command -v python3 >/dev/null || fail "Falta python3."
command -v npm >/dev/null || fail "Falta npm."

cd "${APP_ROOT}"
if [[ ${SKIP_GIT_UPDATE:-0} != 1 ]]; then
    [[ -z $(git status --porcelain) ]] || fail "El checkout contiene cambios locales; no se actualizará."
    CURRENT_BRANCH=$(git branch --show-current)
    [[ "${CURRENT_BRANCH}" == "${DEPLOY_REF}" ]] || fail "Rama activa ${CURRENT_BRANCH}; se esperaba ${DEPLOY_REF}."
    log "Actualizando ${DEPLOY_REF} mediante fast-forward"
    git pull --ff-only origin "${DEPLOY_REF}"
fi

DEPLOY_SHA=$(git rev-parse HEAD)
log "Desplegando commit ${DEPLOY_SHA}"

python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --disable-pip-version-check -r "${BACKEND_DIR}/requirements.txt"

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-django_crud_api.settings_utalca}

"${VENV_DIR}/bin/python" "${BACKEND_DIR}/manage.py" check --deploy
"${VENV_DIR}/bin/python" "${BACKEND_DIR}/manage.py" migrate --noinput
"${VENV_DIR}/bin/python" "${BACKEND_DIR}/manage.py" collectstatic --noinput

log "Construyendo frontend para el mismo origen"
cd "${FRONTEND_DIR}"
npm ci
VITE_API_BASE_URL=/api/ VITE_FRONTEND_BASE_URL=/ npm run build

sudo systemctl restart safevg
sudo nginx -t
sudo systemctl reload nginx

curl --fail --silent --show-error http://127.0.0.1:8000/ >/dev/null
sudo systemctl is-active --quiet safevg
sudo systemctl is-active --quiet nginx

printf '%s\n' "${DEPLOY_SHA}" >"${APP_ROOT}/.last-deployed-commit"
log "Deploy correcto. Repetir este comando sobre el mismo commit es seguro."
