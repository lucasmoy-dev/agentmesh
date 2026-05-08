#!/bin/bash

# ==============================================================================
# AgentMesh Client - agent.sh
# ==============================================================================
# Este script consulta la API de AgentMesh cada minuto, obtiene el próximo 
# prompt disponible, lo guarda en init.txt y lo ejecuta usando opencode.
# ==============================================================================

# Configuración
API_URL="https://agentmesh-ruddy.vercel.app"
API_KEY='f370146d4e4d840d8e42800d2cf5c096f396d6cbf5586cca2d0253d0cc90aad4'
INTERVAL=15
CLIENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Asegurarse de que estamos en el directorio correcto
cd "$CLIENT_DIR"

# Forzar codificación UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "--------------------------------------------------"
echo "AgentMesh Client iniciado"
echo "API: $API_URL"
echo "Intervalo: ${INTERVAL}s"
echo "--------------------------------------------------"

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] --- Consultando API ---" | tee -a agent.log
    
    # Ejecutar toda la lógica en un solo proceso de Node para mayor eficiencia y robustez
    node -e "
        const { execSync } = require('child_process');
        const [apiUrl, password] = process.argv.slice(1);

        async function run() {
            try {
                // 1. Obtener el próximo prompt
                const nextRes = await fetch(\`\${apiUrl}/api/prompts/next?password=\${password}\`);
                
                if (nextRes.status === 401) return console.log('Error: No autorizado (password incorrecto).');
                if (nextRes.status === 204) return console.log('No hay prompts pendientes.');
                
                const data = await nextRes.json();
                if (data.status === 'no_prompts_due') return console.log('No hay prompts pendientes.');
                if (!data.id) return console.log('Respuesta inesperada:', JSON.stringify(data));

                console.log('¡PROMPT DETECTADO! ID:', data.id);

                // 2. Ejecutar opencode
                let result;
                try {
                    const raw = execSync('opencode run', { input: data.content });
                    // Decodificación inteligente
                    try { result = new TextDecoder('utf-8', { fatal: true }).decode(raw); }
                    catch (e) { result = new TextDecoder('windows-1252').decode(raw); }
                } catch (e) {
                    result = 'Error de ejecución: ' + (e.stdout ? e.stdout.toString() : e.message);
                }

                // 3. Limpieza de ruidos
                result = result.replace(/\\x1b\\[[0-9;]*[a-zA-Z]/g, '')
                               .split('\\n')
                               .filter(l => !l.trim().startsWith('> build') && !l.trim().startsWith('? Exa') && l.trim() !== '?')
                               .join('\\n').trim();

                // 4. Enviar resultado
                console.log('Enviando resultado...');
                const postRes = await fetch(\`\${apiUrl}/api/prompts/\${data.id}?password=\${password}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ result })
                });
                console.log('Resultado enviado. Status:', postRes.status);

            } catch (e) {
                console.error('Error de red o sistema:', e.message);
            }
        }
        run();
    " "$API_URL" "$API_KEY" | tee -a agent.log

    echo "Esperando ${INTERVAL}s..." | tee -a agent.log
    sleep $INTERVAL
done
