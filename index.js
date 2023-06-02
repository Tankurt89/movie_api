import express, { application } from 'express';
import morgan from 'morgan';
import { createWriteStream } from 'fs';
import path, { join } from 'path';
import methodOverride from 'method-override';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import * as Models from './models.js';
import {check, validationResult} from 'express-validator';
import MaskData from 'maskdata';
import jwt from 'jsonwebtoken';

// mongoose.connect('mongodb://127.0.0.1:27017/[movieDB]', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const Movies = Models.Movie;
const Users = Models.User;
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const maskJSONOptions = {
    maskWith: "*",
    fields: ['Password', '_id', 'Birthday', 'Email']
}

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

import cors from 'cors';

app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1 ){
            let message = 'The CORS policy for this application does not allow access from origin' + origin;
            return callback(new Error(message), false);
        }
    }
}))

import { auths } from './auth.js';
import passport from 'passport';
import ('./passport.js');
auths(app);

const accessLogStream = createWriteStream(join(__dirname, 'log.txt'), {flags: 'a'});

app.use(morgan('common'));

app.use(morgan('combined', {stream: accessLogStream}));

//message on the homepage
app.get('/', (req, res) => {
    res.send('Hello and Welcome to my API for movies');
});

app.get('/login', (req, res) => {
    res.send('Please make sure you post to login');
});

//displays the documentation page
app.get('/documentation', (req, res) =>{
    res.sendFile('public/documentation.html', {root: __dirname});
});

app.get('/users', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Users.find()
      .then((Users) => {
        let maskUsers = [];
        for (let i=0; i<Users.length; i++) {maskUsers[i] = MaskData.maskJSONFields(Users[i], maskJSONOptions);}
        res.status(201).json(maskUsers);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

//returns a list of all the movies for users
app.get('/movies', passport.authenticate('jwt', {session: false, failureRedirect: "/login" }), (req, res) => {
    Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
//returns a specific movie based on the title
app.get('/movies/:title', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Movies.findOne({ Title: req.params.title })
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
//returns all movies with a specific genre name
app.get('/movies/genres/:genreName', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Movies.find({ 'Genre.Name': req.params.genreName })
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});
//return a list of movies by a specific director
app.get('/movies/directors/:directorName', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Movies.find({ 'Director.Name': req.params.directorName })
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      res.status(500).send('Error: ' + err);
    });
});
//returns a specific user
app.get('/users/:Username', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Users.findOne({ Username: req.params.Username})
      .then((Users) => {
        let maskUsers = [];
        for (let i=0; i<Users.length; i++) {maskUsers[i] = MaskData.maskJSONFields(Users[i], maskJSONOptions);}
        res.status(201).json(maskUsers);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

//add a new user and adds them to the user list
app.post('/users', [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array()});
    }
    let hashedPassword = Users.hashPassword(req.body.Password)
    Users.findOne({ Username: req.body.Username })
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
        Users
            .create({
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user) => {res.status(201).json(user)})
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
    }  
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

//update username
app.put('/users/:Username',  passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },
      { $set: 
        {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }
      },
      { new: true })
      .then((updatedUser) => {
        if (!updatedUser) {
            return res.status(400).send('Error: No user was found');
        } else {
            res.json(updatedUser);
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
  });
})
//updates the users favorite movie list
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },{
        $addToSet: { FavoriteMovies: req.params.MovieID }
        },
        { new: true })
        .then((updatedUser) => {
            if(!updatedUser) {
                return res.status(400).send('Error: Movie not found');
            }else{
                res.json(updatedUser);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
    });
})    
//delete a user by their username
app.delete('/users/:Username/:Email', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res, next) => {
  Users.findOneAndRemove({ _id: new ObjectID(req.params.id),
    userID: req.user._id,
  }
  .then((user) => {
        if (user != user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      }));
});

//remove a movie from users fav
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false, failureRedirect: "/login"}), (req, res) => {
	Users.findOneAndUpdate(
		{ Username: req.params.Username },
		{
		$pull: { FavoriteMovies: req.params.MovieID },
		},
		{ new: true })
		.then((updatedUser) => {
			if (!updatedUser) {
				return res.status(404).send('Error: User not found');
			} else {
				res.json(updatedUser);
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error: ' + error);
		});
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An Error Ocurred')
});

const port = process.env.PORT || 8080; 
app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port' + port)
});


