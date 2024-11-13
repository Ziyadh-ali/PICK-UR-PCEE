require('dotenv').config();
const express = require("express");
const path = require("path");
const PORT = process.env.PORT;
const app = express();
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB);
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.error("MongoDB not connected:", error.message);
    }
};
connectDB()
// const connectDB = async () => {
//     try {
//         await mongoose.connect("mongodb://localhost:27017/PICK_UR_PCEE");
//         console.log("Connected to MongoDB Atlas");
//     } catch (error) {
//         console.error("MongoDB not connected:", error.message);
//     }
// };
// connectDB()


//middlewares//

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views/user"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//connec to MongoDB//
// mongoose.connect("mongodb://localhost:27017/PICK_UR_PCEE");


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