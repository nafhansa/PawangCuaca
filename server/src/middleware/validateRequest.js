const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

const weatherQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
});

const voteBodySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
  forecast_hour: Joi.string().isoDate().required(),
  vote_type: Joi.string().valid('upvote', 'downvote').required(),
  voter_fingerprint: Joi.string().alphanum().min(16).max(128).required(),
});

const votesQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
  hours: Joi.number().integer().min(1).max(48).optional().default(12),
});

function validate(schema) {
  return (req, _res, next) => {
    const target = req.method === 'GET' ? req.query : req.body;
    const { error, value } = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return next(new ValidationError(messages));
    }

    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }

    return next();
  };
}

module.exports = {
  validateWeatherQuery: validate(weatherQuerySchema),
  validateVoteBody: validate(voteBodySchema),
  validateVotesQuery: validate(votesQuerySchema),
};
