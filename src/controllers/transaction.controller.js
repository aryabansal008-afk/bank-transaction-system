const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const transactionRoutes = require("../routes/transaction.routes");

async function createTransaction(req,res){
    const {fromAccount,toAccount,amount,idempotencyKey} = req.body;
    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"FromAccount, toAccount, amount and idempotency Key are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    }

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({
                message:"Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message:"Transaction is pending"
            })
        }
        if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({
                message:"Transaction attempt failed, try again"
            })
        }
        if(isTransactionAlreadyExists.status ==="REVERSED"){
            return res.status(500).json({
                message:"Transaction is reversed, try again"
            })
        }
    }

    if(fromUserAccount.status!=="ACTIVE" || toUserAccount.status!=="ACTIVE"){
        return res.status(400).json({
            message:"Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    const balance = await fromUserAccount.getBalance();

    if(balance<amount){
        return res.status(400).json({
            message:`Insufficient balance. Current balance is ${balance}. Requested balance is ${balance}.`
        })
    }

    try{
        const session  = await mongoose.startSession()
        session.startTransaction()

        const transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING"
        }],{session}))[0]

        const debitLedgerEntry = await ledgerModel.create([{
            account:fromAccount,
            amount:amount,
            transaction:transaction._id,
            type:"DEBIT"
        }],{
            session
        })

        await(()=>{
            return new Promise((resolve)=>setTimeout(resolve,10*1000));
        })()

        const creditLedgerEntry = await ledgerModel.create([{
            account:toAccount,
            amount:amount,
            transaction:transaction._id,
            type:"CREDIT"
        }],{
            session
        })

        await transactionModel.findOneAndUpdate(
            {_id:transaction._id},
            {status:"COMPLETED"},
            {session}
        )

        await session.commitTransaction();
        session.endSession();
    } catch(error){
        return res.status(400).json({
            message:"Transaction failed due to an error",
            error:error.message
        })
    }

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);

            return res.status(201).json({
                    message:"Transaction completed successfully",
                    transaction:transaction
            })
}

    async function createInitialFundsTransaction(req,res){
        const {toAccount,amount,idempotencyKey} = req.body;

        if(!toAccount || !amount || !idempotencyKey){
            return res.status(400).json({
                message:"toAccount, amount and idempotency Key are required"
            })
        }
        const toUserAccount = await accountModel.findOne({
            _id:toAccount,   
        })
        if(!toUserAccount){
            return res.status(400).json({
                message:"Invalid toAccount"
            })
        }

        const fromUserAccount = await accountModel.findOne({
            systemUser:true,
            user:req.user._id
        })
        if(!fromUserAccount){
            return res.status(400).json({
                message:"System user account not found"
            })
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        const transaction = await transactionModel.create({
            fromAccount:fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING"
        },{session})

        const debitLedgerEntry = await ledgerModel.create({
            account:fromUserAccount._id,
            amount:amount,
            transaction:transaction._id,
            type:"DEBIT"
        },{session})

        const creditLedgerEntry = await ledgerModel.create({
            account: toAccount,
            amount:amount,
            transaction:transaction._id,
            type:"CREDIT"
        },{session})

        transaction.status = "COMPLETED";
        await transaction.save({session})

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
            message:"Initial funds transaction completed successfully.",
            transaction:transaction
        })
    }

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}