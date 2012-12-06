define(['app', 'user', 'patch', 'imagepreview'], function(App, User, patch) {
  'use strict';

  Handlebars.registerHelper('dateFormat', function(date) {
    return date && new Date(date).format('');
  });
  Handlebars.registerHelper('textFormat', function(text) {
    return text;
  });
  Handlebars.registerHelper('trendsFormat', function(trends) {
    for (var t in trends) {
      if (t) {
        var dom = '', name = '';
        $.each(trends[new Date(t).format('yyyy-MM-dd hh:mm')], function(i, d) {
          name = '#' + d.name + '#';
          dom += '<li data-action="choose-trend" title="' + name + '">' + name + '</li>';
        });
        return dom;
      }
    }
  });

  var $body = $('body');
  var $main = $('#main');
  var $profile = $('#J_profile');
  var $picUpload = $('#J_pic_upload'),
//    $picUploadFile = $('#J_pic_upload_file'),
    $picUploadForm = $('#J_pic_upload_form');
  var $userList = $('#J_user_list_con');
  var statusTpl = $('#J_status').html(),
    statusContext = Handlebars.compile(statusTpl);
  var commentTpl = $('#J_comment').html(),
    commentContext = Handlebars.compile(commentTpl);
  var followTpl = $('#J_follow').html(),
    followContext = Handlebars.compile(followTpl);
  var favoritesTpl = $('#J_favorites').html(),
    favoritesContext = Handlebars.compile(favoritesTpl);
  var repeatTpl = $('#J_repeat').html(),
    repeatContext = Handlebars.compile(repeatTpl);
  var userProfileTpl = $('#J_user_profile').html(),
    userProfileContext = Handlebars.compile(userProfileTpl);
  var emotionTpl = $('#J_emotions').html(),
    emotionContext = Handlebars.compile(emotionTpl);
  var trendTpl = $('#J_trends').html(),
    trendsContext = Handlebars.compile(trendTpl);
  var optionsTpl = $('#J_options').html(),
    optionsContext = Handlebars.compile(optionsTpl);
  var $btnMore = $('#J_btn_more');
  var $statusUpdate = $('#J_status_update'),
    $statusUpdateTextarea = $('#J_status_update_textarea'),
    $J_pic_online = $('#J_pic_online'),
    $uploadPicForm = $('#uploadPicForm'),
    $pic_preview = $('#J_pic_preview');
  var userListTpl = $('#J_user_list').html(),
    userListContext = Handlebars.compile(userListTpl);
  var unreadTpl = $('#J_unread').html(),
    unreadContext = Handlebars.compile(unreadTpl);
  var sendMailTpl = $('#J_send_mail').html();

  var fetch = function(url, options) {
    return $.get(api + url, options);
  };

  var api = '/api/';

  var beforeRender = function(ctx, key, callback) {
    $btnMore.off('click').on('click', function() {
      callback(ctx[key].page++);
    });
    ctx[key] = ctx[key] || {};
    ctx[key].page = 1;
    $btnMore.click();
  };

  var fetchProfile = function(uid) {
    fetch('users/show/' + uid).done(function(result) {
      $profile.html(userProfileContext(result)).show();
    });
  };

  var Router = Backbone.Router.extend({
    routes: {
      '': 'index',
      'signin': 'signin',
      'statuses/public_timeline': 'statuses/public_timeline',
      'statuses/home_timeline/:uid': 'statuses/home_timeline',
      'statuses/user_timeline/:uid': 'statuses/user_timeline',
      'statuses/show/:id': 'statuses/show',
      'favorites/:id': 'favorites',
      'comments/by_me': 'comments/by_me',
      'comments/to_me': 'comments/to_me',
      'comments/mentions': 'comments/mentions',
      'statuses/mentions': 'statuses/mentions',
      'friendships/friends/:uid': 'friendships/friends',
      'friendships/followers/:uid': 'friendships/followers',
      'account/end_session': 'account/end_session',
      'account/options': 'account/options',
      'options/sendmail': 'options/sendmail'
    },
    index: function() {
      var user = User.getUser();
      $profile.hide();
      fetch('index', $.isEmptyObject(user) ? {} : {uid: user.uid, token: user.token}).done(function(result) {
        $main.html(result);
      });
    },
    signin: function() {
      fetch('signin').done(function(result) {
        location.href = result;
      });
    },
    'statuses/public_timeline': function() {
      if (uid && token) {
        var user = {uid: uid, token: token};
        User.setUser(user);
        User.saveUser(user);
      }
      $profile.hide();
      fetch('statuses/public_timeline').done(function(result) {
        if (!result.error) $btnMore.show();
        $main.html(statusContext(result));
      });
    },
    'statuses/home_timeline': function(uid) {
      // TODO backbone 自动回收容器资源
      var url = 'statuses/home_timeline/' + uid;
      $main.html('');
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.append(statusContext(result));
        });
      });
      fetchProfile(uid);
    },
    'statuses/user_timeline': function(uid) {
      var url = 'statuses/user_timeline/' + uid;
      $main.html('');
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.append(statusContext(result));
        });
      });
      fetchProfile(uid);
    },
    'statuses/show': function(id) {
      fetch('statuses/show/' + id).done(function(result) {
        $btnMore.show();
        result.statuses = [result];
        $main.html(statusContext(result));
        $main.find('.content > .info a[data-action="repeat"]').click();
      });
    },
    'favorites': function(id) {
      var url = 'favorites/' + id;
      $main.html('');
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.html(favoritesContext(result));
        });
      });
    },
    'comments/by_me': function() {
      var url = 'comments/by_me';
      $main.html('');
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.append(commentContext(result));
        });
      });
    },
    'comments/to_me': function() {
      var url = 'comments/to_me';
      $main.html('');
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.append(commentContext(result));
        });
      });
    },
    'comments/mentions': function() {
      var url = 'comments/mentions';
      $main.html('');
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.append(commentContext(result));
        });
      });
    },
    'statuses/mentions': function() {
      var url = 'statuses/mentions';
      $main.html('');
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.append(statusContext(result));
        });
      });
    },
    'friendships/friends': function(uid) {
      $main.html('');
      var url = 'friendships/friends/' + uid;
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.append(followContext(result));
        });
      });
      fetchProfile(uid);
    },
    'friendships/followers': function(uid) {
      $main.html('');
      var url = 'friendships/followers/' + uid;
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $btnMore.show();
          $main.append(followContext(result));
        });
      });
      fetchProfile(uid);
    },
    'account/end_session': function() {
      fetch('account/end_session').done(function(result) {
        if (result && result.error) {
          alert(result.error);
        }
        else {
          location.replace('/');
        }
      });
    },
    'account/options': function() {
      $profile.hide();
      $btnMore.hide();
      var users = User.getUserList();
      if (users.length) {
        $.each(users, function(i, u) {
          fetch('users/show/' + u.uid).done(function(result) {
            $.extend(u, result);
            User.saveUser(u);
            if (i == users.length - 1) {
              $main.html(optionsContext(users));
            }
          });
        });
      }
    },
    'options/sendmail': function() {
      $profile.hide();
      $btnMore.hide();
      $main.html(sendMailTpl);
      var $address = $('#J_mail_address');
      var $send = $('#J_mail_send');
      var $options = $('#J_mail_options');
      $options.find(':checked').each(function() {

      });
    }
  });

  $body.on("click", "img.bigcursor",function() {
    var $img = $(this),
      $next = $img.next(),
      murl = $img.data('middle');
    $next.show();
    if (murl) {
      var $new = $('<img src="' + murl + '">').load(function() {
        $img.parent().html($new);
      });
    }
  }).on("click", "a[data-action=repeat]",
    function() {
      var $a = $(this),
        id = $a.closest('.action_list').data('id'),
        $info = $a.closest('.info');
      $info.next().remove();
      fetch('comments/show/' + id, {count: 200}).done(function(result) {
        if (result) {
          $info.after(repeatContext(result));
        }
      });
    }).on("click", "a[data-action=repost]",
    function() {
      var $a = $(this),
        id = $a.closest('.action_list').data('id'),
        $info = $a.closest('.info');
      $info.next().remove();
      fetch('statuses/repost_timeline/' + id, {count: 200}).done(function(result) {
        if (result) {
          result.comments = result.reposts;
          $info.after(repeatContext(result));
        }
      });
    }).on("click", "a[data-action=favorite]",
    function() {
      var $a = $(this),
        isCreate = $a.data('create'),
        url = 'favorites/' + (isCreate ? 'create' : 'destroy'),
        id = $a.closest('.feed_list').attr('mid');
      fetch(url, {id: id}).done(function(result) {
        if (result) {
          $a.text(isCreate ? '已收藏' : '收藏');
        }
      });
    }).on("click", "button[data-action=repeat]",
    function() {
      var $btn = $(this),
        $content = $btn.closest('.content'),
        $repeat = $content.find('a[data-action=repeat]'),
        $input = $btn.closest('.input'),
        $main = $btn.closest('.repeat'),
        id = $btn.closest('.feed_list').attr('mid'),
        comment_ori = $input.find('.W_checkbox').prop('checked') ? 1 : 0,
        comment = $input.find('textarea').val();
      fetch('comments/create', {id: id, comment: comment, comment_ori: comment_ori}).done(
        function(result) {
          var err = result.error;
          if (err) {
            alert(err);
          } else {
            $main.remove();
            $repeat.click();
          }
        });
    }).on("click", "[data-action=friend-create]",
    function() {
      var $this = $(this),
        id = $this.data('id'),
        create = $this.data('create');
      fetch('friendships/' + (create ? 'create' : 'destroy'), {uid: id}).done(
        function(result) {
          result.error ? alert(result.error) : $this.html(create ? '已关注' : '关注');
        });
    }).on("click", "[data-action=emotions]",
    function() {
      var $this = $(this);
      fetch('emotions').done(
        function(result) {
          // too many emotions
          result = result.slice(0, 8 * 6);
          $this.data('emotions', result);
          $this.popover({
            title: '表情', delay: {show: 200},
            placement: 'bottom', trigger: 'click', content: emotionContext(result)
          });
          $this.popover('toggle');
        });
    }).on("click", "[data-action=trends]",
    function() {
      var $this = $(this);
      fetch('trends/hourly').done(
        function(result) {
          $this.data('trends', result);
          $this.popover({
            title: '话题', delay: {show: 200},
            placement: 'bottom', trigger: 'click', content: trendsContext(result)
          });
          $this.popover('toggle');
        });
    }).on("click", "[data-action=pictures]",
    function() {
      $picUpload.toggle();
    }).on("click", "[data-action=user-remove]",
    function() {
      var yes = confirm('确定要注销该帐号？');
      if (!yes) return;
      var $this = $(this),
        uid = $this.data('uid');
      User.removeUser({uid: uid});
      var users = User.getUserList();
      if (users.length) {
        var user = users[0];
        User.setUser(user);
        fetch('switch_user', {uid: uid, token: user.token}).done(function() {
          location.reload();
        });
      } else {
        location.href = '/account/end_session';
      }
    }).on("click", "[data-action=user-switch]",
    function() {
      var $this = $(this),
        uid = $this.data('uid');
      var users = User.getUserList(),
        user = $.grep(users, function(u) {
          return u.uid == uid;
        })[0];
      User.setUser(user);
      fetch('switch_user', {uid: uid, token: user.token}).done(function() {
        location.reload();
      });
    }).on("mousedown", "[data-action=popup-users]",
    function() {
      var users = User.getUserList();
      if (users.length) {
        $.each(users, function(i, u) {
          fetch('users/show/' + u.uid).done(function(result) {
            $.extend(u, result);
            User.saveUser(u);
            if (i == users.length - 1) {
              $userList.html(userListContext(users));
            }
          });
        });
      }
    }).on("click", "[data-action=choose-emotion],[data-action=choose-trend]",
    function() {
      var $this = $(this),
        status = $statusUpdateTextarea.val();
      $statusUpdateTextarea.val(status + ' ' + $this.attr('title'));
    }).on("click", "[data-action=send-mail]",
    function() {
      fetch('options/sendmail').done(function(result) {
        if (result && result.error) {
          alert(result.error);
        } else {
          alert('发送成功');
        }
      });
    });

  //  初始化本地提交图片预览
  imagepreview($('#J_pic_upload_file')[0], $("#J_pic_preview")[0], function(info) {
    console.log("文件名:" + info.name + "\r\n图片原始高度:" + info.height + "\r\n图片原始宽度:" + info.width);
    isOnlinePic = false;
    //这里若return false则不预览图片

    /*$("#preview").css({
     background: "none"
     });

     $("#preview").crop( function(e){
     $("input[type='hidden']").val([e.top, e.left, e.height, e.width].toString());
     }, ".thumb");*/
  });
  //  初始化url图片预览
  $J_pic_online.on('change', function(e) {
    var $this = $(this),
      val = $.trim($this.val());
    if (/^http/.test(val)) {
      isOnlinePic = true;
      $('#J_pic_preview').empty().html('<img src="' + val + '" />');
    } else {
      alert('请输入有效的图片在线地址');
    }
  });

  var isOnlinePic = false;
  $statusUpdate.click(function() {
    var $pic = $pic_preview.find('img'),
      hasPic = $pic.length != 0;
    if (hasPic) {
      if (!isOnlinePic) {
        $uploadPicForm.submit();
      } else {
        fetch('statuses/upload_url_text', {status: $.trim($statusUpdateTextarea.val()), url: $.trim($J_pic_online.val()) })
          .done(
          function(result) {
            var err = result.error;
            if (err) {
              alert(err);
            } else {
              location.href = '/statuses/user_timeline/' + result.user.id;
            }
          });
      }
    } else {
      fetch('statuses/update', {status: $.trim($statusUpdateTextarea.val())})
        .done(
        function(result) {
          var err = result.error;
          if (err) {
            alert(err);
          } else {
            location.href = '/statuses/user_timeline/' + result.user.id;
          }
        });
    }
  });

  $picUploadForm.change(function() {
    var status = $statusUpdateTextarea.val();
    fetch('statuses/upload', {status: status}).done(
      function(result) {
        console.log(result);
      });
    /*fetch('statuses/upload', {status: status, pic: $picUploadFile[0].files}).done(
     function(result) {
     console.log(result);
     });*/
//    $.ajax({
//      url: api + 'statuses/upload',
//      data: 'abcd' || $picUploadFile[0].files,
//      contentType: 'multipart/form-data',
//      type: 'POST',
//      success: function(data) {
//        alert(data);
//      }
//    });
  });

  // todo BAD SMELL
  var socket = io.connect('http://localhost:3003/');
  socket.on('remind/unread_count', function(data) {
    if (data.status ||
      data.follower ||
      data.cmt ||
      data.mention_status ||
      data.mention_cmt) {
      $('.unread-alert').remove();
      $body.append(unreadContext(data));
    }
  });

  return Router;
});
