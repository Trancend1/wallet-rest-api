function success(result) {
  return { status: 'SUCCESS', result };
}

function publicUser(user, dateField = 'created_date') {
  return {
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    phone_number: user.phone_number,
    address: user.address,
    [dateField]: (user.updated_at || user.created_at).toISOString(),
  };
}

module.exports = { success, publicUser };
