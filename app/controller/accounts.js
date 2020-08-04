const mongoose = require("mongoose");
const joi = require("joi");
const httpStatus = require("../util/httpStatus");
const Account = require("../model/Account");

const { Types } = mongoose;

function toJSON(account) {
    return {
        identifier: account.id,
        userName: account.userName,
        firstName: account.firstName,
        lastName: account.lastName,
        emailAddress: account.emailAddress,
        phoneNumber: account.phoneNumber,
        addressLine1: account.addressLine1,
        addressLine2: account.addressLine2,
        city: account.city,
        state: account.state,
        country: account.country,
        zipCode: account.zipCode,
    };
}

function attachRoutes(router) {
    const accountSchema = joi.object({
        userName: joi
            .string()
            .trim()
            .alphanum()
            .lowercase()
            .min(3)
            .max(30)
            .required(),
        firstName: joi.string().trim().required(),
        lastName: joi.string().trim().required(),
        emailAddress: joi.string().email(),
        phoneNumber: joi.string(),
        addressLine1: joi.string(),
        addressLine2: joi.string(),
        city: joi.string(),
        state: joi.string(),
        country: joi.string(),
        zipCode: joi.string(),
    });
    router.post("/accounts", async (request, response) => {
        const body = request.body;
        const parameters = {
            userName: body.userName,
            firstName: body.firstName,
            lastName: body.lastName,
            emailAddress: body.emailAddress,
            phoneNumber: body.phoneNumber,
            addressLine1: body.addressLine1,
            addressLine2: body.addressLine2,
            city: body.city,
            state: body.state,
            country: body.country,
            zipCode: body.zipCode,
        };
        const { error, value } = accountSchema.validate(parameters);

        if (error) {
            response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        } else {
            const ownerId = new Types.ObjectId(request.user.identifier);
            const account = await Account.findOne({
                userName: value.userName,
                ownerId,
            });

            if (account) {
                response.status(httpStatus.BAD_REQUEST).json({
                    message:
                        "An account with the specified user name already exists.",
                });
            } else {
                value.ownerId = ownerId;
                const newAccount = new Account(value);
                await newAccount.save();

                response.status(httpStatus.CREATED).json(toJSON(newAccount));
            }
        }
    });

    /*
	const getAccountsSchema = joi.object({

	});
	router.get('/accounts', (request, response) => {
		
	});
	
	router.get('/accounts/:identifier', (request, response) => {
	});

	router.put('/accounts/:identifier', (request, response) => {

	});
	*/
}

module.exports = {
    attachRoutes,
};
