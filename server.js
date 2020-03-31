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

app.get('/api/getreviewerbyid', (req,res) => {
  let id = req.query.id

  User.findById(id, (err, doc) => {
    if(err) return res.status(400).send(err)
    res.json({
      name: doc.name,
      lastname: doc.lastName
    })
  })
})

app.get('/api/getusers', (req, res) => {
  User.find({},(err, users) => {
    if(err) return res.status(400).send(err)

    //filter some info - we dont want to expose passwords, roles
    const userRes = users.map((user) => {
      return {_id: user._id, email: user.email, name: user.name, lastName: user.lastName}
    })

    res.status(200).send(userRes)
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

app.post('/api/register',(req, res) => {
  const user = new User(req.body)

  user.save((err, doc) => {
    if(err) return res.json({success: false})
    res.status(200).json({
      success: true,
      user: doc
    })
  })
})

app.post('/api/login', (req, res) => {
  User.findOne({'email': req.body.email}, (err, user) => {
    if(!user) return res.json({isAuth: false, message: 'Auth failed, email not found'})
    user.comparePassword(req.body.password, (err, isMatch) => {
      if(!isMatch) return res.json({
        isAuth: false,
        message: 'Wrong password'
      })

      user.generateToken((err, user) => {
        if(err) return res.status(400).send(err)
        //send user data as a response cookie
        res.cookie('auth', user.token).json({
          isAuth: true,
          id: user._id,
          email: user.email
        })
      })
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
