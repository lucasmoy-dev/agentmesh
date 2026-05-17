#!/bin/bash

# ==============================================================================
# AgentMesh Client - uninstall.sh (Desinstalador de Servicio)
# ==============================================================================
# Este script detiene el servicio en segundo plano de AgentMesh y lo elimina
# del inicio automático de tu Raspberry Pi.
# ==============================================================================

# 1. Asegurar privilegios de root (re-ejecutar con sudo si es necesario)
if [ "$EUID" -ne 0 ]; then
    echo " [INFO] Este script requiere privilegios de administrador para desinstalar el servicio."
    echo " [INFO] Re-ejecutando automáticamente con 'sudo'..."
    sudo bash "$0" "$@"
    exit $?
fi

SERVICE_FILE="/etc/systemd/system/agentmesh-client.service"

echo "=================================================="
echo "  Desinstalador de Servicio - AgentMesh           "
echo "=================================================="

# 2. Detener el servicio si está corriendo
if systemctl is-active --quiet agentmesh-client.service; then
    echo " [1/4] Deteniendo el cliente en ejecución..."
    systemctl stop agentmesh-client.service
else
    echo " [1/4] El servicio ya se encontraba detenido."
fi

# 3. Deshabilitar el servicio del inicio automático
if systemctl is-enabled --quiet agentmesh-client.service; then
    echo " [2/4] Deshabilitando el inicio automático en el arranque..."
    systemctl disable agentmesh-client.service
else
    echo " [2/4] El inicio automático ya estaba deshabilitado."
fi

# 4. Eliminar el archivo del servicio
if [ -f "$SERVICE_FILE" ]; then
    echo " [3/4] Eliminando el archivo de servicio systemd..."
    rm -f "$SERVICE_FILE"
else
    echo " [3/4] No se encontró el archivo del servicio."
fi

# 5. Recargar daemon
echo " [4/4] Recargando el administrador de servicios de Linux..."
systemctl daemon-reload

echo "=================================================="
echo " 🗑️ ¡DESINSTALACIÓN COMPLETADA! 🗑️"
echo "=================================================="
echo " El servicio de inicio automático ha sido removido con éxito."
echo " El cliente ya no se ejecutará al encender tu Raspberry Pi."
echo "=================================================="
