const logger = console;
const jst = [2, 6, 9, 10, 14, 18, 21, 22];
Promise.all(jst.map(
  v => Promise.resolve(v - 9 - 1)
  .then(h => h < 0 ? h + 24 : h),
))
.then(list => logger.info(list.join(',')));
