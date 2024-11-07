// TODO
let express = require("express");
let app = express();
let port = 8080;
let hostname = '0.0.0.0'; // for local testing change this to localhost --'0.0.0.0'

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
