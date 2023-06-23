import jwt from  'jsonwebtoken';
import passport from 'passport';
import * as router from './passport.js';
import ("./passport.js")

let jwtSecret = 'your_jwt_secret';
let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user._id,
        expiresIn: '7d',
        algorithm: 'HS256' })
}

let auths = (router) => {
        router.post('/login',
         passport.authenticate('local', { session: false }), (req, res) => {
            let token = generateJWTToken(req.user.toJSON());
            let reply = { username: req.user.Username, token: token };
            res.status(200).json(reply);
        });
    }

export {auths}