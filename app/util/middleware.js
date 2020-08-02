function unless(predicate, middleware) {
    return (request, response, next) => {
        if (predicate(request)) {
            next();
        } else {
            middleware(request, response, next);
        }
    };
}

module.exports = unless;
