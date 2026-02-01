const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;
    // console.log("Token in middleware:", token);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try{    
        const decoded = jwt.verify(token,"SECRET-KEY-ME");
        req.user = decoded;
        next();
    }
    catch(error){
        return res.status(401).json({ message: "Invalid token" });
    }   
};