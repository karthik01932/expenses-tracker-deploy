const express = require('express');

const router= express.Router();

const usercontroller= require('../controller/expense');
const userauthentication = require('../middleware/auth')

router.post('/add-expense',userauthentication.authenticate ,usercontroller.addExpense);

router.get('/download', userauthentication.authenticate, usercontroller.downloadExpenses);

router.get('/get-expense/:page',userauthentication.authenticate ,usercontroller.getExpense);

router.delete('/delete-expense/:id',userauthentication.authenticate, usercontroller.deleteExpense);

router.get('/download-expense', userauthentication.authenticate, usercontroller.downloadFile);

module.exports= router;