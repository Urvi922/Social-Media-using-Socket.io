const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');


module.exports = {
    createUser: async function({ userInput }, req) {  
        try {
            const errors = [];
            // const email = args.userInput.email;
            if(!validator.isEmail(userInput.email)) {
                errors.push({ message: 'Email is invalid' });
            }
            if (
                validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })
            ) {
                errors.push({ message: 'Password too short'});
            }
            if (errors.length > 0) {
                const error = new Error('Invalid input');
                error.data = errors;
                error.code = 422;
                throw error;
            }
            const existingUser = await User.findOne({ email: userInput.email });
            if(existingUser) {
                const error = new Error('User exists already!');
                throw error;
            }

            const hashedPw = await bcrypt.hash(userInput.password, 12);
            const user = new User({
                email: userInput.email,
                name: userInput.name,
                password: hashedPw
            });
            // console.log(user.posts);
            // console.log(user.posts)

            const createdUser = await user.save();
            return { ...createdUser._doc, _id: createdUser._id.toString() }; 
        } catch (err)  {
            console.error('Error creating user', err);
            throw err;
        }   
    },

    login: async function({ email, password }){
        const user = await User.findOne({ email: email});
        if(!user) {
            const error = new Error('User not found');
            error.code = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if(isEqual) {
            const error = new Error('Password is incorrect');
            error.code = 401;
            throw error;
        }

        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
            }, 
            'somesupersecretsecret',
            { expiresIn: '1h'}
        );
        return { token: token, userId: user._id.toString() };
    },

    createPost: async function({ postInput }, req) {
        const errors =[];
        if(validationResult.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            error.push({message: 'Title is invalid'});

        }
        if(validationResult.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            error.push({message: 'Content is invalid'}); 
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl
        });
        const createdPost = await post.save();

        //Add post to user posts
        return {
            ...createdPost._doc, 
            _id: createdPost._id.toString(), 
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        };
    }
};