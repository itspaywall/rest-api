const User = require("../model/User");
const httpStatus = require("..//util/httpStatus");

function requireRole(role) {
    return (request, response, next) => {
        const identifier = request.user;
        User.findById(identifier, (error, user) => {
            if (error) {
                throw error;
            }
            if (user.role !== role) {
                response.status(httpStatus.FORBIDDEN).json({
                    message: "The requested resource is forbidden.",
                });
            } else {
                next();
            }
        });
    };
}

module.exports = requireRole;
