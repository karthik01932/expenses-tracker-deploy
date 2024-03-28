const Download = require('../models/download');
const Expense = require('../models/expense');
const User = require('../models/users');
const seqeulize = require('../util/database');
const AWS = require('aws-sdk');

const addExpense = async (req, res, next) => {
    const t = await seqeulize.transaction();
    try {
      if (!req.body.category) {
        throw new Error('Category is mandatory')
      }

      const expense = req.body.expense;
      const desc = req.body.desc;
      const category = req.body.category;
  
      if (!expense || !expense?.length) {
        return res.status(400).json({ success: false, message: 'Parameters missing' })
      }
  
      const data = await Expense.create({ expense: expense, desc: desc, category: category, userId: req.user.id }, { transaction: t })
      const totalExpense = Number(req.user.totalExpenses) + Number(expense)
  
      await User.update({
        totalExpenses: totalExpense
      }, {
        where: { id: req.user.id },
        transaction: t
      }
      )
      await t.commit();
      res.status(201).json({ newExpenseDetail: data });
  
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        success: false, error: err
      })
    }
}
   
  
const getExpense = async (req, res, next) => {
    try {
      const pagesize = 2;
      const page = + req.params.page || 1;
      let totalItems = await Expense.count();
      console.log(totalItems);
      const expenses = await Expense.findAll({
        where: { userId: req.user.id },
        offset: (page - 1) * pagesize,
        limit: pagesize
      });
      res.status(200).json({
        allExpenses: expenses,
        currentPage: page,
        hasNextPage: pagesize * page < totalItems,
        nextPage: page + 1,
        hasPreviousPage: page > 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / pagesize),
  
      });
    } catch (error) {
      console.log('Get expense is failing', JSON.stringify(error))
      res.status(500).json({ error: error })
    }
}


const deleteExpense = async (req, res) => {
    const t = await seqeulize.transaction();
    try {
  
      if (req.params.id == 'undefined' || req.params.id.length === 0) {
        console.log('ID is missing')
        return res.status(400).json({ success: false, err: 'ID is missing' })
      }
      const eId = req.params.id
      const expense = await Expense.findByPk(eId)
      const expenseamt = expense.expense;
      const noofrows = await Expense.destroy({ where: { id: eId, userId: req.user.id } }, { transaction: t })
      const totalExpense = Number(req.user.totalExpenses) - Number(expenseamt)
  
  
      await User.update({
        totalExpenses: totalExpense
      }, {
        where: { id: req.user.id },
        transaction: t
      }
      )
      await t.commit();
  
      if (noofrows === 0) {
        return res.status(404).json({ success: false, message: 'Expense doesnt belong to the user' })
      }
      res.status(200).json({ success: true, message: "Deleted Successfully" });
    } catch (err) {
      await t.rollback();
      console.log(err);
      res.status(500).json(err)
    }
}

async function uploadToS3(data, filename) {
    const BUCKET_NAME = process.env.BUCKET_NAM;
    const IAM_USER_KEY = process.env.IAM_USER_KE;
    const IAM_USER_SECRET = process.env.IAM_USER_SECRE;

  
    let s3bucket = new AWS.S3({
      accessKeyId: IAM_USER_KEY,
      secretAccessKey: IAM_USER_SECRET
    })
  
    s3bucket.createBucket(() => {
      var params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: data,
        ACL: 'public-read'
      }
      return new Promise((resolve, reject) => {
        s3bucket.upload(params, (err, s3response) => {
          if (err) {
            console.log('Something Went Wrong', err)
            reject(err);
          }
          else {
            console.log('success',s3response.Location);
            resolve(s3response.Location);
          }
        })
      })  
    })
  
  
  }



const downloadExpenses = async (req, res) => {
    try {
      const expenses = await Expense.findAll({ where: { userId: req.user.id } });
      const userId = req.user.id;
      const totalExpenses = req.user.totalExpenses;
      console.log(totalExpenses);
      const stringifiedExpenses = JSON.stringify(expenses);
      const filename = `Expense${userId}/${totalExpenses}.txt`;
      const fileurl = ` https://etrackerapp.s3.amazonaws.com/Expense${userId}/${totalExpenses}.txt`
  
      const fileURL = await uploadToS3(stringifiedExpenses, filename);
      setTimeout(() => {
        res.status(201).json({ fileURL: fileurl, success: true })
      }, 3000);
  
      const data = await Download.create({ name: filename, link: fileurl, userId: req.user.id })
      res.status(201);
  
  
    } catch (err) {
      console.log(err)
      res.status(500).json({ fileURL: '', success: 'false', err: err })
    }
  
  };
  
  const downloadFile = async (req, res) => {
    try {
      const files = await Download.findAll({ where: { userId: req.user.id } });
      res.status(200).json({ allExpenses: files });
  
    } catch (error) {
      console.log('Get expense is failing', JSON.stringify(error))
      res.status(500).json({ error: error })
  
    }
  
  }





module.exports = {
    addExpense,
    getExpense,
    deleteExpense,
    downloadExpenses,
    downloadFile
};