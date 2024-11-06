// TODO
let express = require("express");
let app = express();
let port = 8080;
let hostname = '0.0.0.0'; // for local testing change this to localhost

app.get("/", (req, res) => {
    res.send('Hello World!\n Testing for Autodeploy');
  })

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
