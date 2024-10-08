
const { Router } = require("express");
const { userMiddleWare } = require("../middleware/user");
const { purchaseModel } = require("../db");
const { courseModel } = require("../db")

const courseRouter = Router();

//user want to purchase a course

courseRouter.post("/purchase", userMiddleWare, async function (req, res) {
    const userId = req.user.id
    const { courseId } = req.body

    try {
        const course = await courseModel.findOne({ _id: courseId })
        if (!course) {
            res.json({
                message: "course not found"
            })
            return
        }

        //check if user already purchased this course
        const isPurchased = await purchaseModel.findOne({
            userId: userId,
            courseId: courseId
        })
        if (isPurchased) {
            res.json({
                message: "user already purchased this course"
            })
            return
        }

        //should check user has actually paid the price

        //todo: should check user has actually paid the price

        const purchase = await purchaseModel.create({
            userId: userId,
            courseId: courseId
        })
        res.json({
            message: "course purchased successfully",
            purchaseId: purchase._id
        })
        return
    } catch (error) {
        res.status(500).json({
            message: "An error occured during course purchase",
            error: error.message
        })
        return
    }


})
courseRouter.get("/preview", async function (req, res) {
    const courses = await courseModel.find({})

    res.json({
        message: "all courses preview",
        courses
    })
})

module.exports = {
    courseRouter: courseRouter
}