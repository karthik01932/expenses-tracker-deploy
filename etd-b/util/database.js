const Sequelize= require('sequelize');
const dotenv = require('dotenv');

// get config vars
dotenv.config();


const sequelize=new Sequelize(process.env.SQL_SCHEME_NAME, process.env.SQL_ROOT, process.env.SQL_PASSWORD,{
    dialect: 'mysql',
    host: process.env.SQL_HOST
});

module.exports= sequelize;