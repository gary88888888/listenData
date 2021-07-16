const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');
// console.log(MySQLEvents.STATEMENTS)
const program = async () => {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '0981472880',
  });

  const instance = new MySQLEvents(connection, {
    startAtEnd: true,
    excludedSchemas: {
      mysql: true,
    },
  });

  await instance.start();

  instance.addTrigger({
    name: 'monitioring',
    expression: 'delta.*',
    statement: MySQLEvents.STATEMENTS.ALL,
    onEvent: (event) => { // You will receive the events here
      console.log(event);
    },
  });

  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
};

program()
  .then(() => console.log('Waiting for database events...'))
  .catch(console.error);