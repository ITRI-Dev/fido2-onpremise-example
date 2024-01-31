import "dotenv/config";
import express from 'express'
import fetch from "node-fetch";

const { KET, TOKEN } = process.env;
const app = express();

app.post("/register", async (req, res) => {
  try {
    const { email } = req.body;

    const { data: user } = await fetch(`https://admin-auth.ofido.tw/api/tenant/${KEY}/user`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        email,
        name: email
      })
    }).then((res) => res.json());

    const { data: token } = await fetch(`https://admin-auth.ofido.tw/api/tenant/${KEY}/user/${user.id}/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`
      }
    }).then((res) => res.json());

    res.json({
      token
    });
  } catch (err) {
    res.status(503).json({ err });
  }
});

const server = app.listen(8081, function () {
  const host = server.address().address
  const port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
});