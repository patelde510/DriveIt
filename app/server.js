// TODO
let express = require("express");
let app = express();
let apiFile = require("../env.json");
let port = 3000;
let hostname = "localhost";

app.get("/", (req, res) => {
    res.send('Hello World!');
  })

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});
