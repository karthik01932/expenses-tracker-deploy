const path = require('path');
//const fs= require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const helmet= require('helmet');
const compression = require('compression');
// const morgan= require('morgan');


const sequelize = require('./util/database');

const User=require('./models/users.js');
const Expense=require('./models/expense.js');
const Order = require('./models/orders.js');
const Forgotpassword = require('./models/forgotpassword');
const Download= require('./models/download.js');




var cors=require('cors');

const app = express();

const dotenv = require('dotenv');

// get config vars
dotenv.config();


app.use(cors());
app.use(helmet());
app.use(compression());
// app.use(morgan('combined'))

app.set('views', 'views');

const userRoutes=require('./routes/user');
const expenseRoutes=require('./routes/expense');
const purchaseRoutes = require('./routes/purchase');
const premiumFeatureRoutes = require('./routes/premiumFeature');
const resetPasswordRoutes = require('./routes/resetpassword')


app.use(bodyParser.json({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/user',userRoutes);
app.use('/expense',expenseRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/premium', premiumFeatureRoutes);
app.use('/password', resetPasswordRoutes);

app.use((req,res)=>{
  console.log(req.url);
  res.sendFile(path.join(__dirname,`views/${req.url}`));
})


User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(Forgotpassword);
Forgotpassword.belongsTo(User);

User.hasMany(Download);
Download.belongsTo(User);

sequelize.sync()
  .then(result => {
    // console.log(result);
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });