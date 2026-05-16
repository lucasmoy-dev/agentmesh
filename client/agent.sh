#!/bin/bash

# ==============================================================================
# AgentMesh Client - agent.sh
# ==============================================================================
# Este script consulta la API de AgentMesh cada minuto, obtiene el próximo 
# prompt disponible, lo guarda en init.txt y lo ejecuta usando opencode.
# ==============================================================================

# Configuración
API_URL="https://agentmesh-ruddy.vercel.app"
INTERVAL=10
CLIENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Asegurarse de que estamos en el directorio correcto
cd "$CLIENT_DIR"

# Leer API KEY desde archivo
if [ ! -f "apikey.txt" ]; then
    echo "ERROR: apikey.txt no encontrado."
    exit 1
fi
API_KEY=$(cat apikey.txt | tr -d '\n\r ')

# Forzar codificación UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "--------------------------------------------------"
echo "AgentMesh Local Client iniciado"
echo "API: $API_URL"
echo "Intervalo: ${INTERVAL}s"
echo "--------------------------------------------------"

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] --- Consultando prompts locales ---" | tee -a agent.log
    
    node -e "
        const { execSync } = require('child_process');
        const [apiUrl, apikey] = process.argv.slice(1);

        async function run() {
            try {
                // 1. Obtener el próximo prompt local
                const pollUrl = \`\${apiUrl}/api/prompts/local-pc/prompt?apikey=\${apikey}\`;
                const res = await fetch(pollUrl);
                
                if (res.status === 401) return console.log('Error: API Key incorrecta.');
                if (!res.ok) return console.log('Error del servidor:', res.status);
                
                const data = await res.json();
                if (data.message === 'No prompts pending' || !data.id) {
                    return console.log('No hay prompts locales pendientes.');
                }

                console.log('¡PROMPT RECIBIDO! ID:', data.id);
                console.log('Contenido:', data.prompt.substring(0, 50) + '...');

                // 2. Ejecutar (usando opencode run como ejemplo)
                let result;
                try {
                    console.log('Ejecutando...');
                    const raw = execSync('opencode run', { input: data.prompt });
                    result = raw.toString().trim();
                } catch (e) {
                    result = 'Error de ejecución local: ' + (e.stdout ? e.stdout.toString() : e.message);
                }

                // 3. Enviar resultado al mismo endpoint usando POST
                console.log('Enviando resultado...');
                const postRes = await fetch(pollUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: data.id, result })
                });
                
                const postData = await postRes.json();
                if (postData.success) {
                    console.log('Resultado enviado con éxito.');
                } else {
                    console.log('Error al enviar resultado:', JSON.stringify(postData));
                }

            } catch (e) {
                console.error('Error de sistema:', e.message);
            }
        }
        run();
    " "$API_URL" "$API_KEY" | tee -a agent.log

    sleep $INTERVAL
done
