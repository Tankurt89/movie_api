import passport from 'passport';
import LocalStrategy from 'passport-local';
import * as Models from './models.js';
import passportJWT from 'passport-jwt';


let Users = Models.User,
JWTStrategy = passportJWT.Strategy,
ExtractJWT = passportJWT.ExtractJwt;
passport.use(new LocalStrategy( { usernameField: 'Username', passwordField: 'Password' }, (username, password, done) => {
    console.log("New attempt: " + username + ' ' + password);
    Users.findOne({Username: username}).then( (user) => {
        if (!user) { return done(null, false); }
        if (!user.validatePassword(password)) {return done(null, false);}
        return done(null, user);
    }).catch( (err) => {
        return done(err);
    });
}));

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
}, (jwtPayload, done) => { //jwtPayload contains decrypted contents of Authorization: bearer <token>
    Users.findById(jwtPayload._id).then((user) => {
        if (!user) {return done(null, false)}; // if user does not exist, do not authorize
        if (jwtPayload.exp < Date.now()/1000 ){return done(null, false)}; //if token is expired decline authorization.
        return done(null, user); // (success) populate req.user in express
    })
    .catch((error) => {
        return done(error)
    })
}))

export {Users, JWTStrategy, ExtractJWT}
