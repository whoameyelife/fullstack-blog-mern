import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const Client = await MongoClient.connect("mongodb://localhost:27017", {
      useUnifiedTopology: true,
    });
    const db = Client.db("my-blog");
    await operations(db);
    Client.close();
  } catch (error) {
    res.status(500).json({ message: "Error Connecting to db", error });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  const articleName = req.params.name;
  withDB(async (db) => {
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articlesInfo);
  }, res);
});

app.post("/api/articles/:name/upvotes", async (req, res) => {
  const articleName = req.params.name;
  withDB(async (db) => {
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articlesInfo.upvotes + 1,
        },
      }
    );

    const updatedArticlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticlesInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", async (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;
  withDB(async (db) => {
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articlesInfo.comments.concat({ username, text }),
        },
      }
    );
    const updatedArticlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticlesInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => {
  console.log("SERVER RUNNING ON 8000");
});
