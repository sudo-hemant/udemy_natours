
// do this before any import
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const fs = require('fs')

const { Tour } = require('../../models/tourModel')

// DATABASE
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
}).then(con => {
  console.log('connected to the DB');
  // console.log(con.connections);
})


const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

const importData = async () => {
  try {
    // for (const tour in tours) {
    await Tour.create(tours);
    console.log('successfully created data using custom file')
    // }

  } catch (err) {
    console.log(err)
  }
  process.exit();
}

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('successfully deleted the entire data')
    process.exit();
  } catch (err) {
    console.log(err);
  }
}

if (process.argv[2] === '--import') {
  importData()
} else if (process.argv[2] === '--delete') {
  deleteData()
}


// console.log(process.argv)

// deleteData();
// importData();