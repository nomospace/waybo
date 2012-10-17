// UBB 内容转换
function ubbCode(str) {
  if (!str) return '';
  var reg = new RegExp("(^|[^/=\\]'\">])((www\\.|http[s]?://)[\\w\\.\\?%&\\-/#=;!\\+]+)", "ig"),
    reg2 = new RegExp("\\[url=((www\\.|http[s]?://)[\\w\\.\\?%&\\-/#=;:!\\+]+)](.+)\\[/url]", "ig");
  var tmp = reg.exec(str);
  if (tmp && tmp.length > 0) {
    str = str.replace(reg, "<a href='" + tmp[2] + "' target='_blank'>" + tmp[2] + "</a>");
  }
  tmp = reg2.exec(str);
  if (tmp && tmp.length > 0) {
    str = str.replace(reg2, "<a href='" + tmp[1] + "' target='_blank'>" + tmp[3] + "</a>");
  }
  return str;
}

exports.ubbCode = ubbCode;
