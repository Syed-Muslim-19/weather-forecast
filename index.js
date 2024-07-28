const http = require("http");
const fs = require("fs");
const url = require("url");
const requests = require("requests");

// Read the HTML file
const homeFile = fs.readFileSync("home.html", "utf-8");

// Function to replace placeholders with actual data
const replaceVal = (tempTemplate, weatherData) => {
  let temperature = tempTemplate.replace("{%tempval%}", weatherData.main.temp);
  temperature = temperature.replace("{%tempmin%}", weatherData.main.temp_min);
  temperature = temperature.replace("{%tempmax%}", weatherData.main.temp_max);
  temperature = temperature.replace("{%location%}", weatherData.name);
  temperature = temperature.replace("{%country%}", weatherData.sys.country);
  temperature = temperature.replace(
    "{%tempstatus%}",
    weatherData.weather[0].main
  );
  return temperature;
};

// Create server
const server = http.createServer((req, res) => {
  const queryObject = url.parse(req.url, true).query;
  const city = queryObject.city || "lahore";

  if (req.url.startsWith("/")) {
    requests(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=f121eb076bb1799cbfdd2d14d8ce42dd&units=metric`
    )
      .on("data", (chunk) => {
        try {
          const objData = JSON.parse(chunk);
          if (objData.main && objData.sys && objData.weather) {
            const arrData = [objData];
            const realTimeData = arrData
              .map((val) => replaceVal(homeFile, val))
              .join("");
            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(realTimeData);
          } else {
            throw new Error("Invalid weather data");
          }
        } catch (error) {
          console.error("Error parsing weather data:", error.message);
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end("<h1>Internal Server Error</h1>");
        }
      })
      .on("end", (err) => {
        if (err) {
          console.log("Connection closed due to errors", err);
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end("<h1>Internal Server Error</h1>");
        } else {
          res.end();
        }
      })
      .on("error", (err) => {
        console.error("Error with API request:", err.message);
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end("<h1>Internal Server Error</h1>");
      });
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404 Not Found</h1>");
  }
});

// Start the server
server.listen(8080, "127.0.0.1", () => {
  console.log("Server running on port 8080...");
});
