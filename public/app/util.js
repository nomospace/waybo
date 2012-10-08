define(function() {
  return {
    /**
     * 时间对象的格式化
     * @param {Object} date
     * @param {Object} format
     * eg:"yyyy-MM-dd hh:mm:ss"
     */
    format: function(date, format) {
      format || (format = 'yyyy-MM-dd hh:mm:ss');
      var date = new Date(date), o = {
        "M+": date.getMonth() + 1, // month
        "d+": date.getDate(date), // day
        "h+": date.getHours(date), // hour
        "m+": date.getMinutes(date), // minute
        "s+": date.getSeconds(date), // second
        "q+": Math.floor((date.getMonth(date) + 3) / 3), // quarter
        "S": date.getMilliseconds(date) // millisecond
      }

      if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (date.getFullYear(date) + "").substr(4 -
          RegExp.$1.length));
      }

      for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
          format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
      }
      return format;
    }
  }
});
