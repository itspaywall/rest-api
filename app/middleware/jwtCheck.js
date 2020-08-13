const expressJwt = require("express-jwt");
const configuration = require("../../configuration");

const jwtCheck = expressJwt({
    secret: configuration.secret,
    audience: configuration.audience,
    issuer: configuration.issuer,
    algorithms: ["HS256"],
});

module.exports = jwtCheck;
