require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")
const cors = require("cors")

app.use(cors({
    origin: "https://interview-ai-mu-five.vercel.app",
    credentials: true
}))

connectToDB()


app.listen(3000, () => {
    console.log("Server is running on port 3000")
})