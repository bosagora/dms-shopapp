export function truncateString(str, num = 10) {
  if (str.length > num) {
    return str.slice(0, num) + '...';
  } else {
    return str;
  }
}
export function truncateMiddleString(str, num = 10) {
  if (str.length > num) {
    return str.slice(0, num / 2 + 2) + ' ... ' + str.slice(-num / 2);
  } else {
    return str;
  }
}
function toFix(str, dec = 2) {
  const index = str.indexOf('.');
  return str.slice(0, index + (dec + 1));
}

export function convertProperValue(str, dec = 2, trunc = 10) {
  return numberWithCommas(truncateString(toFix(str, dec), trunc));
}

export function numberWithCommas(x) {
  let parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function timePadding(t) {
  return ('0' + t).slice(-2);
}
