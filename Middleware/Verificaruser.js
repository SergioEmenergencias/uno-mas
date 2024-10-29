module.exports = (req, res, next) => {
    if (req.isAuthenticated()) {
        console.log("yolo",req.user)
        return next();
    }
    res.redirect("/auth/login");
};
