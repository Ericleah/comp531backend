const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const User = require("../src/model/UserSchema");
const Profile = require("../src/model/ProfileSchema");
const { Article } = require("../src/model/ArticleSchema");

const DB_CONNECTION_STRING =
  "mongodb+srv://cw206:Qwerzxc123.@cluster0.440lk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

require("dotenv").config();
process.env.NODE_ENV = "test";

describe("Backend Unit Tests", () => {
  let agent;
  let server;

  beforeAll(async () => {
    server = app.listen(0, () => { 
      const { port } = server.address();
      if (port === 3000) { 
        throw new Error("Test server port cannot be 3000");
      }
      console.log(`Test server running on port ${port}`);
      agent = request.agent(`http://localhost:${port}`);
    });
  });
  
  afterAll(async () => {
    if (server) {
      server.close(() => {
        console.log("Test server closed");
      });
    }
  });

  describe("Authentication Tests", () => {
    it("should validate POST /register", async () => {
      const response = await request(app)
        .post("/register")
        .send({
          username: "Joey",
          password: "pass",
          email: "newuser@example.com",
          dob: "2000-01-01",
          phone: "9876543210",
          zipcode: "54321",
        })
        .expect(200);

      expect(response.body.result).toBe("success");
    });

    it("should validate POST /login", async () => {
      // Ensure the user is registered
      await request(app)
        .post("/register")
        .send({
          username: "loginUser",
          password: "123",
          email: "login@example.com",
          dob: "1980-01-01",
          phone: "1234567890",
          zipcode: "12345",
        })
        .expect(200);

      // Test login
      const response = await request(app)
        .post("/login")
        .send({ username: "loginUser", password: "123" })
        .expect(200);

      expect(response.body.result).toBe("success");
    });
  });

  describe("Authenticated Tests", () => {
    beforeEach(async () => {
      // Clear test data before each test
      await User.deleteMany({});
      await Profile.deleteMany({});
      await Article.deleteMany({});

      // Register and log in a user for authenticated tests
      await agent
        .post("/register")
        .send({
          username: "Joey1",
          password: "pass",
          email: "test@example.com",
          dob: "2000-01-01",
          phone: "1234567890",
          zipcode: "12345",
        })
        .expect(200);

        const loginResponse = await agent
        .post("/login")
        .send({ username: "Joey1", password: "pass" })
        .expect(200);
    
        expect(loginResponse.body.result).toBe("success");
    });

    // Unit Test: GET /headline
    it("should validate GET /headline", async () => {
      const newHeadline = "Rice University";
      await agent.put("/headline").send({ headline: newHeadline }).expect(200);

      const response = await agent.get("/headline").expect(200);
      expect(response.body.headline).toBe(newHeadline);
    });

    // Unit Test: PUT /headline
    it("should validate PUT /headline", async () => {
      const newHeadline = "Updated Headline";
      await agent.put("/headline").send({ headline: newHeadline }).expect(200);

      const response = await agent.get("/headline").expect(200);
      expect(response.body.headline).toBe(newHeadline);
    });

    // Unit Test: GET /articles
    it("should validate GET /articles", async () => {
      const response = await agent.get("/articles").expect(200);
      expect(response.body.articles).toBeDefined();
      expect(response.body.articles.length).toBe(0);
    });

    // Unit Test: POST /article
    it("should validate POST /article", async () => {
      const articleResponse = await agent
        .post("/article")
        .send({ text: "This is a test article" })
        .expect(201);

      expect(articleResponse.body.articles[0].text).toBe("This is a test article");
    });

    // Unit Test: GET /articles/:id
    it("should validate GET /articles/:id", async () => {
      const articleResponse = await agent
        .post("/article")
        .send({ text: "This is a test article" })
        .expect(201);

      const articleId = articleResponse.body.articles[0].id;
    });

    // Unit Test: PUT /logout
    it("should validate PUT /logout", async () => {
      await agent.put("/logout").expect(200);
    });
  });
});
