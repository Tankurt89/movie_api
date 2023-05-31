# movie_api

movie api

This project is my first attempt at making a function API.

The beginning stages of this had all the information stored inside the index.js.

As the project had started to evolve, a db was built with mongodb and set up via localhost while creating endpoints for all the information that was to be accessed.

This project provided some early hurdles as installing certain dependencies and importing them had caused some conflicts with the code I use using based off the lessons. The biggest thing that I learned to adapt and change was using import/from with es6 instead of const/require.

After that learning to write .then/.catch code was the next step to incorporate those within each of the .get/.post/.put/.delete sections of code.

Once the ground work was laid it was time to use heroku and atlas to but the db information into a live setting that could be accessed and used. The issue that arose with that was the fact that anyone with the correct endpoints could see all the user information. For the solution there were a few things that were tried {hide: true}, {hidden: true}, etc. The solution that ended up working was installing the maskData dependency and using

const maskJSONOptions = {
maskWith: "\*",
fields: ['Password', '_id', 'Birthday', 'Email']
}
The issue that then happened there when putting it into the correct functions that I wanted to use it in was that it was registering but still returning all the users data to anyone who wanted it. So after some digging and talking with another coder we decided to add a for loop

let maskUsers = [];
for (let i=0; i<Users.length; i++) {maskUsers[i] = MaskData.maskJSONFields(Users[i], maskJSONOptions);}
and that worked like a charm.

The project was submitted on 5/29/23 and my mentor sent back a few fixes a couple of endpoints that needed to be fixed that will be noted here when updated.
