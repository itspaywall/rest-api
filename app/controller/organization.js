const mongoose = require("mongoose");
const joi = require("joi");
const assert = require("assert");
const constants = require("../util/constants");
const httpStatus = require("../util/httpStatus");
const Organization = require("../model/organization");
const misc = require("../util/misc");

const { Types } = mongoose;

function toExternal(organization) {
    return {
        id: organization.id,
        name: organization.name,
        emailAddress: organization.emailAddress,
        phoneNumber: organization.phoneNumber,
        gstin: organization.gstin,
        addressLine1: organization.addressLine1,
        addressLine2: organization.addressLine2,
        city: organization.city,
        state: organization.state,
        country: organization.country,
        zipCode: organization.zipCode,
        website: organization.website,
        industry: organization.industry,
    };
}

const organizationSchema = joi.object({
    name: joi.string().alphanum().lowercase().min(2).max(100).required(),
    emailAddress: joi.string().email().trim().empty("").default(null),
    phoneNumber: joi.string().trim().allow(null).empty("").default(null),
    gstin: joi
        .string()
        .trim()
        .allow(null)
        .min(15)
        .max(15)
        .empty("")
        .default(null),
    addressLine1: joi.string().trim().allow(null).empty("").default(null),
    addressLine2: joi.string().trim().allow(null).empty("").default(null),
    city: joi.string().trim().allow(null).empty("").default(null),
    state: joi.string().trim().allow(null).empty("").default(null),
    country: joi.string().trim().allow(null).empty("").default(null),
    zipCode: joi.string().trim().allow(null).empty("").default(null),
    website: joi.string().trim().allow(null).empty("").default(null),
    industry: joi.string().trim().allow(null).empty("").default(null),
});

function attachRoutes(router) {
    router.post("/organizations", async (request, response) => {
        const body = request.body;
        const parameters = {
            name: organization.name,
            emailAddress: organization.emailAddress,
            phoneNumber: organization.phoneNumber,
            gstin: organization.gstin,
            addressLine1: organization.addressLine1,
            addressLine2: organization.addressLine2,
            city: organization.city,
            state: organization.state,
            country: organization.country,
            zipCode: organization.zipCode,
            website: organization.website,
            industry: organization.industry,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt,
        };
        const { error, value } = organizationSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }

        const newOrganization = new Organization(value);
        newOrganization.ownerId = new Types.ObjectId(request.user.identifier);
        await newOrganization.save();

        response.status(httpStatus.CREATED).json(toExternal(newOrganization));
    });

    const identifierPattern = /^[a-z0-9]{24}$/;
    /* An organization created by one user should be hidden from another user. */
    router.get("/organizations/:id", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified organization identifier is invalid.",
            });
        }

        const id = new Types.ObjectId(request.params.identifier);
        const organization = await Organization.findById(id).exec();
        if (organization) {
            return response
                .status(httpStatus.OK)
                .json(toExternal(organization));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message:
                "Cannot find an organization with the specified identifier.",
        });
    });

    router.put("/organizations/:id", async (request, response) => {
        if (!identifierPattern.test(request.params.identifier)) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: "The specified organization identifier is invalid.",
            });
        }

        const body = request.body;
        const parameters = {
            id: organization.id,
            name: organization.name,
            emailAddress: organization.emailAddress,
            phoneNumber: organization.phoneNumber,
            gstin: organization.gstin,
            addressLine1: organization.addressLine1,
            addressLine2: organization.addressLine2,
            city: organization.city,
            state: organization.state,
            country: organization.country,
            zipCode: organization.zipCode,
            website: organization.website,
            industry: organization.industry,
        };
        const { error, value } = organizationSchema.validate(parameters);

        if (error) {
            return response.status(httpStatus.BAD_REQUEST).json({
                message: error.message,
            });
        }
        const _id = new Types.ObjectId(request.params.identifier);

        const organization = await Organization.findOneAndUpdate(
            { _id },
            value,
            { new: true }
        ).exec();
        if (organization) {
            return response
                .status(httpStatus.OK)
                .json(toExternal(organization));
        }

        response.status(httpStatus.NOT_FOUND).json({
            message:
                "Cannot find an organization with the specified identifier.",
        });
    });
}

module.exports = {
    attachRoutes,
};
