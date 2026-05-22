const http = require('http');

http.get('http://localhost:5001/api/v1/settings/public', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("=== PUBLIC API SETTINGS RESPONSE ===");
    console.log(data);
  });
}).on('error', (err) => {
  console.error("Error calling public API:", err);
});
