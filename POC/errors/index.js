const CustomApiError=require('./custom-api');
const BadRequestError=require('./bad-request');
const notFoundError=require('./notFound');
const unauthenticatedError=require('./unauthenticated');

module.exports={
    CustomApiError,
    BadRequestError,
    unauthenticatedError,
    notFoundError
};