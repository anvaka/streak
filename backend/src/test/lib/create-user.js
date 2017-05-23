let freeId = 0;

module.exports = function createUser(name, picture) {
  freeId += 1;

  return {
    id: freeId + name.replace(/\s/g, '_'),
    data: {
      picture: picture || '',
      name,
      email: `${name}@company.com`,
      email_verified: true,
      family_name: 'Smith',
      given_name: 'John',
      locale: 'en',
    }
  };
};
