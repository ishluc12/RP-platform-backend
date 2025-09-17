function validateFields(body, requiredFields) {
    return requiredFields.every(field => !!body[field]);
}
module.exports = validateFields;