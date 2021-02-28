const logger = console;
const jst = [2, 6, 9, 10, 14, 18, 21, 22];
Promise.all(jst.map(
  v => Promise.resolve(v - 9 - 1)
  .then(v => v < 0 ? v + 24 : v)
))
.then(list => logger.info(list.join(',')));
