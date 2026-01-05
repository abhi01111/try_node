import express from "express";
import mongoose from "mongoose";

const app = express();

mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`)
.then(()=> console.log("Mongo Connected"))
.catch(err=> console.error("DB Error:",err));

app.get("/", (req,res)=> res.send("Backend Running"));

app.listen(process.env.NODE_PORT, ()=> console.log("Server running"));
