import jwt from  'jsonwebtoken';
import passport from 'passport';
import * as router from './passport.js';

let jwtSecret = 'your_jwt_secret';
let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username,
        expiresIn: '7d',
        algorithm: 'HS256' })
}

let auths = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (error, user, info) => {
            console.log(error);
          if (error || !user) {
            return res.status(400).json({
              message: 'Something is not right',
              user: user
            });
          }
          req.login(user, { session: false }, (error) => {
            if (error) {
              res.send(error);
            }
            let token = generateJWTToken(user.toJSON());
            return res.json({user, token});
          });
        })(req, res);
      });
    }

export {auths}