const profileService = require('../services/profile.service');
const { success } = require('../utils/responses');

async function update(req, res, next) {
  try {
    const user = await profileService.updateProfile(req.user, req.body);
    res.json(success({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      address: user.address,
      updated_date: user.updated_at.toISOString(),
    }));
  } catch (error) { next(error); }
}

module.exports = { update };
