const axios = require("axios");

axios.get("https://api.openweathermap.org/data/2.5/weather", {
  params: {
    q: "Mumbai",
    appid: "571470596129512ba63d7f61795dd8d9",
    units: "metric",
  },
})
  .then((res) => console.log("SUCCESS:", res.data))
  .catch((err) => console.log("FAILED:", err.message));