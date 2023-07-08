import Joi, { ObjectSchema } from 'joi';

const loginValidatorSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().required().messages({
    'string.base': 'Username must be of type string',
    'string.empty': 'Username is required'
  }),
  password: Joi.string().required().messages({
    'string.base': 'Password must be of type string',
    'string.empty': 'Password is required'
  })
});

export { loginValidatorSchema };
