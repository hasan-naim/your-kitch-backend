const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();

const port = process.env.PORT || 5000;

/// middlewares

app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  let token = req.headers.authorization;
  if (!token) {
    res.status(401).send({ message: "unauthorized user" });
    return;
  }
  token = token.split(" ")[1];
  const decoded = jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        res.status(403).send({ message: "unauthorized access" });
        return;
      }

      req.decoded = decoded;
      next();
    }
  );
};

/// mongodb connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.49zsx7x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
// });
async function dbConnect() {
  try {
    const database = client.db("yourKitch");

    /// database collection
    const mealsCollection = database.collection("meals");
    const reviewCollection = database.collection("reviews");
    /// JWT TOKEN api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("jwt");
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res.send({ status: 200, token });
    });

    /// get apis

    app.get("/meals", async (req, res) => {
      const size = parseInt(req.query.size);
      const query = {};
      let cursor;

      if (size == 0) {
        cursor = await mealsCollection.find(query);
      } else {
        cursor = await mealsCollection.find({}).limit(size);
      }
      const result = await cursor.sort({ time: -1 }).toArray();
      res.send({ status: 200, meals: result });
    });

    app.get("/meals/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = mealsCollection.find(query);
      const meal = await cursor.toArray();
      res.send({ status: 200, meal: meal });
    });

    /// get reviews by id
    app.get("/reviewsById/:id", async (req, res) => {
      const id = req.params.id;
      const query = { mealId: id };
      const cursor = reviewCollection.find(query);
      const result = await cursor.sort({ time: -1 }).toArray();
      res.send({ status: 200, reviews: result });
    });
    app.get("/reviewtoedit/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send({ status: 200, review: result });
    });
    /// by email
    app.get("/reviewsByEmail", verifyJwt, async (req, res) => {
      const decoded = req.decoded;

      const email = req.query.email;

      if (decoded.email !== email) {
        return res.status(403).send({ message: "unauthorized access" });
      }

      const query = { email: email };
      const cursor = reviewCollection.find(query);
      const result = await cursor.sort({ time: -1 }).toArray();
      res.send({ status: 200, reviews: result });
    });

    ///post apies

    app.post("/review/post", async (req, res) => {
      const data = req.body;
      const addData = {
        ...data,
        time: new Date(),
      };
      const result = await reviewCollection.insertOne(addData);
      res.send(result);
    });

    /// update review

    app.patch("/editedreview/:id", async (req, res) => {
      const id = req.params.id;
      const bodyData = req.body;
      const query = { _id: ObjectId(id) };
      const updatedData = {
        $set: {
          details: bodyData.details,
          rating: bodyData.rating,
        },
      };

      const result = await reviewCollection.updateOne(query, updatedData);
      res.send({ status: 200, result: result });
    });

    /// delete

    app.delete("/reviewsByEmail", async (req, res) => {
      const id = req.query.id;
      const query = { _id: ObjectId(id) };

      const result = await reviewCollection.deleteOne(query);
      res.send({ status: 200, result: result });
    });

    /// handaling the error
  } catch (error) {
    console.log(error.message);
  }
}
dbConnect().catch((err) => console.log(err));
app.listen(port, () => console.log(`server is listening on ${port}`));
