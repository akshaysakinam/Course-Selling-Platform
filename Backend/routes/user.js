
const { Router } = require("express")
const { userModel, purchaseModel, courseModel } = require("../db")
// const { purchaseModel } = require("../db")
const userRouter = Router();
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
dotenv.config()
const { z } = require("zod");
const { userMiddleWare } = require("../middleware/user");
const JWT_USER_PASSWORD = process.env.JWT_USER_PASSWORD

userRouter.post("/signup", async function (req, res) {
    const requiredBody = z.object({
        email: z.string().min(4).max(100).email(),
        password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{6,100}$/),
        firstName: z.string().min(5).max(50),
        lastName: z.string().min(5).max(50)
    })
    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if (!parsedDataWithSuccess) {
        res.json({
            message: "Incorrect Format",
            error: parsedDataWithSuccess.error
        })
        return
    }

    const { email, password, firstName, lastName } = req.body
    try {
        const hashedPassword = await bcrypt.hash(password, 5)
        await userModel.create({
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName
        })
        res.json({
            message: "User created succesfully"
        })
        return

    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                message: "User already exists"
            })
            return
        } else {
            res.status(500).json({
                message: "An error occured during signup",
                error: error.message
            })
            return
        }
    }
})
userRouter.post("/signin", async function (req, res) {
    const requiredBody = z.object({
        email: z.string().min(4).max(100).email(),
        password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{6,100}$/),

    })
    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if (!parsedDataWithSuccess) {
        res.json({
            message: "Incorrect Format",
            error: parsedDataWithSuccess.error
        })
        return
    }

    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email }) //either user or undefined
        if (!user) {
            res.json({
                message: "User not found"
            })
            return
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (isPasswordCorrect) {
            const token = jwt.sign({
                id: user._id
            }, JWT_USER_PASSWORD)

            //do cookie logic here if you want in future


            res.json({
                token: token
            })
            return
        } else {
            res.status(400).json({
                message: "Incorrect password"
            })
            return
        }


    } catch (error) {
        res.status(500).json({
            message: "An error occured during signin",
            error: error.message
        })
        return
    }
})
userRouter.get("/purchases", userMiddleWare, async function (req, res) {
    const userId = req.user.id
    try {
        const purchases = await purchaseModel.find({
            userId: userId
        })
        if (!purchases) {
            res.json({
                message: "No purchases found"
            })
            return
        }
        const courseData = await courseModel.find({
            _id: { $in: purchases.map(p => p.courseId) }
        })
        res.json({
            message: "All purchased courses",
            purchases,
            courses: courseData
        })
        return
    } catch (error) {
        res.status(500).json({
            message: "An error occured during purchases",
            error: error.message
        })
        return
    }

})
module.exports = {
    userRouter: userRouter
}