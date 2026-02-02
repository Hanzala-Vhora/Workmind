const https = require('https');
const fs = require('fs');

const apiKey = 'AIzaSyAYm9vNg9fJ55Iw_Uv1FqfrQ9ihN3RddA8';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            let output = "Available Models:\n";
            if (json.models) {
                json.models.forEach(model => {
                    output += `- ${model.name} (${model.displayName})\n`;
                });
            } else {
                output += "No models found or error structure: " + JSON.stringify(json) + "\n";
            }
            fs.writeFileSync('models_list.txt', output, 'utf8');
            console.log("Done writing models to models_list.txt");
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            console.log("Raw data:", data);
        }
    });

}).on('error', (err) => {
    console.error('Error fetching models:', err.message);
});
