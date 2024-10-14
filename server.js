require('dotenv').config();
const express = require("express");
const path = require("path");
const PORT = process.env.PORT;
const app = express();
const mongoose = require("mongoose");




//middlewares//

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views/user"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//connec to MongoDB//
mongoose.connect("mongodb://localhost:27017/PICK_UR_PCEE");
//check//
const db = mongoose.connection;
db.on("error", (err) => console.error(err));



//routes//

const userRouter = require("./routes/userRouter");
app.use("/", userRouter);

const adminRouter = require("./routes/adminRouter");
app.use('/admin', adminRouter);

app.listen(PORT, () => {
    console.log(`Server running in http://localhost:${PORT}`);
});