const { gzipSync, gunzipSync } = require('zlib');

const gst = 'H4sIAAAAAAAAA';
const gpr = new RegExp(`^${gst}`);

const encode = value => {
  return Buffer.from(gzipSync(Buffer.from(value))).toString('base64').replace(gpr, '');
};
const decode = value => {
  return Buffer.from(gunzipSync(Buffer.from(`${gst}${value}`, 'base64'))).toString();
};

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });

const main = () => {
  const obj = {};

  const user = new Proxy(obj, {
    set: (target, key, value) => {
      target[key] = encode(value);
      return target[key];
    },
    get: (target, key) => decode(target[key]),
  });

  user.name = 'かいじゃりすいぎょのすいぎょうまつうんらいまつふうらいまつ';

  console.info('obj', obj);
  console.info(obj.name);
  console.info('---');
  console.info('user', user);
  console.info(user.name);
};

main();
