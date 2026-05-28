const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const { execSync } = require('child_process');

const PID = 29168; // Make sure this is correct

try {
  process._debugProcess(PID);
  console.log('Sent debug signal to ' + PID);
} catch (e) {
  console.log('Could not send debug signal, maybe already in debug mode');
}

setTimeout(() => {
  http.get('http://127.0.0.1:9229/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const targets = JSON.parse(data);
      const target = targets[0];
      if (!target || !target.webSocketDebuggerUrl) {
        console.error('No debugger URL found');
        process.exit(1);
      }
      
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      ws.on('open', () => {
        console.log('Connected to debugger');
        ws.send(JSON.stringify({ id: 1, method: 'Debugger.enable' }));
      });
      
      let scriptId = null;
      ws.on('message', (msg) => {
        const parsed = JSON.parse(msg);
        if (parsed.method === 'Debugger.scriptParsed') {
          if (parsed.params.url.includes('modules/graph/service.js') || parsed.params.url.includes('modules\\\\graph\\\\service.js')) {
            scriptId = parsed.params.scriptId;
            console.log('Found service.js scriptId:', scriptId);
            ws.send(JSON.stringify({
              id: 2,
              method: 'Debugger.getScriptSource',
              params: { scriptId: scriptId }
            }));
          }
        }
        
        if (parsed.id === 2) {
          console.log('Got script source!');
          fs.writeFileSync('e:/my-project/eduguard-ai/server/src/modules/graph/service_dump.js', parsed.result.scriptSource);
          console.log('Saved to service_dump.js');
          process.exit(0);
        }
      });
    });
  }).on('error', (e) => {
    console.error('Failed to get /json', e);
  });
}, 2000);
