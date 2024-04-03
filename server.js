const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const socketIo = require('socket.io');
const http = require('http');
// i was here

const app = express();
app.use(bodyParser.json());

const port = 3000;
const server = http.createServer(app);
io = socketIo(server);


mongoose.connect('mongodb://127.0.0.1:27017', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:");
    console.error(err);
  });




server.listen(port, () => {
  console.log(`your server is running on http://localhost:${port}`);
});


io.on("connection", (socket) => {
  console.log('connected to the cliend');
  console.log(socket.id, "has joined");

  socket.on("/test", (msg) => {
    console.log(msg);

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });

  })


})
app.get("/", function (req, res) {
  res.send("your server is running properly on hotspot");
});



const userSchema = new mongoose.Schema({
  team: {
    type: String,
    required: (true, "Please enter the team name")
  },
  username: {
    type: String,
    required: (true, "Please enter the team name")
  },
  password: {
    type: String,
    required: true,
  },
});

const userModel = mongoose.model("user", userSchema);

userModel.watch().on('change', (change) => {
  if (change.operationType === 'insert') {
    io.emit('dataChange', change.fullDocument);
  }
});

async function findUser(teamName) {
  try {
    return await userModel.findOne({ team: teamName });
  } catch (error) {
    console.log(error);
  }
}

async function generateToken(tokenData, secretKey, jwt_expire) {
  return jwt.sign(tokenData, secretKey, { expiresIn: jwt_expire });
}

async function loginUser(req, res, send) {
  const { team, password } = req.body;
  console.log(team, password);

  const user = await findUser(team);

  if (!user) {
    console.log('user does not exist');
  }
  else {

    console.log(user);
    if (await bcrypt.compare(password, user.password)) {
      const tokenData = { _id: user._id, team: user.team, name: user.username };
      const token = await generateToken(tokenData, "lol", "24h");

      res.status(200).json({ status: true, token: token });
    }
    else {
      console.log('wrong password');

    }
  }



}

app.post('/login', loginUser);

