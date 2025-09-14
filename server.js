require('dotenv').config();
const express = require("express");
const path = require("path");
const PORT = process.env.PORT;
const app = express();
const mongoose = require("mongoose");
const offerCheck = require("./middleware/cron");
const morgan = require("morgan");
const methodOverride = require("method-override")

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB);
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ Initial connection error:", error.message);
    }

    mongoose.connection.on("error", (err) => {
        console.error("❌ Mongoose connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ Mongoose disconnected from MongoDB");
    });
};
connectDB()
offerCheck()

//middlewares//

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views/user"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(morgan("dev"));
app.use(methodOverride("_method"))

//routes//

const userRouter = require("./routes/userRouter");
app.use("/", userRouter);

const adminRouter = require("./routes/adminRouter");
app.use('/admin', adminRouter);
app.use("*",(req , res)=>{
    res.render("404");
})

app.listen(PORT, () => {
    console.log(`Server running in http://localhost:${PORT}`);
});