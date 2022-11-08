const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();

const port = process.env.PORT || 5000;

/// middlewares

app.use(cors());
app.use(express.json());

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

    /// get apis

    app.get("/meals", async (req, res) => {
      const size = parseInt(req.query.size);
      console.log(size);
      const query = {};
      let cursor;

      if (size == 0) {
        cursor = await mealsCollection.find({});
      } else {
        cursor = await mealsCollection.find({}).limit(size);
      }
      const result = await cursor.sort({ time: -1 }).toArray();
      res.send({ status: 400, meals: result });
    });
  } catch (error) {}
}
dbConnect().catch((err) => console.log(err));
app.listen(port, () => console.log(`server is listening on ${port}`));
