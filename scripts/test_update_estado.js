const http = require('http');

function putEstado(projectId, estado){
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ estado });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/proyectos/${projectId}/estado`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try{
          const json = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: json });
        }catch(err){
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try{
    const r = await putEstado(10, 'en_pausa');
    console.log('Response:', r);
  }catch(err){
    console.error('Request error:', err);
    process.exitCode = 1;
  }
})();