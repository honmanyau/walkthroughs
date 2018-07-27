module.exports = (function() {
  let database = { entries: 0, users: {} },
      create = () => {},
      findOne = () => {},
      publicAPI = {};

  create = function({ username, password, email, mobile }) {
    return new Promise(function(resolve, reject) {
      let usernameIsString = typeof username === 'string',
        passwordIsString = typeof password === 'string',
        valuesAreValid = usernameIsString && passwordIsString;

      if (valuesAreValid) {
        let uid = 'uid' + (++database.entries),
            user = { uid, username, password, email, mobile };

        database.users[uid] = user;
        resolve({ ...user });
      }
      else {
        throw Error('Username and/or password are strings!');
      }
    });
  };

  findOne = function({ username, uid }) {
    return new Promise(function(resolve, reject) {
      let user = database.users[uid];

      if (!user) {
        for (let id in database.users) {
          let entry = database.users[id];

          if (username === entry.username) {
            user = { ...entry };
          }
        }
      }

      resolve(user || null);
    });
  };

  publicAPI = {
    create,
    findOne
  };

  return publicAPI;
})();
