const express      = require('express')
const bodyParser   = require('body-parser')
const cookieParser = require('cookie-parser')
const mongoose     = require('mongoose')
const config       = require('./config/config').get(process.env.NODE_ENV)

mongoose.Promise = global.Promise
mongoose.connect(config.DATABASE, { useMongoClient: true })

//models
const { User } = require('./models/user')
const { Book } = require('./models/book')

const app  = express()


//register middleware
app.use(bodyParser.json())
app.use(cookieParser())

//routes

//GET
app.get('/api/getbookbyid', (req, res) => {
  let id = req.query.id

  Book.findById(id, (err, doc) => {
    if(err) return res.status(400).send(err)
    res.send(doc)
  })
})

app.get('/api/getbooks', (req, res) => {
  let skip  = parseInt(req.query.skip)

  //TODO add pager & max limit 100
  let limit = parseInt(req.query.limit)
  let order = req.query.order

  //in reality we are sorting by added date - the _id field contains a timestamp
  //order values = asc || desc
  Book.find().skip(skip).sort({_id:order}).limit(limit).exec((err, doc) => {
    if(err) return res.status(400).send(err)
    res.send(doc)
  })
})

//POST
app.post('/api/addbook', (req,res) => {
  const book = new Book(req.body)

  book.save((err, doc) => {
    if(err) return res.status(400).send(err)
    res.status(200).json({
      post: true,
      bookId: doc._id
    })
  })
})

//UPDATE
app.post('/api/updatebook', (req, res) => {
  Book.findByIdAndUpdate(req.body._id, req.body, {new: true}, (err, doc) => {
    if(err) return res.status(400).send(err)
    res.json({
      success: true,
      doc
    })
  })
})

//DELETE
app.delete('/api/deletebook', (req, res) => {
  let id = req.query.id

  Book.findByIdAndRemove(id, (err, doc) => {
    if(err) return res.status(400).send(err)
    res.json(true)
  })
})

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
