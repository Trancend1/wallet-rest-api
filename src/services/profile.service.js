const { ApiError } = require('../utils/api-error');
const { requireString } = require('../utils/validation');

async function updateProfile(user, data) {
  const allowed = ['first_name', 'last_name', 'address'];
  const keys = Object.keys(data);
  if (keys.length !== allowed.length || keys.some((key) => !allowed.includes(key))) {
    throw new ApiError(400, 'Only first_name, last_name, and address can be updated');
  }
  await user.update({
    first_name: requireString(data.first_name, 'first_name'),
    last_name: requireString(data.last_name, 'last_name'),
    address: requireString(data.address, 'address'),
  });
  return user;
}

module.exports = { updateProfile };
