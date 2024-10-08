const express = require('express');
const mongoose = require("mongoose")
const dotenv = require('dotenv');
dotenv.config();
const { userRouter, } = require('./routes/user');
const { courseRouter } = require('./routes/course');
const { adminRouter } = require('./routes/admin');

const app = express();


const port = 3000 || process.env.PORT;

app.use(express.json());

app.use("/api/v1/user", userRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/course", courseRouter)

async function main() {
    await mongoose.connect(process.env.MONGO_DB_URL)
    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`)
    })

}
main()
