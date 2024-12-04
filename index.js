require("dotenv").config();
require("./db");
const { AuthRoutes } = require("./src/auth");
const ArticlesRoutes = require("./src/articles");
const ProfileRoutes = require("./src/profile");
const FollowingRoutes = require("./src/following");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");


const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
// Configure session middleware
app.use(
  session({
    secret: "rice university",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
    }, 
  })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => res.send({ hello: "world" }));
AuthRoutes(app);
ArticlesRoutes(app);
ProfileRoutes(app);
FollowingRoutes(app);

if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`API Docs available at http://localhost:${port}/api-docs`);
  });
}
// At the end of index.js
module.exports = app;