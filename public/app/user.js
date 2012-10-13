define(['exports', 'const', 'patch'], function(exports, CONST) {
  'use strict';

  function getUser() {
    var user = localStorage.getObject(CONST.CURRENT_USER_KEY);
    return user;
  }

  function setUser(user) {
    localStorage.setObject(CONST.CURRENT_USER_KEY, user);
  }

  function saveUser(user) {
    var users = getUserList();
    var greped = $.grep(users, function(u) {
      return u.uid == user.uid;
    });
    if (greped.length) {
      // 更新帐号
      greped.token = user.token;
      saveUserList([user]);
    } else {
      // 增加帐号
      users.push(user);
      setUser(user);
      saveUserList(users);
    }
  }

  function removeUser(user) {
    var users = getUserList();
    $.each(users, function(i, u) {
      if (user.uid == u.uid) {
        users.splice(i, 1);
        saveUserList(users);
        return false;
      }
    });
  }

  function getUserList() {
    var users = localStorage.getObject(CONST.USER_LIST_KEY);
    return users || [];
  }

  function saveUserList(users) {
    localStorage.setObject(CONST.USER_LIST_KEY, users);
  }

  exports.getUser = getUser;
  exports.setUser = setUser;
  exports.saveUser = saveUser;
  exports.removeUser = removeUser;
  exports.getUserList = getUserList;
  exports.saveUserList = saveUserList;

});
