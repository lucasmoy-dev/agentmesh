#!/bin/bash

# ==============================================================================
# AgentMesh Client - install.sh (Instalador de Servicio Automático)
# ==============================================================================
# Este script configura un servicio de systemd en tu Raspberry Pi para que el
# cliente local (agent.sh) se ejecute automáticamente en segundo plano al encender
# el dispositivo, y se reinicie automáticamente si se detiene por algún error.
# ==============================================================================

# 1. Asegurar privilegios de root (re-ejecutar con sudo si es necesario)
if [ "$EUID" -ne 0 ]; then
    echo " [INFO] Este script requiere privilegios de administrador para configurar el servicio."
    echo " [INFO] Re-ejecutando automáticamente con 'sudo'..."
    sudo bash "$0" "$@"
    exit $?
fi

# 2. Obtener la ruta absoluta actual y el usuario real
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_USER="${SUDO_USER:-root}"
SERVICE_FILE="/etc/systemd/system/agentmesh-client.service"

echo "=================================================="
echo "  Instalador de Servicio Automático - AgentMesh   "
echo "=================================================="
echo " Ruta del cliente: $SCRIPT_DIR"
echo " Usuario ejecutor: $CLIENT_USER"
echo "--------------------------------------------------"

# 3. Asegurar permisos de ejecución para agent.sh
echo " [1/4] Otorgando permisos de ejecución a agent.sh..."
chmod +x "$SCRIPT_DIR/agent.sh"

# 4. Crear el archivo del servicio de systemd
echo " [2/4] Creando el servicio systemd en $SERVICE_FILE..."
cat << EOF > "$SERVICE_FILE"
[Unit]
Description=AgentMesh Local Prompt Execution Client
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$CLIENT_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=/bin/bash $SCRIPT_DIR/agent.sh
Restart=always
RestartSec=10
StandardOutput=append:$SCRIPT_DIR/agent.log
StandardError=append:$SCRIPT_DIR/agent.log

[Install]
WantedBy=multi-user.target
EOF

# 5. Habilitar y arrancar el servicio
echo " [3/4] Recargando el administrador de servicios de Linux..."
systemctl daemon-reload

echo " [4/4] Habilitando el servicio para que inicie al encender..."
systemctl enable agentmesh-client.service

echo " [INFO] Iniciando el cliente en segundo plano ahora mismo..."
systemctl start agentmesh-client.service

echo "=================================================="
echo " 🎉 ¡INSTALACIÓN COMPLETADA CON ÉXITO! 🎉"
echo "=================================================="
echo " El cliente local ya está corriendo en segundo plano y se iniciará"
echo " automáticamente cada vez que se prenda tu Raspberry Pi."
echo ""
echo " Comandos útiles de administración:"
echo "   - Ver estado actual:   sudo systemctl status agentmesh-client"
echo "   - Detener servicio:     sudo systemctl stop agentmesh-client"
echo "   - Iniciar servicio:     sudo systemctl start agentmesh-client"
echo "   - Ver logs en vivo:     tail -f $SCRIPT_DIR/agent.log"
echo "=================================================="
