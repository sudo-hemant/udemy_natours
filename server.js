
// do this before any import
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const { app } = require('./app');

const PORT = process.env.PORT || 3000;


// DATABASE
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
}).then(con => {
  console.log('connected to the DB');
  // console.log(con.connections);
})


// port
// configure server with port no

const server = app.listen(PORT, () => {
  console.log(`server is up and running on PORT: ${PORT}`);
})


// NOTE:  GLOBAL ERROR HANDLER, WHEN ANY PROMISE IS REJECTED
//        FOR ASYNC CODE
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLER REJECTION! SHUTTING DOWN...');

  // NOTE:  by doing server.close we are telling server to complete the pending request and then close
  server.close( () => {
    // code : 0 for success and 1 for uncaught exception
    process.exit(1);
  })
})


// NOTE:   GLOBAL ERROR HANDLER,
//        FOR SYNC CODE
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('uncaught exception ! SHUTTING DOWN...');

  // NOTE:  by doing server.close we are telling server to complete the pending request and then close
  server.close( () => {
    // code : 0 for success and 1 for uncaught exception
    process.exit(1);
  })
})

