const { Router } = require("express")
const { adminModel, courseModel } = require("../db")
const { z } = require("zod")
const bcrypt = require("bcrypt")
const adminRouter = Router();
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const { adminMiddleWare } = require('../middleware/admin');
const admin = require("../middleware/admin");
dotenv.config()

const JWT_ADMIN_PASSWORD = process.env.JWT_ADMIN_PASSWORD

adminRouter.post("/signup", async function (req, res) {
    const requiredBody = z.object({
        email: z.string().min(4).max(100).email(),
        password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{6,100}$/),
        firstName: z.string().min(5).max(50),
        lastName: z.string().min(5).max(50)
    })
    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if (!parsedDataWithSuccess.success) {
        res.json({
            message: "Incorrect Format",
            error: parsedDataWithSuccess.error
        })
        return
    }

    const { email, password, firstName, lastName } = req.body
    try {
        const hashedPassword = await bcrypt.hash(password, 5)
        await adminModel.create({
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
adminRouter.post("/signin", async function (req, res) {
    const requiredBody = z.object({
        email: z.string().min(4).max(100).email(),
        password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{6,100}$/),

    })
    const parsedDataWithSuccess = requiredBody.safeParse(req.body)
    if (!parsedDataWithSuccess.success) {
        res.json({
            message: "Incorrect Format",
            error: parsedDataWithSuccess.error
        })
        return
    }

    try {
        const { email, password } = req.body
        const admin = await adminModel.findOne({ email })
        if (!admin) {
            res.json({
                message: "User not found"
            })
            return
        }
        const isPasswordCorrect = await bcrypt.compare(password, admin.password)
        if (!isPasswordCorrect) {
            res.json({
                message: "Incorrect password"
            })
            return
        }
        const token = jwt.sign({
            id: admin._id
        }, JWT_ADMIN_PASSWORD)

        //do cookie logic here if you want in future

        res.json({
            token: token
        })
        return

    } catch (error) {
        res.status(500).json({
            message: "An error occured during signin",
            error: error.message
        })
        return
    }

})

//admin create a course
adminRouter.post("/course", adminMiddleWare, async function (req, res) {
    const adminId = req.user.id
    const { title, description, price, imageUrl } = req.body
    try {
        const course = await courseModel.create({
            title: title,
            description: description,
            price: price,
            imageUrl: imageUrl,
            adminId: adminId
        })
        res.json({
            message: "course created successfully",
            courseId: course._id
        })
        return
    } catch (error) {
        res.status(500).json({
            message: "An error occured during course creation",
            error: error.message
        })
        return
    }

})
//admin edit a course
adminRouter.put("/course", adminMiddleWare, async function (req, res) {
    const adminId = req.user.id
    const { title, description, price, imageUrl, courseId } = req.body

    try {
        const course = await courseModel.findOne({ _id: courseId })
        if (!course) {
            res.json({
                message: "course not found"

            })
            return
        }
        if (course.adminId.toString() !== adminId) {
            res.json({
                message: "Only creator of this course can edit "
            })
            return
        } else {

            await courseModel.updateOne({ _id: courseId }, {
                title: title,
                description: description,
                price: price,
                imageUrl: imageUrl
            })
            res.json({
                message: "course edited successfully"
            })
            return

        }
        //or
        //dont use this coz we need to find course whether it present or not and then update
        // await courseModel.updateOne({
        //     _id: courseId,
        //     adminId: adminId
        // }, {
        //     title: title,
        //     description: description,
        //     price: price,
        //     imageUrl: imageUrl
        // })
        // res.json({
        //     message: "course edited successfully"
        // })
        // return
    } catch (error) {
        res.status(500).json({
            message: "An error occured during course edit",
            error: error.message
        })
        return
    }


})
//admin get all created courses
adminRouter.get("/course/bulk", adminMiddleWare, async function (req, res) {
    const adminId = req.user.id
    try {
        const courses = await courseModel.find({ adminId: adminId })
        res.json({
            message: "successfully get all courses",
            courses: courses
        })
        return
    } catch (error) {
        res.status().json({
            message: "An error occured during get all courses",
            error: error.message
        })
    }

})
//admin delete a course
adminRouter.delete("/course", adminMiddleWare, async function (req, res) {
    const adminId = req.user.id
    const { courseId } = req.body
    try {
        const course = await courseModel.findOne({ _id: courseId })
        if (!course) {
            res.status(404).json({
                message: "course not found"
            })
            return
        }
        if (course.adminId.toString() !== adminId) {
            res.status(403).json({
                message: "Only creator of this course can delete"
            })
            return
        }
        await courseModel.deleteOne({
            _id: courseId
        })
        res.json({
            message: "course deleted successfully"
        })
        return
    } catch (error) {
        res.status(500).json({
            message: "An error occured during delete course",
            error: error.message
        })
        return
    }

})

module.exports = {
    adminRouter: adminRouter
}
