function validateFields(body, requiredFields){
    return requiredFields.every(field => !!body[field]);
}
export  default validateFields;