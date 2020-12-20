var express = require('express');
var passport = require('passport');

var router = express.Router();

const Phone = require("./models/phones")
const Cart = require('./models/carts')


var User = require('./models/user');

var router = express.Router();

router.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated()
    res.locals.session = req.session;
    res.locals.currentUser = req.user;
    res.locals.errors = req.flash('error');
    res.locals.info = req.flash('info');
    next();
});

router.get('/', function (req, res, next) {
    User.find()
        .sort({
            createdAt: 'descending'
        })
        .exec(function (err, users) {
            if (err) {
                return next(err);
            }
            res.render('index', {
                users: users,
                search: []
            });
        });
});

router.get('/signup', function (req, res) {
    res.render('signup');
})

router.post('/signup', function (req, res, next) {
    var username = req.body.user;
    var password = req.body.password;

    User.findOne({
        username: username
    }, function (err, user) {
        if (err) {
            return next(err);
        }
        if (user) {
            req.flash('error', 'User already exists');
            return res.redirect('/login');
        }

        var newUser = new User({
            username: username,
            password: password
        });
        newUser.save((err, result)=>{
            res.redirect('/')
        });

    });
}, passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/signup",
    failureFlash: true
}));


router.get('/phones', (req, res)=>{
    Phone.find()
    .then((result)=>{
        res.render('phones',{phones: result})
    })
    .catch((err)=>{
        console.log(err)
    })
    
})

router.get('/search', (req, res) => {
    const searchParams = req.query.q
    Phone.find({ name: {'$regex': searchParams, '$options': 'i'}})
    .then((result) => {
        User.find()
        .sort({
            createdAt: 'descending'
        })
        .exec(function (err, users) {
            if (err) {
                return next(err);
            }
            res.render('index', {
                users: users,
                search: result
            });
        });
    })
    .catch((err)=>{
        console.log(err)
    })
})

router.get('/phones/:id',(req,res)=>{
    const id = req.params.id;
   // console.log(id)
    Phone.findById(id)
    .then((result)=>{
      // console.log(result)
       res.render("details", {phone: result})
    })
    .catch((err)=>{
        console.log(err)
    })
    
})


router.get('/add-to-cart/:id', (req, res, next)=>{
    let productId = req.params.id;
    let cart = new Cart(req.session.cart ? req.session.cart : {})
    Phone.findById(productId, (err, phone)=>{
        if(err){
            return res.redirect('/')
        }
        cart.add(phone, phone.id);
        req.session.cart = cart;
        //let order = new Order
       console.log(req.session.cart)
       res.redirect('/')
       console.log(req.session.cart.generateArray().length)
      // console.log(req.session.cart.generateArray()[0].item.name) 
     // console.log(req.session.cart.generateArray())
      //console.log(req.session.cart.totalQty)
      //  console.log(cart.totalQty)
   //  const order = new Order({
        // user: req.user,
        // order : cart
     // })
      //order.save((err, result)=>{
        //res.redirect('/phones')
      //}) 
    })
   
})



router.get("/users/:username", function (req, res, next) {
    User.findOne({
        username: req.params.username
    }, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(404).send('404: File not found!');
        }
        res.render("profile", {
            user: user
        });
    });
});

router.get('/login', function (req, res) {
    res.render('login')
});

router.post('/login', passport.authenticate('login', {
    successRedirect: "/",
    failureRedirect: "/signup",
    failureFlash: true
}));

router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

router.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated()
    res.locals.session = req.session;
    res.locals.currentUser = req.user;
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
});

router.get("/edit", ensureAuthenticated, function (req, res) {
    res.render("edit");
});

router.post("/edit", ensureAuthenticated, function (req, res, next) {
    req.user.displayName = req.body.displayname;
    req.user.bio = req.body.bio;
    req.user.save(function (err) {
        if (err) {
            next(err);
            return;
        }
        req.flash("info", "Profile updated!");
        res.redirect("/edit");
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash("info", "You must be logged in to see this page.");
        res.redirect("/login");
    }
}

module.exports = router;