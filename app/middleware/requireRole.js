const User = require("../model/user");
const httpStatus = require("../util/httpStatus");

function requireRole(role) {
    return (request, response, next) => {
        User.findById(request.user.identifier, (error, user) => {
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
