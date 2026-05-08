#!/bin/bash

# ==============================================================================
# AgentMesh Client - agent.sh
# ==============================================================================
# Este script consulta la API de AgentMesh cada minuto, obtiene el próximo 
# prompt disponible, lo guarda en init.txt y lo ejecuta usando opencode.
# ==============================================================================

# Configuración
API_URL="https://agentmesh-ruddy.vercel.app"
API_PASSWORD='Smartwatch0!'
INTERVAL=15
CLIENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Asegurarse de que estamos en el directorio correcto
cd "$CLIENT_DIR"

echo "--------------------------------------------------"
echo "AgentMesh Client iniciado"
echo "API: $API_URL"
echo "Intervalo: ${INTERVAL}s"
echo "--------------------------------------------------"

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] --- Iniciando ciclo de consulta ---" | tee -a agent.log
    
    # 1. Obtener el próximo prompt (usando -w para ver el código de estado)
    TMP_FILE=$(mktemp)
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$TMP_FILE" "${API_URL}/api/prompts/next?password=${API_PASSWORD}")
    RESPONSE=$(cat "$TMP_FILE")
    rm "$TMP_FILE"
    
    echo "Status: $HTTP_STATUS" | tee -a agent.log

    if [ "$HTTP_STATUS" == "401" ]; then
        echo "ERROR: Password incorrecto o no autorizado." | tee -a agent.log
    elif [ "$HTTP_STATUS" == "204" ] || [ -z "$RESPONSE" ] || [ "$RESPONSE" == "null" ]; then
        echo "No hay prompts pendientes en este momento." | tee -a agent.log
    elif [ "$HTTP_STATUS" == "200" ]; then
        # Intentar extraer ID y Contenido usando Python
        ID=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null)
        CONTENT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('content', ''))" 2>/dev/null)

        if [ ! -z "$ID" ]; then
            echo "¡PROMPT DETECTADO! ID: $ID" | tee -a agent.log
            
            # Verificar si opencode existe
            if ! command -v opencode &> /dev/null; then
                RESULT="Error: El comando 'opencode' no se encuentra en el sistema."
                echo "$RESULT" | tee -a agent.log
            else
                echo "Ejecutando opencode..." | tee -a agent.log
                # Pasamos el contenido del prompt directamente a opencode
                RESULT=$(echo "$CONTENT" | opencode 2>&1)
                echo "Ejecución finalizada." | tee -a agent.log
            fi
            
            # Enviar el resultado de vuelta (POST)
            echo "Enviando resultado a la API..." | tee -a agent.log
            PAYLOAD=$(python3 -c "import json, sys; print(json.dumps({'result': sys.stdin.read()}))" <<< "$RESULT")
            
            POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/prompts/${ID}?password=${API_PASSWORD}" \
                -H "Content-Type: application/json" \
                -d "$PAYLOAD")
            
            echo "Resultado enviado. Status: $POST_STATUS" | tee -a agent.log
        elif [[ "$RESPONSE" == *"no_prompts_due"* ]]; then
            echo "No hay prompts pendientes en este momento." | tee -a agent.log
        else
            echo "Error: Se recibió una respuesta inesperada." | tee -a agent.log
            echo "Respuesta cruda: $RESPONSE" | tee -a agent.log
        fi
    else
        echo "Error inesperado de la API (HTTP $HTTP_STATUS)." | tee -a agent.log
        echo "Respuesta: $RESPONSE" | tee -a agent.log
    fi

    echo "Esperando ${INTERVAL}s..." | tee -a agent.log
    sleep $INTERVAL
done
