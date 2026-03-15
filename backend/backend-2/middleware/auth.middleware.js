const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-local-secret-change-me';

exports.authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;
    // console.log("Token in middleware:", token);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try{    
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(error){
        return res.status(401).json({ message: "Invalid token" });
    }   
};