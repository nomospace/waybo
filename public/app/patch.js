define(function() {
  'use strict';
  // localStorage
  Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
  };

  Storage.prototype.getObject = function(key) {
    var v = this.getItem(key);
    if (v) {
      try {
        v = JSON.parse(v);
      } catch (err) {
        v = null;
      }
    }
    return v;
  };

  /**
   * 时间对象的格式化
   * @param {Object} format
   * eg:"yyyy-MM-dd hh:mm:ss"
   */
  Date.prototype.format = function(format) {
    format = format || 'yyyy-MM-dd hh:mm:ss';
    var o = {
      "M+": this.getMonth() + 1, //month
      "d+": this.getDate(), //day
      "h+": this.getHours(), //hour
      "m+": this.getMinutes(), //minute
      "s+": this.getSeconds(), //second
      "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
      "S": this.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) {
      format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (var k in o) {
      if (new RegExp("(" + k + ")").test(format)) {
        format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
      }
    }
    return format;
  }

  // 微博字数
  String.prototype.len = function() {
    return Math.round(this.replace(/[^\x00-\xff]/g, "qq").length / 2);
  };
});
