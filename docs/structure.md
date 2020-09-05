# Structure

The `hubble-server` repository has the following file structure:

`app`\
├── `controller`\
├── `middleware`\
├── `model`\
└── `util`\

A brief description how what each subdirectory contains:

## 1. `controller`

This subdirectory contains code for the REST APIs of all the objects. The files use a library called `joi` among others, which is used for data validation. The controller modules export the `attachRoutes` function which accepts a router. The endpoints implemented by the controllers are attached to this router.

## 2. `middleware`
 
 This subdirectory stores middleware. Some of the middleware already in this directory are the `jwtCheck` middleware that does the JWT authentication, the `requireRole` middleware that checks the role of the user (for example, `REGULAR_USER`), and the `unless` middleware, used to conditionally prevent `jwtCheck` and `requireRole` middleware from executing based on the request. Middleware functions can perform the following tasks:

* Execute any code.
* Make changes to the request and the response objects.
* End the request-response cycle.
* Call the next middleware function in the stack.

## 3. `model`

This subdirectory contains files that contain the Mongoose models for all the objects.

## 4. `util`

This subdirectory contains simple utilities, such as `httpStatus`, which exports more readable symbols for HTTP codes, and `paginate`, which helps in paging the database.






